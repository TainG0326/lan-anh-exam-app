const https = require('https');

const url = 'https://server-three-blue.vercel.app/health';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
  
}).on('error', (err) => {
  console.error('Error:', err.message);
});

