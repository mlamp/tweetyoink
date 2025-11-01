/**
 * Manifest Smoke Tests
 *
 * Validates that the Chrome extension manifest.json is properly configured
 * and contains all required fields.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Manifest Validation', () => {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');

  it('should exist and be valid JSON', () => {
    expect(fs.existsSync(manifestPath), `Manifest not found at ${manifestPath}`).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(manifestContent), 'Manifest should be valid JSON').not.toThrow();
  });

  it('should have required fields', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Required fields for Chrome Extension Manifest V3
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('version');
    expect(manifest).toHaveProperty('manifest_version');

    // Validate field types and values
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);

    expect(typeof manifest.version).toBe('string');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning

    expect(manifest.manifest_version).toBe(3); // Manifest V3 requirement
  });

  it('should have proper extension configuration', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Extension should have proper identification
    expect(manifest.name).toBe('TweetYoink');
    expect(manifest.description).toBeTruthy();

    // Should have necessary permissions
    expect(manifest.permissions).toBeInstanceOf(Array);

    // Should have either host_permissions or optional_host_permissions
    const hasHostPermissions = manifest.host_permissions instanceof Array;
    const hasOptionalHostPermissions = manifest.optional_host_permissions instanceof Array;
    expect(hasHostPermissions || hasOptionalHostPermissions).toBe(true);

    // Should have proper structure for Manifest V3
    expect(manifest.background).toBeDefined();
    expect(manifest.action).toBeDefined();
    expect(manifest.content_scripts).toBeInstanceOf(Array);
  });
});
