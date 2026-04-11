const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/Admin/teacher_and_student/ảnh logo/backround login page for mobile.png';
const destPath = 'C:/Users/Admin/teacher_and_student/teacher-web/public/login-bg-mobile.png';

fs.copyFileSync(srcPath, destPath);
console.log('Mobile background copied successfully!');





