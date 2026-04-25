#!/usr/bin/env node

/**
 * Health check script to verify server is running
 * Usage: node scripts/health-check.js
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Server is healthy');
      console.log('Response:', data);
      process.exit(0);
    } else {
      console.error(`❌ Server returned status ${res.statusCode}`);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Server is not responding:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Server health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
