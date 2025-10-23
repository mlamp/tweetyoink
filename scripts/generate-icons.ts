#!/usr/bin/env tsx

/**
 * Icon Generation Script
 *
 * Generates Chrome extension icons (16x16, 48x48, 128x128) from a source thumbnail.
 * Uses the Sharp library for high-quality image resizing.
 *
 * Source: public/assets/thumbnail.jpg
 * Output: public/icons/icon-{16,48,128}.png
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const sizes = [16, 48, 128] as const;
const sourceFile = 'public/assets/thumbnail.jpg';
const outputDir = 'public/icons';

async function generateIcons(): Promise<void> {
  console.log('🎨 Generating extension icons from thumbnail...\n');

  // Verify source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Error: Source thumbnail not found at ${sourceFile}`);
    console.error(`   Please add a thumbnail image to ${sourceFile}`);
    process.exit(1);
  }

  // Verify output directory exists
  if (!fs.existsSync(outputDir)) {
    console.log(`📁 Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate icons for each size
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(sourceFile)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputFile);

      console.log(`✓ Generated ${size}x${size} icon: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size} icon:`, error);
      process.exit(1);
    }
  }

  console.log('\n✨ All icons generated successfully!');
  console.log(`   Source: ${sourceFile}`);
  console.log(`   Output: ${outputDir}/icon-{16,48,128}.png`);
}

// Run the generator
generateIcons().catch((error) => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
