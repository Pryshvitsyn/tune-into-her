// macOS/CoreText diagnostic. Reads repository files; writes JSON only to stdout.
import Foundation
import CoreText
import CoreGraphics
import CryptoKit

struct AuditError: Error, CustomStringConvertible { let description: String }
func require(_ condition: Bool, _ message: String) throws {
  if !condition { throw AuditError(description: message) }
}
func capture(_ pattern: String, _ value: String) throws -> [String] {
  let regex = try NSRegularExpression(pattern: pattern)
  guard let match = regex.firstMatch(in: value, range: NSRange(value.startIndex..., in: value)) else {
    throw AuditError(description: "Required source pattern not found")
  }
  return (1..<match.numberOfRanges).map { String(value[Range(match.range(at: $0), in: value)!]) }
}
func sha256(_ value: Data) -> String { SHA256.hash(data: value).map { String(format: "%02x", $0) }.joined() }
struct Command { let type: Int; let points: [[Double]] }
func svgCommands(_ value: String) throws -> [Command] {
  let regex = try NSRegularExpression(pattern: "[A-Za-z]|[-+]?(?:[0-9]*\\.[0-9]+|[0-9]+)(?:[eE][-+]?[0-9]+)?")
  let tokens = regex.matches(in: value, range: NSRange(value.startIndex..., in: value)).map { String(value[Range($0.range, in: value)!]) }
  var result: [Command] = [], index = 0, command = "", x = 0.0, y = 0.0, start = [0.0, 0.0]
  while index < tokens.count {
    if tokens[index].first!.isLetter { command = tokens[index]; index += 1 }
    if command == "Z" { result.append(Command(type: 4, points: [])); x = start[0]; y = start[1]; command = ""; continue }
    let counts = ["M": 2, "L": 2, "H": 1, "V": 1, "C": 6]
    guard let count = counts[command] else { throw AuditError(description: "Unsupported wordmark SVG command: \(command)") }
    try require(index + count <= tokens.count, "Incomplete SVG command")
    let values = try tokens[index..<(index + count)].map { token -> Double in
      guard let number = Double(token) else { throw AuditError(description: "Invalid SVG coordinate") }; return number
    }
    index += count
    let points: [[Double]], type: Int
    if command == "H" { points = [[values[0], y]]; type = 1 }
    else if command == "V" { points = [[x, values[0]]]; type = 1 }
    else { points = stride(from: 0, to: values.count, by: 2).map { [values[$0], values[$0 + 1]] }; type = command == "M" ? 0 : command == "C" ? 3 : 1 }
    x = points.last![0]; y = points.last![1]
    if command == "M" { start = [x, y] }
    result.append(Command(type: type, points: points))
    if command == "M" { command = "L" }
  }
  return result
}
func fontCommands(_ font: CTFont, _ glyph: CGGlyph) -> [Command] {
  var result: [Command] = []
  CTFontCreatePathForGlyph(font, glyph, nil)?.applyWithBlock { item in
    let element = item.pointee
    let count = element.type == .moveToPoint || element.type == .addLineToPoint ? 1 : element.type == .addQuadCurveToPoint ? 2 : element.type == .addCurveToPoint ? 3 : 0
    result.append(Command(type: Int(element.type.rawValue), points: (0..<count).map { [Double(element.points[$0].x), Double(element.points[$0].y)] }))
  }
  return result
}

