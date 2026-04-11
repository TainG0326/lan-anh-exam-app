const https = require('https');

const data = JSON.stringify({ email: 'testverifynotexist@gmail.com' });

const options = {
  hostname: 'server-three-blue.vercel.app',
  port: 443,
  path: '/api/auth/send-verification-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
