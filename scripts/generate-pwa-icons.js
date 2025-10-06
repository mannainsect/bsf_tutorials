#!/usr/bin/env node

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Base icon - create a simple colored square with "BSF" text
async function createBaseIcon() {
  const size = 512
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#3880ff" rx="60"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">BSF</text>
    </svg>
  `

  return sharp(Buffer.from(svg))
}

async function generateIcons() {
  // Generating PWA icons...

  try {
    const baseIcon = await createBaseIcon()

    for (const size of sizes) {
      const filename = `icon-${size}x${size}.png`
      const filepath = path.join(publicDir, filename)

      await baseIcon.clone().resize(size, size).png().toFile(filepath)

      // Generated icon
    }

    // Also create favicon.ico (multi-size)
    await baseIcon
      .clone()
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'))

    // All icons generated successfully!
  } catch (error) {
    console.error('❌ Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
