/**
 * Process uploaded images: convert to WebP, compress, preserve quality.
 * Used by event-media, venue-images, and government-id uploads.
 */
import sharp from "sharp";

const WEBP_QUALITY = 88;
const MAX_DIMENSION = 2400;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml"
]);

/**
 * Returns true if the given MIME type is an image we can convert to WebP.
 */
export function isConvertibleImage(mime: string): boolean {
  return IMAGE_MIMES.has(mime.toLowerCase());
}

export type ProcessImageResult = {
  buffer: Buffer;
  mime: string;
  extension: string;
};

/**
 * Convert image buffer to WebP with compression while preserving quality.
 * - Output: WebP, quality 88
 * - Resizes only if larger than MAX_DIMENSION to reduce file size
 * - Returns buffer and metadata for saving
 */
export async function processImageToWebp(
  inputBuffer: Buffer,
  _mime?: string
): Promise<ProcessImageResult> {
  const pipeline = sharp(inputBuffer);

  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const needsResize = w > MAX_DIMENSION || h > MAX_DIMENSION;

  const out = needsResize
    ? pipeline
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 6 })
    : pipeline.webp({ quality: WEBP_QUALITY, effort: 6 });

  const buffer = await out.toBuffer();

  return {
    buffer,
    mime: "image/webp",
    extension: "webp"
  };
}
