const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/Admin/teacher_and_student';
const destDir = 'C:/Users/Admin/teacher_and_student/teacher-web/public';

// List directories
const items = fs.readdirSync(srcDir);
console.log('Items in teacher_and_student:', items);

// Find logo folder - specifically look for "ảnh logo"
const logoFolder = items.find(f => f === 'ảnh logo');
console.log('Logo folder:', logoFolder);

if (logoFolder) {
  const logoPath = path.join(srcDir, logoFolder);
  const logoFiles = fs.readdirSync(logoPath);
  console.log('Files in logo folder:', logoFiles);
  
  // Find the background image
  const bgFile = logoFiles.find(f => f.toLowerCase().includes('login') && f.toLowerCase().includes('teacher'));
  console.log('Background file:', bgFile);
  
  if (bgFile) {
    const srcPath = path.join(logoPath, bgFile);
    const destPath = path.join(destDir, 'login-bg.png');
    fs.copyFileSync(srcPath, destPath);
    console.log('Copied successfully!');
  }
}

