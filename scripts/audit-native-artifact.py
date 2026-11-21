#!/usr/bin/env python3
"""Read-only final-artifact audit. Never signs, installs, uploads or changes readiness."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import plistlib
import re
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

PAGE = 16384
ANDROID = '{http://schemas.android.com/apk/res/android}'
QA_MARKERS = (b'STANDALONE_QA_SCOPE_REQUIRED', b'TIH_STANDALONE_QA_BUNDLE')


def elf_loads(data):
    if len(data) < 52 or data[:4] != b'\x7fELF' or data[4] not in (1, 2) or data[5] not in (1, 2):
        raise ValueError('Invalid or truncated ELF')
    endian = '<' if data[5] == 1 else '>'
    wide = data[4] == 2
    if wide and len(data) < 64:
        raise ValueError('Truncated ELF64')
    offset = struct.unpack_from(endian + ('Q' if wide else 'I'), data, 32 if wide else 28)[0]
    size, count = struct.unpack_from(endian + 'HH', data, 54 if wide else 42)
    expected = 56 if wide else 32
    if size < expected or count == 0 or offset + size * count > len(data):
        raise ValueError('Invalid ELF program header table')
    loads = []
    for i in range(count):
        values = struct.unpack_from(endian + ('IIQQQQQQ' if wide else 'IIIIIIII'), data, offset + i * size)
        if values[0] != 1:
            continue
        file_offset, virtual, alignment = (values[2], values[3], values[7]) if wide else (values[1], values[2], values[7])
        file_size, memory_size = (values[5], values[6]) if wide else (values[4], values[5])
        if file_offset + file_size > len(data) or memory_size < file_size or (alignment and alignment & (alignment - 1)):
            raise ValueError('Invalid ELF load segment')
        loads.append({'alignment': alignment, 'offsetCongruent16K': file_offset % PAGE == virtual % PAGE})
    if not loads:
        raise ValueError('ELF has no PT_LOAD segments')
    return loads


def native_libraries(archive):
    rows = []
    for info in archive.infolist():
        if info.filename.endswith('.so'):
            try:
                loads = elf_loads(archive.read(info))
                passed = all(v['alignment'] >= PAGE and v['offsetCongruent16K'] for v in loads)
                data = archive.read(info)
                machine = struct.unpack_from(('<' if data[5] == 1 else '>') + 'H', data, 18)[0]
                applies = bool(re.search(r'/(arm64-v8a|x86_64)/', '/' + info.filename))
                rows.append({'file': info.filename, 'elfMachine': machine, 'elfClass': 64 if data[4] == 2 else 32, 'appliesTo16KDevices': applies, 'sha256': hashlib.sha256(data).hexdigest(), 'loadSegments': loads, 'elf16K': passed and (not applies or data[4] == 2), 'relro16K': relro_16k(data)})
            except (ValueError, struct.error):
                rows.append({'file': info.filename, 'elf16K': False, 'error': 'Invalid ELF program headers'})
    return rows


def relro_16k(data):
    """Reject a partial-page RELRO end that would also protect writable data.

    Android's page-size guide requires inspecting RELRO as well as PT_LOAD.
    Absence of RELRO is not represented as a claim that the security flag exists.
    """
    elf_loads(data)
    endian = '<' if data[5] == 1 else '>'; wide = data[4] == 2
    offset = struct.unpack_from(endian + ('Q' if wide else 'I'), data, 32 if wide else 28)[0]
    size, count = struct.unpack_from(endian + 'HH', data, 54 if wide else 42)
    writable = []; ends = []
    for i in range(count):
        v = struct.unpack_from(endian + ('IIQQQQQQ' if wide else 'IIIIIIII'), data, offset + i * size)
        kind, flags, address, memory_size = v[0], v[1] if wide else v[6], v[3] if wide else v[2], v[6] if wide else v[5]
        if kind == 1 and flags & 2: writable.append((address, address + memory_size))
        if kind == 0x6474e552: ends.append(address + memory_size)
    return all(end % PAGE == 0 or not any(start < ((end + PAGE - 1) // PAGE) * PAGE and finish > end for start, finish in writable) for end in ends)


def apk_zip_alignment(file):
    rows = []
    with zipfile.ZipFile(file) as archive, open(file, 'rb') as raw:
        for info in archive.infolist():
            if not info.filename.endswith('.so'):
                continue
            raw.seek(info.header_offset)
            header = raw.read(30)
            if len(header) != 30 or header[:4] != b'PK\x03\x04':
                raise ValueError('Invalid APK local ZIP header')
            name_size, extra_size = struct.unpack_from('<HH', header, 26)
            offset = info.header_offset + 30 + name_size + extra_size
            rows.append({'file': info.filename, 'compressed': info.compress_type != zipfile.ZIP_STORED, 'zip16K': info.compress_type != zipfile.ZIP_STORED or offset % PAGE == 0})
    return rows


def run(args):
    result = subprocess.run(args, capture_output=True, timeout=120)
    return result.returncode, result.stdout, result.stderr


def android_audit(args):
    file = Path(args.aab)
    with zipfile.ZipFile(file) as archive:
        libraries = native_libraries(archive)
        js = [name for name in archive.namelist() if name.endswith(('index.android.bundle', 'main.jsbundle'))]
        no_qa = bool(js) and all(not any(marker in archive.read(name) for marker in QA_MARKERS) for name in js)
    relevant = [x for x in libraries if re.search(r'/(arm64-v8a|x86_64)/', '/' + x['file'])]
    checks = {'nativeLibrariesPresent': bool(libraries), 'allELFHeadersValid': bool(libraries) and all('error' not in x for x in libraries), 'arm64LibrariesPresent': any('/arm64-v8a/' in x['file'] and x.get('elfMachine') == 183 for x in libraries), 'all64BitELF16K': bool(relevant) and all(x['elf16K'] for x in relevant), 'all64BitRELRO16K': bool(relevant) and all(x.get('relro16K') for x in relevant), 'knownStandaloneQAMarkersAbsent': no_qa}
    if args.bundletool:
        java = args.java or 'java'
        status, output, _ = run([java, '-jar', args.bundletool, 'dump', 'manifest', '--bundle=' + str(file), '--module=base'])
        if status:
            checks['manifestDecoded'] = False
        else:
            manifest = ET.fromstring(output)
            sdk = manifest.find('uses-sdk'); application = manifest.find('application')
            checks.update({'manifestDecoded': True, 'packagePreserved': manifest.get('package') == 'com.pryshvitsyn.tuneintoher', 'targetAPI36OrHigher': sdk is not None and int(sdk.get(ANDROID + 'targetSdkVersion', '0')) >= 36, 'positiveVersionCode': int(manifest.get(ANDROID + 'versionCode', '0')) > 0, 'notDebuggable': application is not None and application.get(ANDROID + 'debuggable', 'false') == 'false', 'billingPermission': any(p.get(ANDROID + 'name') == 'com.android.vending.BILLING' for p in manifest.findall('uses-permission'))})
            version = next((m.get(ANDROID + 'value', '') for m in application.findall('meta-data') if m.get(ANDROID + 'name') == 'com.google.android.play.billingclient.version'), '') if application is not None else ''
            checks['billing8OrHigher'] = bool(re.match(r'^(?:[89]|[1-9]\d)\.', version))
        status, output, _ = run([java, '-jar', args.bundletool, 'dump', 'config', '--bundle=' + str(file)])
        checks['bundleRequests16KZipAlignment'] = status == 0 and b'PAGE_ALIGNMENT_16K' in output
    else:
        checks['manifestDecoded'] = None
        checks['bundleRequests16KZipAlignment'] = None
    status, output, errors = run([args.jarsigner or 'jarsigner', '-verify', str(file)])
    checks['jarSignatureVerified'] = status == 0 and b'jar verified.' in output.lower() and b'unsigned' not in (output + errors).lower()
    if args.expected_upload_cert:
        status, output, errors = run([args.keytool or 'keytool', '-printcert', '-jarfile', str(file)])
        fingerprint = re.search(rb'SHA256:\s*([A-Fa-f0-9:]+)', output + errors)
        expected = re.sub(r'[^a-f0-9]', '', args.expected_upload_cert.lower())
        checks['uploadCertificateMatchesOwnerVerifiedRecord'] = status == 0 and len(expected) == 64 and fingerprint is not None and fingerprint[1].decode().replace(':', '').lower() == expected
        checks['notAndroidDebugCertificate'] = b'CN=Android Debug' not in output
    else:
        checks['uploadCertificateMatchesOwnerVerifiedRecord'] = None
    if args.apk:
        with zipfile.ZipFile(args.apk) as archive:
            apk_libraries = native_libraries(archive)
            with zipfile.ZipFile(file) as bundle:
                payload = {name.removeprefix('base/'): hashlib.sha256(bundle.read(name)).hexdigest() for name in bundle.namelist() if name.startswith('base/') and (name.endswith('.so') or name.endswith('index.android.bundle'))}
            compared = [name for name in archive.namelist() if name.endswith(('.so', 'index.android.bundle'))]
            checks['derivedAPKMatchesAABPayload'] = bool(compared) and any(name.endswith('index.android.bundle') for name in compared) and all(hashlib.sha256(archive.read(name)).hexdigest() == payload.get(name) for name in compared)
        alignment = apk_zip_alignment(args.apk)
        checks['derivedAPKHasNativeLibraries'] = bool(apk_libraries)
        apk_relevant = [x for x in apk_libraries if re.search(r'/(arm64-v8a|x86_64)/', '/' + x['file'])]
        relevant_alignment = [x for x in alignment if re.search(r'/(arm64-v8a|x86_64)/', '/' + x['file'])]
        checks['derivedAPKELFAndZip16K'] = bool(relevant_alignment) and bool(apk_relevant) and all(x['zip16K'] for x in relevant_alignment) and all(x['elf16K'] and x.get('relro16K') for x in apk_relevant)
        checks['officialZipalignPassed'] = run([args.zipalign, '-c', '-P', '16', '-v', '4', args.apk])[0] == 0 if args.zipalign else None
    else:
        checks['derivedAPKELFAndZip16K'] = None
        checks['officialZipalignPassed'] = None
    return file, checks, {'nativeLibraries': libraries, 'pageSizeScope': 'Google requires 16KB compatibility on 64-bit devices: arm64-v8a and x86_64. All ABIs are recorded; 32-bit 4KB alignment is not a 64-bit failure.', 'limits': ['Binary audit does not verify Play App Signing enrollment, resolved Gradle graph, 16KB device execution, notifications, store routing, real purchase/restore or visual icon/splash acceptance.', 'Provide an APK generated from this exact AAB and an independently verified upload certificate. A sideload/debug key is not a Play distribution proof.']}


def ios_audit(args):
    file = Path(args.ipa)
    with tempfile.TemporaryDirectory(prefix='tih-ipa-audit-') as directory:
        dest = Path(directory)
        with zipfile.ZipFile(file) as archive:
            for info in archive.infolist():
                target = (dest / info.filename).resolve()
                if not target.is_relative_to(dest) or ((info.external_attr >> 16) & 0o170000) == 0o120000:
                    raise ValueError('Unsafe IPA archive path or symlink')
            archive.extractall(dest)
            for info in archive.infolist():
                target = dest / info.filename
                if target.is_file() and ((info.external_attr >> 16) & 0o111): target.chmod(0o755)
        apps = list((dest / 'Payload').glob('*.app'))
        if len(apps) != 1: raise ValueError('Expected exactly one IPA application')
        app = apps[0]; plist = plistlib.loads((app / 'Info.plist').read_bytes())
        js = app / 'main.jsbundle'
        checks = {'bundleIdentifierPreserved': plist.get('CFBundleIdentifier') == 'com.eliogenesis.tuneintoher', 'devicePlatform': plist.get('CFBundleSupportedPlatforms') == ['iPhoneOS'], 'ios26SDKOrHigher': bool(re.match(r'^iphoneos(?:2[6-9]|[3-9]\d)(?:\.|$)', plist.get('DTSDKName', ''))), 'Xcode26OrHigher': int(plist.get('DTXcode', '0')) >= 2600, 'nativeAssetsPresent': (app / 'Assets.car').is_file(), 'embeddedJavaScript': js.is_file(), 'knownStandaloneQAMarkersAbsent': js.is_file() and not any(marker in js.read_bytes() for marker in QA_MARKERS), 'strictCodesignVerified': run(['codesign', '--verify', '--deep', '--strict', str(app)])[0] == 0}
        status, _, authority = run(['codesign', '-dvv', str(app)])
        checks['AppleDistributionAuthority'] = status == 0 and b'Authority=Apple Distribution:' in authority
        profile = app / 'embedded.mobileprovision'
        if profile.exists():
            status, output, _ = run(['security', 'cms', '-D', '-i', str(profile)])
            if status: checks['provisioningProfileDecoded'] = False
            else:
                data = plistlib.loads(output); ent = data.get('Entitlements', {}); expiry = data.get('ExpirationDate')
                checks.update({'provisioningProfileDecoded': True, 'AppStoreProfileWithoutDeviceList': 'ProvisionedDevices' not in data and not data.get('ProvisionsAllDevices', False), 'debugEntitlementDisabled': ent.get('get-task-allow') is False, 'profileMatchesBundle': ent.get('application-identifier', '').endswith('.com.eliogenesis.tuneintoher'), 'profileUnexpired': expiry is not None and expiry.replace(tzinfo=datetime.timezone.utc) > datetime.datetime.now(datetime.timezone.utc)})
        else: checks['AppStoreProfileWithoutDeviceList'] = False
    return file, checks, {'limits': ['No App Store Connect upload, agreement, TestFlight processing, real purchase/restore, icon/launch visual acceptance or installed-device behavior is inferred from this binary audit.']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True); group.add_argument('--aab'); group.add_argument('--ipa')
    for option in ['bundletool', 'java', 'jarsigner', 'keytool', 'expected-upload-cert', 'apk', 'zipalign', 'out']:
        parser.add_argument('--' + option)
    args = parser.parse_args()
    try:
        file, checks, details = android_audit(args) if args.aab else ios_audit(args)
        status = 'FAIL' if any(v is False for v in checks.values()) else 'INCOMPLETE' if any(v is None for v in checks.values()) else 'PASS_BINARY_AUDIT_ONLY'
        with file.open('rb') as stream: digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        result = {'status': status, 'artifact': file.name, 'sha256': digest, 'checks': checks, **details, 'storeReadinessChanged': False}
    except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile, subprocess.SubprocessError):
        result = {'status': 'BLOCKED', 'reason': 'Artifact/tool input unavailable or invalid; no artifact verification claimed.', 'storeReadinessChanged': False}
    text = json.dumps(result, indent=2) + '\n'
    if args.out: Path(args.out).write_text(text)
    print(text, end='')
    return 0 if result['status'] == 'PASS_BINARY_AUDIT_ONLY' else 1


if __name__ == '__main__': raise SystemExit(main())
