const http = require('http');

// Test the AI endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ai/ai-chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const data = JSON.stringify({
  messages: [
    {
      role: 'user',
      content: 'Hello, how are you?'
    }
  ]
});

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', body);
    if (res.statusCode === 200) {
      console.log('✅ AI endpoint is working correctly!');
    } else {
      console.log('❌ AI endpoint returned error');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
  console.log('This might be expected if the backend server is not running');
});

req.write(data);
req.end();