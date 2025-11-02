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
import { execSync } from 'child_process';
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
 * Check for version conflicts with existing git tags and release files
 * Prevents publishing a version that already exists in the Chrome Web Store
 * @param version The version to check
 * @throws Error if version conflicts are detected
 */
function checkVersionConflicts(version: string): void {
  const versionTag = `v${version}`;
  const zipPath = path.join(RELEASES_DIR, `tweetyoink-v${version}.zip`);

  const conflicts: string[] = [];

  // Check if git tag already exists
  try {
    const tags = execSync('git tag --list', { encoding: 'utf-8' });
    if (tags.split('\n').includes(versionTag)) {
      conflicts.push(`Git tag '${versionTag}' already exists`);
    }
  } catch (error) {
    // Git command failed, likely not a git repo - skip this check
    console.log('⚠️  Warning: Could not check git tags (not a git repository?)');
  }

  // Check if ZIP file already exists
  if (fs.existsSync(zipPath)) {
    conflicts.push(`Release file already exists: ${zipPath}`);
  }

  // If conflicts found, throw error
  if (conflicts.length > 0) {
    throw new Error(
      `\n❌ Version ${version} conflicts detected:\n` +
      conflicts.map(c => `   - ${c}`).join('\n') +
      `\n\n` +
      `This version may already be published to Chrome Web Store.\n` +
      `To fix:\n` +
      `  1. Check current Chrome Web Store version\n` +
      `  2. Bump version in package.json (npm run version:patch or version:minor)\n` +
      `  3. Run 'npm run package' again\n`
    );
  }

  console.log('✓ No version conflicts detected');
}

/**
 * Validates the manifest.json file in dist/ directory
 * Checks for required fields and proper structure
 * @throws Error if manifest is invalid
 */
function validateManifest(): void {
  const manifestPath = path.join(DIST_DIR, 'manifest.json');

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `manifest.json missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validate manifest_version is 3 (Manifest V3)
    if (manifest.manifest_version !== 3) {
      throw new Error(
        `manifest_version must be 3 (Manifest V3), got: ${manifest.manifest_version}`
      );
    }

    console.log('✓ Manifest validated');
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`manifest.json is not valid JSON: ${error.message}`);
    }
    throw error;
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
      const sizeInBytes = archive.pointer();
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

      // Chrome Web Store has a 128MB limit
      const MAX_SIZE_BYTES = 128 * 1024 * 1024;

      if (sizeInBytes > MAX_SIZE_BYTES) {
        reject(
          new Error(
            `Package size (${sizeInMB} MB) exceeds Chrome Web Store limit of 128 MB. ` +
              `Remove unnecessary files or optimize assets.`
          )
        );
        return;
      }

      console.log(`\n✅ Package created successfully!`);
      console.log(`   Location: ${zipPath}`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Total bytes: ${sizeInBytes}`);

      // Warn if package is getting large (>50MB)
      if (sizeInBytes > 50 * 1024 * 1024) {
        console.log(
          `\n⚠️  Warning: Package is larger than 50 MB. Consider optimizing assets.`
        );
      }

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

    // Validate manifest.json
    validateManifest();

    // Get version from package.json
    const version = getVersion();

    // Check for version conflicts (git tags, existing ZIP files)
    checkVersionConflicts(version);

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
