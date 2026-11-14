import CoreGraphics

struct StatusBarReadability {
  let darkBackground: Bool
  let whiteClockPixels: Int
  let backgroundRGB: [Int]
}

/// Pixel-only check for the isolated 375pt-wide portrait QA simulator.
/// Uses public CoreGraphics and an explicit RGBA buffer, independent of AX labels.
func statusBarReadability(in image: CGImage) -> StatusBarReadability? {
  let width = image.width
  let height = image.height
  guard width >= 300, height > width else { return nil }
  let stride = width * 4
  var bytes = [UInt8](repeating: 0, count: stride * height)
  return bytes.withUnsafeMutableBytes { raw in
    guard let base = raw.baseAddress,
      let context = CGContext(data: base, width: width, height: height, bitsPerComponent: 8,
        bytesPerRow: stride, space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return nil }
    context.interpolationQuality = .none
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    let pixels = raw.bindMemory(to: UInt8.self)
    let scale = Double(width) / 375.0
    var background = [0, 0, 0]
    for y in 2..<7 {
      for x in 2..<7 {
        let offset = y * stride + x * 4
        for channel in 0..<3 { background[channel] += Int(pixels[offset + channel]) }
      }
    }
    background = background.map { $0 / 25 }
    let dark = background.allSatisfy { $0 < 64 }
    let minY = max(1, Int(scale))
    let maxY = min(height, Int(19 * scale))
    let minX = Int(Double(width) * 0.40)
    let maxX = Int(Double(width) * 0.65)
    var white = 0
    for y in minY..<maxY {
      for x in minX..<maxX {
        let offset = y * stride + x * 4
        if pixels[offset] > 210 && pixels[offset + 1] > 210 && pixels[offset + 2] > 210 { white += 1 }
      }
    }
    return StatusBarReadability(darkBackground: dark, whiteClockPixels: white, backgroundRGB: background)
  }
}
