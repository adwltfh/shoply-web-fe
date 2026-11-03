// Identifies uploaded images by their bytes (never by the browser-supplied MIME
// type or file name) and reads pixel dimensions. Only JPEG, PNG and WebP pass;
// SVG and everything else is rejected.

export type SniffedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
  width: number | null;
  height: number | null;
};

const MAX_DIMENSION = 12000;

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function readU16BE(b: Uint8Array, o: number) {
  return (b[o] << 8) | b[o + 1];
}

function readU32BE(b: Uint8Array, o: number) {
  return ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
}

function readU24LE(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
}

function pngSize(b: Uint8Array) {
  if (b.length < 24 || ascii(b, 12, 4) !== "IHDR") return null;
  return { width: readU32BE(b, 16), height: readU32BE(b, 20) };
}

function jpegSize(b: Uint8Array) {
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) return null;
    const marker = b[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = readU16BE(b, offset + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: readU16BE(b, offset + 5), width: readU16BE(b, offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function webpSize(b: Uint8Array) {
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8X" && b.length >= 30) {
    return { width: readU24LE(b, 24) + 1, height: readU24LE(b, 27) + 1 };
  }
  if (chunk === "VP8 " && b.length >= 30) {
    return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
  }
  if (chunk === "VP8L" && b.length >= 25) {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  let result: SniffedImage | null = null;
  let size: { width: number; height: number } | null = null;

  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    result = { mime: "image/png", ext: "png", width: null, height: null };
    size = pngSize(bytes);
  } else if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    result = { mime: "image/jpeg", ext: "jpg", width: null, height: null };
    size = jpegSize(bytes);
  } else if (bytes.length >= 16 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    result = { mime: "image/webp", ext: "webp", width: null, height: null };
    size = webpSize(bytes);
  }

  if (!result) return null;
  if (size && size.width > 0 && size.height > 0 && size.width <= MAX_DIMENSION && size.height <= MAX_DIMENSION) {
    result.width = size.width;
    result.height = size.height;
  }
  return result;
}
