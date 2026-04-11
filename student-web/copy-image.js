const fs = require('fs');
const path = require('path');

// Try to find and copy the background image
const dirs = fs.readdirSync('..');
const imgDir = dirs.find(d => d.includes('ảnh') || d.includes('anh'));
if (imgDir) {
  const srcPath = path.join('..', imgDir, 'backroundweb.png');
  const destPath = path.join('public', 'background.png');
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Copied successfully!');
  } else {
    console.log('Source file not found:', srcPath);
  }
} else {
  console.log('Image directory not found');
}




