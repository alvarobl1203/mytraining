// ===========================================================================
// MyTraining — Generador de iconos PWA y Capacitor
// ===========================================================================
// Convierte public/icon.svg en todos los PNGs necesarios:
//   - icon-192.png            (PWA any)
//   - icon-512.png            (PWA any)
//   - icon-maskable-512.png   (PWA maskable, safe area 20%)
//   - apple-touch-icon.png    (iOS, 180x180 con fondo opaco)
//
// Uso: npm run icons
// ===========================================================================

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = resolve(ROOT, 'public');
const ASSETS_DIR = resolve(ROOT, 'assets');

const SVG_PATH = resolve(PUBLIC_DIR, 'icon.svg');
const BG = { r: 9, g: 9, b: 11, alpha: 1 }; // #09090b (bg-zinc-950)

if (!existsSync(SVG_PATH)) {
  console.error(`✗ No se encuentra ${SVG_PATH}`);
  process.exit(1);
}

const svgBuffer = readFileSync(SVG_PATH);

/**
 * Genera un PNG cuadrado a partir del SVG.
 * @param {number} size Tamaño final en px
 * @param {string} outPath Ruta absoluta del PNG de salida
 * @param {number} padding Padding interno en px (para maskable)
 */
async function makeIcon(size, outPath, padding = 0) {
  const inner = size - padding * 2;
  await sharp(svgBuffer, { density: 384 })
    .resize(inner, inner, {
      fit: 'contain',
      background: BG,
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: BG,
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${outPath.replace(ROOT, '.')} (${size}×${size})`);
}

// ---------------------------------------------------------------------------
// Iconos PWA (public/)
// ---------------------------------------------------------------------------
async function generatePwaIcons() {
  console.log('\n→ Iconos PWA (public/)');
  await makeIcon(192, resolve(PUBLIC_DIR, 'icon-192.png'));
  await makeIcon(512, resolve(PUBLIC_DIR, 'icon-512.png'));
  // Maskable: safe area del 20% para que no se recorte el logo en Android
  await makeIcon(
    512,
    resolve(PUBLIC_DIR, 'icon-maskable-512.png'),
    Math.round(512 * 0.2),
  );
  // Apple touch icon: iOS prefiere fondo opaco, sin transparencia
  await makeIcon(180, resolve(PUBLIC_DIR, 'apple-touch-icon.png'));
  // Favicon pequeño (opcional, para navegadores)
  await makeIcon(32, resolve(PUBLIC_DIR, 'favicon-32.png'));
}

// ---------------------------------------------------------------------------
// Assets para Capacitor (assets/)
// ---------------------------------------------------------------------------
async function generateCapacitorAssets() {
  console.log('\n→ Assets Capacitor (assets/)');
  if (!existsSync(ASSETS_DIR)) {
    mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // icon-only: logo completo sobre fondo (por si no hay adaptive icon)
  await makeIcon(1024, resolve(ASSETS_DIR, 'icon-only.png'));

  // Adaptive icon Android:
  //   - foreground: logo sobre fondo transparente, con padding para safe area
  //   - background: color sólido #09090b
  await sharp(svgBuffer, { density: 384 })
    .resize(660, 660, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 182, bottom: 182, left: 182, right: 182,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS_DIR, 'icon-foreground.png'));
  console.log('✓ assets/icon-foreground.png (1024×1024, transparente)');

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BG,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS_DIR, 'icon-background.png'));
  console.log('✓ assets/icon-background.png (1024×1024, #09090b)');

  // Splash screen: logo centrado sobre fondo oscuro
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer, { density: 384 })
          .resize(800, 800, { fit: 'contain', background: BG })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS_DIR, 'splash.png'));
  console.log('✓ assets/splash.png (2732×2732)');

  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer, { density: 384 })
          .resize(400, 400, { fit: 'contain', background: BG })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS_DIR, 'splash-dark.png'));
  console.log('✓ assets/splash-dark.png (2732×2732)');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Generando iconos MyTraining…');
  await generatePwaIcons();
  await generateCapacitorAssets();
  console.log('\n✅ Iconos generados correctamente.\n');
}

main().catch((err) => {
  console.error('\n✗ Error generando iconos:', err);
  process.exit(1);
});