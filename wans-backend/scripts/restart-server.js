const { exec } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 5000;

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function restartServer() {
  console.log('🔍 Checking if server is running...');
  
  const isRunning = await checkServer();
  
  if (isRunning) {
    console.log('✅ Server is running on port', PORT);
    console.log('   Health check: http://localhost:' + PORT + '/api/health');
  } else {
    console.log('❌ Server is NOT running');
    console.log('\n📝 To start the server, run:');
    console.log('   npm run dev');
    console.log('   OR');
    console.log('   npm start');
  }
}

restartServer();
