import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function skipSubBlocks(bytes, start) {
  let offset = start;
  while (offset < bytes.length) {
    const size = bytes[offset];
    offset += 1;
    if (size === 0) return offset;
    offset += size;
  }
  throw new Error("gif-inspect: unterminated data block");
}

export async function inspectReadmeGif(path) {
  const bytes = await readFile(path);
  const signature = bytes.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error(`gif-inspect: invalid signature for ${path}`);
  }
  if (bytes.length < 13) {
    throw new Error(`gif-inspect: truncated logical screen for ${path}`);
  }

  const width = bytes.readUInt16LE(6);
  const height = bytes.readUInt16LE(8);
  const packed = bytes[10];
  let offset = 13;
  if ((packed & 0x80) !== 0) {
    offset += 3 * (2 ** ((packed & 0x07) + 1));
  }

  let duration = 0;
  let frameCount = 0;
  let loopCount = null;

  while (offset < bytes.length) {
    const marker = bytes[offset];
    if (marker === 0x3b) break;

    if (marker === 0x21) {
      const label = bytes[offset + 1];
      if (label === 0xf9) {
        const blockSize = bytes[offset + 2];
        if (blockSize !== 4 || offset + 7 >= bytes.length) {
          throw new Error(`gif-inspect: invalid graphic control extension for ${path}`);
        }
        duration += bytes.readUInt16LE(offset + 4) / 100;
        offset += 8;
        continue;
      }

      if (label === 0xff) {
        const applicationLength = bytes[offset + 2];
        const applicationStart = offset + 3;
        const application = bytes
          .subarray(applicationStart, applicationStart + applicationLength)
          .toString("ascii");
        const dataOffset = applicationStart + applicationLength;
        if (application === "NETSCAPE2.0" && bytes[dataOffset] === 3 && bytes[dataOffset + 1] === 1) {
          loopCount = bytes.readUInt16LE(dataOffset + 2);
        }
        offset = skipSubBlocks(bytes, dataOffset);
        continue;
      }

      offset = skipSubBlocks(bytes, offset + 2);
      continue;
    }

    if (marker === 0x2c) {
      if (offset + 9 >= bytes.length) {
        throw new Error(`gif-inspect: invalid image descriptor for ${path}`);
      }
      const imagePacked = bytes[offset + 9];
      offset += 10;
      if ((imagePacked & 0x80) !== 0) {
        offset += 3 * (2 ** ((imagePacked & 0x07) + 1));
      }
      offset += 1;
      offset = skipSubBlocks(bytes, offset);
      frameCount += 1;
      continue;
    }

    throw new Error(`gif-inspect: unknown block 0x${marker.toString(16)} for ${path}`);
  }

  return {
    duration: Number(duration.toFixed(2)),
    frameCount,
    height,
    loopCount,
    signature,
    size: bytes.length,
    width,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) throw new Error("gif-inspect: path is required");
  process.stdout.write(`${JSON.stringify(await inspectReadmeGif(path), null, 2)}\n`);
}
