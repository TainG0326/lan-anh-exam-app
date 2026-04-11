const fs = require('fs');
const path = require('path');

// Try to find and copy the background image
const parentDir = '..';
const dirs = fs.readdirSync(parentDir);
console.log('Directories found:', dirs);

// Find the correct directory (should contain backroundweb.png in a logo-related folder)
const targetDir = dirs.find(d => {
  const fullPath = path.join(parentDir, d);
  return fs.statSync(fullPath).isDirectory() && 
         (d.includes('logo'));
});
console.log('Target directory:', targetDir);

if (targetDir) {
  const srcPath = path.join(parentDir, targetDir, 'backroundweb.png');
  const destPath = path.join('public', 'background.png');
  console.log('Source path:', srcPath);
  console.log('Destination path:', destPath);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Copied successfully!');
  } else {
    console.log('Source file not found:', srcPath);
  }
} else {
  console.log('Image directory not found');
}

