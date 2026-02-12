import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SVG_PATH = path.join(ROOT, "public/images/talaxy-icon.svg");
const OUT_DIR = path.join(ROOT, "public");

const svgBuffer = await readFile(SVG_PATH);

// ---------- helpers ----------

/** Resize the raw SVG to the given size (no background). */
async function renderPlain(size) {
  return sharp(svgBuffer, { density: Math.round((72 * size) / 24) })
    .resize(size, size)
    .png()
    .toBuffer();
}

/**
 * Render the SVG centred on a solid #060E1A background.
 * The icon is scaled to ~80% of the canvas so it has breathing room.
 */
async function renderWithBackground(size) {
  const iconSize = Math.round(size * 0.8);

  const icon = await sharp(svgBuffer, {
    density: Math.round((72 * iconSize) / 24),
  })
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 6, g: 14, b: 26, alpha: 1 }, // #060E1A
    },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toBuffer();
}

// ---------- generate ----------

const tasks = [
  // plain favicons
  { name: "favicon.ico", size: 32, bg: false },
  { name: "favicon-16x16.png", size: 16, bg: false },
  { name: "favicon-32x32.png", size: 32, bg: false },
  // icons with background
  { name: "apple-touch-icon.png", size: 180, bg: true },
  { name: "android-chrome-192x192.png", size: 192, bg: true },
  { name: "android-chrome-512x512.png", size: 512, bg: true },
];

for (const { name, size, bg } of tasks) {
  const buf = bg ? await renderWithBackground(size) : await renderPlain(size);
  const outPath = path.join(OUT_DIR, name);
  await sharp(buf).toFile(outPath);
  console.log("  done: " + name + "  (" + size + "x" + size + ")");
}

console.log("\nAll favicons generated.");
