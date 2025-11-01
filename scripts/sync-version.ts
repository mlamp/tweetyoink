#!/usr/bin/env tsx

/**
 * Version Sync Script
 *
 * Synchronizes version from package.json to public/manifest.json.
 * Called automatically via npm version lifecycle hooks.
 *
 * Usage: npm run version:patch|minor|major
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const MANIFEST_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'manifest.json');

/**
 * Reads the version number from package.json
 * @returns The version string
 */
function readPackageVersion(): string {
  try {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    if (!packageJson.version) {
      throw new Error('version field not found in package.json');
    }

    return packageJson.version;
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error}`);
  }
}

/**
 * Reads the version number from public/manifest.json
 * @returns The version string
 */
function readManifestVersion(): string {
  try {
    const manifestJsonContent = fs.readFileSync(MANIFEST_JSON_PATH, 'utf-8');
    const manifestJson = JSON.parse(manifestJsonContent);

    if (!manifestJson.version) {
      throw new Error('version field not found in manifest.json');
    }

    return manifestJson.version;
  } catch (error) {
    throw new Error(`Failed to read manifest.json: ${error}`);
  }
}

/**
 * Synchronizes version from package.json to public/manifest.json
 * Preserves JSON formatting (2-space indent + trailing newline)
 */
function syncVersionToManifest(): void {
  try {
    // Read versions
    const packageVersion = readPackageVersion();
    const currentManifestVersion = readManifestVersion();

    console.log(`📦 package.json version: ${packageVersion}`);
    console.log(`📄 manifest.json version: ${currentManifestVersion}`);

    if (packageVersion === currentManifestVersion) {
      console.log('✓ Versions already synchronized');
      return;
    }

    // Read manifest.json and update version
    const manifestJsonContent = fs.readFileSync(MANIFEST_JSON_PATH, 'utf-8');
    const manifestJson = JSON.parse(manifestJsonContent);
    manifestJson.version = packageVersion;

    // Write back with proper formatting (2-space indent + trailing newline)
    fs.writeFileSync(
      MANIFEST_JSON_PATH,
      JSON.stringify(manifestJson, null, 2) + '\n'
    );

    console.log(`✅ Synced version ${packageVersion} to manifest.json`);
  } catch (error) {
    console.error('❌ Version sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
try {
  syncVersionToManifest();
} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}
