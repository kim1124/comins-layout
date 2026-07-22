import Foundation
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments
guard arguments.count >= 5 else {
  FileHandle.standardError.write(Data("gif-encode: invalid arguments\n".utf8))
  exit(1)
}

let outputURL = URL(fileURLWithPath: arguments[1])
guard let delay = Double(arguments[2]), delay > 0 else {
  FileHandle.standardError.write(Data("gif-encode: invalid delay\n".utf8))
  exit(1)
}

let frameURLs = arguments.dropFirst(3).map { URL(fileURLWithPath: $0) }
guard let destination = CGImageDestinationCreateWithURL(
  outputURL as CFURL,
  UTType.gif.identifier as CFString,
  frameURLs.count,
  nil
) else {
  FileHandle.standardError.write(Data("gif-encode: destination failed\n".utf8))
  exit(1)
}

let gifProperties: CFDictionary = [
  kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0],
] as CFDictionary
CGImageDestinationSetProperties(destination, gifProperties)

let frameProperties: CFDictionary = [
  kCGImagePropertyGIFDictionary: [
    kCGImagePropertyGIFDelayTime: delay,
    kCGImagePropertyGIFUnclampedDelayTime: delay,
  ],
] as CFDictionary

for frameURL in frameURLs {
  guard
    let source = CGImageSourceCreateWithURL(frameURL as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    FileHandle.standardError.write(Data("gif-encode: frame failed\n".utf8))
    exit(1)
  }
  CGImageDestinationAddImage(destination, image, frameProperties)
}

guard CGImageDestinationFinalize(destination) else {
  FileHandle.standardError.write(Data("gif-encode: finalize failed\n".utf8))
  exit(1)
}
