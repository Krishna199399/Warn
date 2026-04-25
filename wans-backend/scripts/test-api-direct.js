const axios = require('axios');

// Test the API directly
async function testAPI() {
  try {
    console.log('🔐 Logging in as advisor...\n');
    
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'advisor1-1-1-1-1@wans.com',
      password: 'advisor123'
    });
    
    const token = loginRes.data.data.accessToken;
    const userId = loginRes.data.data.user._id;
    
    console.log(`✅ Logged in successfully`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);
    
    // Get performance
    console.log('📊 Fetching performance data...\n');
    const perfRes = await axios.get(`http://localhost:5000/api/users/${userId}/performance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Performance API Response:');
    console.log(JSON.stringify(perfRes.data, null, 2));
    
    console.log('\n📈 Key Metrics:');
    console.log(`   Total Sales: ₹${perfRes.data.data.totalSales?.toLocaleString() || 0}`);
    console.log(`   Team Size: ${perfRes.data.data.teamSize || 0}`);
    
    // Get commission summary
    console.log('\n💰 Fetching commission summary...\n');
    const commRes = await axios.get('http://localhost:5000/api/commissions/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Commission API Response:');
    console.log(JSON.stringify(commRes.data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testAPI();
