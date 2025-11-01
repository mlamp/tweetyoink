#!/usr/bin/env tsx

/**
 * Package Script for Chrome Web Store Publishing
 *
 * Creates a production-ready ZIP package containing only the files
 * necessary for Chrome Web Store submission.
 *
 * Usage: npm run package
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const RELEASES_DIR = path.join(PROJECT_ROOT, 'releases');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

/**
 * Validates that the dist/ directory exists and contains manifest.json
 * @throws Error if validation fails
 */
function validateBuildExists(): void {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(
      `dist/ directory not found. Run 'npm run build' before packaging.`
    );
  }

  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `manifest.json not found in dist/. Ensure build completed successfully.`
    );
  }

  console.log('✓ Build directory validated');
}

/**
 * Reads the version number from package.json
 * @returns The version string (e.g., "0.1.0")
 * @throws Error if package.json cannot be read or parsed
 */
function getVersion(): string {
  try {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    if (!packageJson.version) {
      throw new Error('version field not found in package.json');
    }

    console.log(`✓ Version: ${packageJson.version}`);
    return packageJson.version;
  } catch (error) {
    throw new Error(`Failed to read version from package.json: ${error}`);
  }
}

/**
 * Creates the releases/ directory if it doesn't exist
 */
function createReleasesDirectory(): void {
  if (!fs.existsSync(RELEASES_DIR)) {
    fs.mkdirSync(RELEASES_DIR, { recursive: true });
    console.log('✓ Created releases/ directory');
  } else {
    console.log('✓ Releases directory exists');
  }
}

/**
 * Creates a ZIP archive with the specified version
 * @param version The version string for the filename
 * @returns Promise resolving to the ZIP file path
 */
async function createZipArchive(version: string): Promise<string> {
  const zipFilename = `tweetyoink-v${version}.zip`;
  const zipPath = path.join(RELEASES_DIR, zipFilename);

  // Create a file to stream archive data to
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  return new Promise((resolve, reject) => {
    // Listen for archive completion
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✅ Package created successfully!`);
      console.log(`   Location: ${zipPath}`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Total bytes: ${archive.pointer()}`);
      resolve(zipPath);
    });

    // Handle errors
    archive.on('error', (err) => {
      reject(new Error(`Archiving failed: ${err.message}`));
    });

    output.on('error', (err) => {
      reject(new Error(`File write failed: ${err.message}`));
    });

    // Pipe archive data to the file
    archive.pipe(output);

    console.log('\n📦 Adding files to archive...');

    // Add dist/ directory contents at ZIP root (not in a subdirectory)
    // Chrome Web Store expects manifest.json at the root level
    archive.glob('**/*', {
      cwd: DIST_DIR,
      ignore: ['**/.vite/**', '.vite/**'], // Exclude .vite directory
      dot: false, // Don't include hidden files
    });
    console.log('  ✓ Added dist/ contents to ZIP root (excluding .vite/)');

    // Note: LICENSE and README.md are NOT included in Chrome Web Store packages
    // Chrome Web Store only accepts files that are part of the extension itself

    // Finalize the archive
    console.log('\n⏳ Finalizing archive...');
    archive.finalize();
  });
}

async function main(): Promise<void> {
  console.log('📦 Starting Chrome Web Store package creation...\n');

  try {
    // Validate build exists
    validateBuildExists();

    // Get version from package.json
    const version = getVersion();

    // Create releases directory
    createReleasesDirectory();

    // Create ZIP archive
    await createZipArchive(version);
  } catch (error) {
    console.error('\n❌ Packaging failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
