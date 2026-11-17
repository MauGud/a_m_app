import AppKit
import CoreImage
import Foundation

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1
  ? CommandLine.arguments[1]
  : FileManager.default.currentDirectoryPath)

let context = CIContext(options: [.useSoftwareRenderer: false])

func ciImage(_ relative: String) -> CIImage {
  let url = root.appendingPathComponent(relative)
  guard let image = CIImage(contentsOf: url) else {
    fputs("missing \(url.path)\n", stderr)
    exit(1)
  }
  return image
}

func chromaKey(_ image: CIImage) -> CIImage {
  let kernel = CIColorKernel(source: """
  kernel vec4 chroma(__sample s) {
    float cream = step(0.88, s.r) * step(0.85, s.g) * step(0.80, s.b);
    float nearWhite = step(0.93, s.r) * step(0.93, s.g) * step(0.90, s.b);
    float navy = step(s.r, 0.12) * step(s.g, 0.16) * step(s.b, 0.22);
    float alpha = 1.0 - max(max(cream, nearWhite), navy);
    return vec4(s.rgb, alpha);
  }
  """)
  guard let kernel else {
    fputs("kernel compile failed\n", stderr)
    exit(1)
  }
  return kernel.apply(extent: image.extent, arguments: [image])!
}

func write(_ image: CGImage, to relative: String) {
  let url = root.appendingPathComponent(relative)
  try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  let dest = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, image, nil)
  guard CGImageDestinationFinalize(dest) else {
    fputs("write failed \(relative)\n", stderr)
    exit(1)
  }
  print("wrote \(relative) \(image.width)x\(image.height)")
}

func compose(glyph: CIImage, canvas: Int, fill: CGFloat, red: CGFloat, green: CGFloat, blue: CGFloat) -> CGImage {
  let size = CGFloat(canvas)
  let colorSpace = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(
    data: nil,
    width: canvas,
    height: canvas,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else {
    fputs("cgcontext failed\n", stderr)
    exit(1)
  }
  ctx.setFillColor(CGColor(srgbRed: red, green: green, blue: blue, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  let inset = size * (1 - fill) / 2
  let dest = CGRect(x: inset, y: inset, width: size - inset * 2, height: size - inset * 2)
  guard let glyphCG = context.createCGImage(glyph, from: glyph.extent) else {
    fputs("glyph raster failed\n", stderr)
    exit(1)
  }
  ctx.interpolationQuality = .high
  ctx.draw(glyphCG, in: dest)
  guard let out = ctx.makeImage() else {
    fputs("makeImage failed\n", stderr)
    exit(1)
  }
  return out
}

let glyph = chromaKey(ciImage("docs/brand/logo-on-light.jpg"))
guard let glyphCG = context.createCGImage(glyph, from: glyph.extent) else {
  fputs("glyph export failed\n", stderr)
  exit(1)
}
write(glyphCG, to: "public/logo-mark.png")
write(glyphCG, to: "docs/brand/logo-isotipo.png")
write(compose(glyph: glyph, canvas: 512, fill: 0.78, red: 1, green: 240 / 255, blue: 243 / 255), to: "public/icon-512.png")
write(compose(glyph: glyph, canvas: 192, fill: 0.78, red: 1, green: 240 / 255, blue: 243 / 255), to: "public/icon-192.png")
write(compose(glyph: glyph, canvas: 180, fill: 0.78, red: 1, green: 240 / 255, blue: 243 / 255), to: "public/apple-touch-icon.png")
write(compose(glyph: glyph, canvas: 32, fill: 0.86, red: 1, green: 240 / 255, blue: 243 / 255), to: "public/favicon.png")
write(compose(glyph: glyph, canvas: 192, fill: 0.78, red: 1, green: 240 / 255, blue: 243 / 255), to: "src/app/icon.png")
write(compose(glyph: glyph, canvas: 180, fill: 0.78, red: 1, green: 240 / 255, blue: 243 / 255), to: "src/app/apple-icon.png")
write(compose(glyph: glyph, canvas: 32, fill: 0.86, red: 1, green: 240 / 255, blue: 243 / 255), to: "src/app/favicon.ico")
print("ok")
