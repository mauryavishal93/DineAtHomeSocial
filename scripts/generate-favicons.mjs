/**
 * Regenerate tab / PWA icons from `public/logo.png` after updating the brand logo.
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logo = join(root, "public", "logo.png");

await sharp(logo).resize(32, 32, { fit: "inside" }).png().toFile(join(root, "public", "favicon-32.png"));
await sharp(logo).resize(48, 48, { fit: "inside" }).png().toFile(join(root, "public", "icon-48.png"));
await sharp(logo).resize(180, 180, { fit: "inside" }).png().toFile(join(root, "public", "apple-touch-icon.png"));

console.log("Wrote public/favicon-32.png, icon-48.png, apple-touch-icon.png");
