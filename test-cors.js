const https = require('https');

const postData = JSON.stringify({
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null
});

const options = {
  hostname: 'server-three-blue.vercel.app',
  path: '/api/auth/google-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'Origin': 'https://teacher-web-rose.vercel.app'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
  
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();

