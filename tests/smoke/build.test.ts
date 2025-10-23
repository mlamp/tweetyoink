/**
 * Build Smoke Tests
 *
 * Validates that the build process produces the expected output
 * and that all required files are present in the dist/ directory.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Build Output Validation', () => {
  const distPath = path.join(process.cwd(), 'dist');

  it('should have dist/ directory', () => {
    expect(fs.existsSync(distPath), 'dist/ directory should exist after build').toBe(true);
  });

  it('should have manifest.json in dist/', () => {
    const manifestPath = path.join(distPath, 'manifest.json');
    expect(fs.existsSync(manifestPath), 'dist/manifest.json should exist').toBe(true);

    // Validate it's valid JSON
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(manifestContent), 'dist/manifest.json should be valid JSON').not.toThrow();
  });

  it('should have compiled extension files in dist/', () => {
    // @crxjs/vite-plugin keeps source structure, so check for src/ directory
    const srcPath = path.join(distPath, 'src');
    const srcExists = fs.existsSync(srcPath);

    // Check for service worker loader (crxjs generates this)
    const serviceWorkerLoaderPath = path.join(distPath, 'service-worker-loader.js');
    const serviceWorkerLoaderExists = fs.existsSync(serviceWorkerLoaderPath);

    // Check for popup directory
    const popupPath = path.join(distPath, 'src', 'popup');
    const popupExists = fs.existsSync(popupPath);

    // Check for assets directory (crxjs bundles assets here)
    const assetsPath = path.join(distPath, 'assets');
    const assetsExists = fs.existsSync(assetsPath);

    // At least some core files should exist (build output structure with @crxjs/vite-plugin)
    const hasCoreFiles = srcExists || serviceWorkerLoaderExists || popupExists || assetsExists;
    expect(hasCoreFiles, 'At least some compiled extension files should exist in dist/').toBe(true);
  });

  it('should have icons in dist/', () => {
    const iconsPath = path.join(distPath, 'icons');
    expect(fs.existsSync(iconsPath), 'dist/icons/ directory should exist').toBe(true);

    // Check for required icon sizes
    const icon16Path = path.join(iconsPath, 'icon-16.png');
    const icon48Path = path.join(iconsPath, 'icon-48.png');
    const icon128Path = path.join(iconsPath, 'icon-128.png');

    expect(fs.existsSync(icon16Path), 'icon-16.png should exist').toBe(true);
    expect(fs.existsSync(icon48Path), 'icon-48.png should exist').toBe(true);
    expect(fs.existsSync(icon128Path), 'icon-128.png should exist').toBe(true);
  });
});
