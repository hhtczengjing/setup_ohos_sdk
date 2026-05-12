#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function cleanRecursive(dir) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        cleanRecursive(fullPath);
        // Try to remove empty directories
        try {
          const remaining = fs.readdirSync(fullPath);
          if (remaining.length === 0) {
            fs.rmdirSync(fullPath);
          }
        } catch (e) {
          // Ignore
        }
      } else {
        // Remove documentation and other files we don't need
        const shouldRemove = [
          /\.md$/i,          // *.md files
          /^README/i,
          /^CHANGELOG/i,
          /^CONTRIBUTING/i,
          /^LICENSE\.txt$/i,  // LICENSE.txt but keep LICENSE
          /^AUTHORS/i,
          /^HISTORY/i,
          /^NOTICE/i,
          /^INSTALL/i,
          /\.map$/,           // Source maps
        ].some(pattern => pattern.test(file));

        if (shouldRemove) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            // Ignore
          }
        }
      }
    });
  } catch (e) {
    // Ignore
  }
}

const distNodeModules = path.join(__dirname, '..', 'dist', 'node_modules');
if (fs.existsSync(distNodeModules)) {
  console.log('Cleaning dist/node_modules...');
  cleanRecursive(distNodeModules);
  console.log('Done!');
}