do {
  let root = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? FileManager.default.currentDirectoryPath)
  let fontPath = "assets/fonts/LinuxLibertineO-Regular.otf", vectorPath = "src/intro/brand.generated.ts"
  let fontURL = root.appendingPathComponent(fontPath), vectorURL = root.appendingPathComponent(vectorPath)
  let fontBytes = try Data(contentsOf: fontURL), vectorBytes = try Data(contentsOf: vectorURL)
  let source = String(decoding: vectorBytes, as: UTF8.self)
  let literal = try capture("(?m)^export const BRAND_BODY = (\".*\");$", source)[0]
  let body = try JSONSerialization.jsonObject(with: Data(literal.utf8), options: [.fragmentsAllowed]) as! String
  let xml = try XMLDocument(xmlString: "<svg>" + body + "</svg>", options: [])
  let paths = try xml.nodes(forXPath: "//path").compactMap { $0 as? XMLElement }
  let wordmarks = paths.filter { $0.attribute(forName: "fill")?.stringValue == "currentColor" && $0.attribute(forName: "d")?.stringValue?.contains("C") == true }
  try require(wordmarks.count == 1, "Expected one filled wordmark outline")
  let wordmark = wordmarks[0], outline = try svgCommands(wordmark.attribute(forName: "d")!.stringValue!)
  let transform = wordmark.attribute(forName: "transform")?.stringValue ?? ""
  let transformValues = try capture("^translate\\(([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)\\)\\s*scale\\(([-+0-9.eE]+)\\)$", transform).map { Double($0)! }
  let descriptors = CTFontManagerCreateFontDescriptorsFromURL(fontURL as CFURL) as! [CTFontDescriptor]
  try require(descriptors.count == 1, "Expected one face in the trusted font file")
  let first = CTFontCreateWithFontDescriptor(descriptors[0], 1000, nil), units = CTFontGetUnitsPerEm(first)
  let font = CTFontCreateWithFontDescriptor(descriptors[0], CGFloat(units), nil)
  let tolerance = 0.0001 // Font units: 1e-7em at 1000 UPEM; allows CoreText float conversion noise.
  var cursor = 0, natural = 0.0, maxDeviation = 0.0, maxSpacingDelta = 0.0, shapeMatch = true
  var rows: [[String: Any]] = []
  for character in "Tune Into Her" {
    var code = String(character).utf16.first!, glyph = CGGlyph(), advance = CGSize()
    try require(CTFontGetGlyphsForCharacters(font, &code, &glyph, 1), "Wordmark glyph missing from actual font")
    CTFontGetAdvancesForGlyphs(font, .horizontal, &glyph, &advance, 1)
    let expected = fontCommands(font, glyph)
    if expected.isEmpty { natural += advance.width; continue }
    try require(cursor + expected.count <= outline.count, "Wordmark outline ended before all glyphs")
    let actual = Array(outline[cursor..<(cursor + expected.count)]); cursor += expected.count
    let origin = actual[0].points[0][0] - expected[0].points[0][0]
    var deviation = 0.0
    for (a, b) in zip(actual, expected) {
      if a.type != b.type || a.points.count != b.points.count { shapeMatch = false; continue }
      for (p, q) in zip(a.points, b.points) { deviation = max(deviation, abs(p[0] - q[0] - origin), abs(p[1] + q[1])) }
    }
    maxDeviation = max(maxDeviation, deviation); maxSpacingDelta = max(maxSpacingDelta, abs(origin - natural))
    rows.append(["character": String(character), "glyphId": glyph, "originUnits": origin, "naturalOriginUnits": natural, "advanceUnits": advance.width, "commandCount": expected.count, "maxCoordinateDeviationUnits": deviation])
    natural += advance.width
  }
  let fontHash = sha256(fontBytes), trustedHash = "6332761e4fc08e30bce6f47e4a08e7d5332abe000ab6ca06c8e86bd88f456114"
  let ofl = try Data(contentsOf: root.appendingPathComponent("assets/fonts/OFL.txt")), distribution = try Data(contentsOf: root.appendingPathComponent("assets/fonts/LICENCE.txt"))
  let passed = fontHash == trustedHash && shapeMatch && cursor == outline.count && maxDeviation <= tolerance && maxSpacingDelta <= tolerance && wordmark.attribute(forName: "stroke") == nil
  let report: [String: Any] = [
    "schemaVersion": 1, "passed": passed, "method": "CoreText glyph paths loaded directly from existing OTF; SVG H/V normalized to L; glyph Y inverted; no system font lookup or font installation",
    "font": ["path": fontPath, "sha256": fontHash, "matchesTrustedUnmodifiedFile": fontHash == trustedHash, "family": CTFontCopyFamilyName(font) as String, "postScript": CTFontCopyPostScriptName(font) as String, "style": CTFontCopyName(font, kCTFontSubFamilyNameKey) as String? ?? "", "version": (CTFontCopyName(font, kCTFontVersionNameKey) as String? ?? "").trimmingCharacters(in: .whitespaces), "unitsPerEm": units],
    "wordmark": ["path": vectorPath, "sourceSha256": sha256(vectorBytes), "text": "Tune Into Her", "transform": transform, "glyphCount": rows.count, "svgCommandCount": outline.count, "matchedFontCommandCount": cursor, "contourCount": outline.filter { $0.type == 0 }.count, "commandShapesMatch": shapeMatch, "maxCoordinateDeviationUnits": maxDeviation, "coordinateToleranceUnits": tolerance, "maxOriginDeviationFromUnkernedAdvancesUnits": maxSpacingDelta, "appliedTrackingOrPairAdjustmentUnits": maxSpacingDelta, "naturalAdvanceUnits": natural, "naturalAdvanceDesignUnits": natural * transformValues[2], "extraStrokeApplied": wordmark.attribute(forName: "stroke") != nil, "uniformScale": transformValues[2], "translation": Array(transformValues[0..<2]), "glyphs": rows],
    "licenseFiles": ["oflPath": "assets/fonts/OFL.txt", "oflSha256": sha256(ofl), "originalDistributionNoticePath": "assets/fonts/LICENCE.txt", "originalDistributionNoticeSha256": sha256(distribution)],
    "limits": ["Establishes equivalence of these existing wordmark glyphs to the trusted font, within explicit numeric tolerance.", "Does not identify the original generating font file byte-for-byte; different font files can share these glyphs.", "Does not prove that the original numbered Variant #8 comparison/approval sample was made with this exact file, style or layout.", "Does not establish native rasterization, visual approval, all-script glyph coverage or store/legal readiness."]
  ]
  let result = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
  FileHandle.standardOutput.write(result); FileHandle.standardOutput.write(Data("\n".utf8))
  if !passed { exit(1) }
} catch { fputs("Font provenance audit failed: \(error)\n", stderr); exit(1) }
