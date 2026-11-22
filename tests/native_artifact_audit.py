"""Synthetic verifier regression fixtures, never actual distribution-build evidence."""
import argparse
import importlib.util
import io
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('native_audit', Path(__file__).parents[1] / 'scripts/audit-native-artifact.py')
audit = importlib.util.module_from_spec(spec); spec.loader.exec_module(audit)


def elf(alignment=16384, wide=True, endian='<'):
    data = bytearray(120)
    data[:7] = b'\x7fELF' + bytes([2 if wide else 1, 1 if endian == '<' else 2, 1])
    struct.pack_into(endian + 'H', data, 18, 183 if wide else 40)
    struct.pack_into(endian + ('Q' if wide else 'I'), data, 32 if wide else 28, 64 if wide else 52)
    struct.pack_into(endian + 'HH', data, 54 if wide else 42, 56 if wide else 32, 1)
    values = (1, 5, 0, 0, 0, len(data), len(data), alignment) if wide else (1, 0, 0, 0, len(data), len(data), 5, alignment)
    struct.pack_into(endian + ('IIQQQQQQ' if wide else 'IIIIIIII'), data, 64 if wide else 52, *values)
    return bytes(data)


class NativeAuditFixtures(unittest.TestCase):
    def test_both_classes_and_endianness(self):
        for wide in [True, False]:
            for endian in ['<', '>']:
                self.assertEqual(audit.elf_loads(elf(wide=wide, endian=endian)), [{'alignment': 16384, 'offsetCongruent16K': True}])

    def test_real_zip_library_inspection_rejects_4k(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            archive.writestr('base/lib/arm64-v8a/good.so', elf())
            archive.writestr('base/lib/arm64-v8a/old.so', elf(4096))
            archive.writestr('base/lib/armeabi-v7a/old32.so', elf(4096, wide=False))
        with zipfile.ZipFile(buffer) as archive:
            rows = audit.native_libraries(archive)
        self.assertEqual([x['elf16K'] for x in rows], [True, False, False])
        self.assertEqual(rows[0]['elfMachine'], 183)
        self.assertEqual([x['appliesTo16KDevices'] for x in rows], [True, True, False])

    def test_invalid_headers_segments_and_offsets(self):
        for value in [b'notELF', elf()[:90], elf(20000)]:
            with self.assertRaises(ValueError): audit.elf_loads(value)
        data = bytearray(elf()); struct.pack_into('<Q', data, 64 + 16, 1)
        self.assertFalse(audit.elf_loads(data)[0]['offsetCongruent16K'])

    def test_malformed_32bit_library_is_not_hidden_by_64bit_page_policy(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'fixture.aab'
            with zipfile.ZipFile(file, 'w') as archive:
                archive.writestr('base/lib/arm64-v8a/good.so', elf())
                archive.writestr('base/lib/armeabi-v7a/broken.so', b'not ELF')
                archive.writestr('base/assets/index.android.bundle', b'ordinary fixture')
            args = argparse.Namespace(aab=str(file), bundletool=None, jarsigner=None,
                expected_upload_cert=None, apk=None, zipalign=None)
            with patch.object(audit, 'run', return_value=(0, b'jar verified.', b'')):
                _, checks, _ = audit.android_audit(args)
            self.assertTrue(checks['all64BitELF16K'])
            self.assertFalse(checks['allELFHeadersValid'])

    def test_relro_cannot_round_into_following_writable_data(self):
        data = bytearray(elf()); data.extend(bytes(56))
        struct.pack_into('<HH', data, 54, 56, 2)
        struct.pack_into('<IIQQQQQQ', data, 64, 1, 6, 0, 0, 0, len(data), 0x9000, 16384)
        struct.pack_into('<IIQQQQQQ', data, 120, 0x6474e552, 4, 0, 0x4000, 0, 0, 0x1000, 1)
        self.assertFalse(audit.relro_16k(data))
        struct.pack_into('<Q', data, 120 + 40, 0x4000)
        self.assertTrue(audit.relro_16k(data))

    def test_apk_uncompressed_zip_offset_is_checked(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'fixture.apk'
            with zipfile.ZipFile(file, 'w') as archive:
                archive.writestr('lib/arm64-v8a/library.so', elf(), compress_type=zipfile.ZIP_STORED)
            self.assertFalse(audit.apk_zip_alignment(file)[0]['zip16K'])

    def test_ipa_traversal_is_rejected_before_native_tools(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'unsafe.ipa'
            with zipfile.ZipFile(file, 'w') as archive: archive.writestr('../escape', 'unsafe')
            with self.assertRaisesRegex(ValueError, 'Unsafe IPA'): audit.ios_audit(argparse.Namespace(ipa=str(file)))


if __name__ == '__main__':
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeAuditFixtures))
    if not result.wasSuccessful(): raise SystemExit(1)
    print('NATIVE_AUDIT_FIXTURES_PASS')
