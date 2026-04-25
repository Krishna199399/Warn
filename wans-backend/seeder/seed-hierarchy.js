const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

// Helper to generate advisor code
function generateAdvisorCode(name, index) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `${initials}${String(index).padStart(3, '0')}`;
}

// Helper to hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function seedHierarchy() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing employees (keep admin)
    await User.deleteMany({ role: { $ne: 'ADMIN' } });
    console.log('🗑️  Cleared existing employees');

    const credentials = [];
    let advisorCounter = 1;

    // Create 3 State Heads
    const stateHeads = [];
    const states = ['Karnataka', 'Maharashtra', 'Tamil Nadu'];
    
    for (let i = 0; i < 3; i++) {
      const stateHead = await User.create({
        name: `State Head ${i + 1}`,
        email: `state${i + 1}@wans.com`,
        password: await hashPassword('state123'),
        phone: `91000${i + 1}0000`,
        role: 'STATE_HEAD',
        status: 'APPROVED',
        region: states[i],
        parentId: null,
      });
      stateHeads.push(stateHead);
      credentials.push({
        role: 'STATE_HEAD',
        name: stateHead.name,
        email: stateHead.email,
        password: 'state123',
        region: stateHead.region,
      });
      console.log(`✅ Created State Head: ${stateHead.name}`);
    }

    // Create 10 Zonal Managers under each State Head (3 x 10 = 30)
    const zonalManagers = [];
    for (let sh = 0; sh < stateHeads.length; sh++) {
      for (let i = 0; i < 10; i++) {
        const zonalManager = await User.create({
          name: `Zonal Manager ${sh + 1}-${i + 1}`,
          email: `zonal${sh + 1}-${i + 1}@wans.com`,
          password: await hashPassword('zonal123'),
          phone: `92${sh}${String(i).padStart(2, '0')}00000`,
          role: 'ZONAL_MANAGER',
          status: 'APPROVED',
          region: `${stateHeads[sh].region} - Zone ${i + 1}`,
          parentId: stateHeads[sh]._id,
        });
        zonalManagers.push(zonalManager);
        credentials.push({
          role: 'ZONAL_MANAGER',
          name: zonalManager.name,
          email: zonalManager.email,
          password: 'zonal123',
          region: zonalManager.region,
          parent: stateHeads[sh].name,
        });
      }
      console.log(`✅ Created 10 Zonal Managers under ${stateHeads[sh].name}`);
    }

    // Create 12 Area Managers under each Zonal Manager (30 x 12 = 360)
    const areaManagers = [];
    for (let zm = 0; zm < zonalManagers.length; zm++) {
      for (let i = 0; i < 12; i++) {
        const areaManager = await User.create({
          name: `Area Manager ${Math.floor(zm / 10) + 1}-${(zm % 10) + 1}-${i + 1}`,
          email: `area${Math.floor(zm / 10) + 1}-${(zm % 10) + 1}-${i + 1}@wans.com`,
          password: await hashPassword('area123'),
          phone: `93${zm}${String(i).padStart(2, '0')}0000`,
          role: 'AREA_MANAGER',
          status: 'APPROVED',
          region: `${zonalManagers[zm].region} - Area ${i + 1}`,
          parentId: zonalManagers[zm]._id,
        });
        areaManagers.push(areaManager);
        credentials.push({
          role: 'AREA_MANAGER',
          name: areaManager.name,
          email: areaManager.email,
          password: 'area123',
          region: areaManager.region,
          parent: zonalManagers[zm].name,
        });
      }
      if ((zm + 1) % 10 === 0) {
        console.log(`✅ Created 120 Area Managers under State ${Math.floor(zm / 10) + 1}`);
      }
    }

    // Create 13 DO Managers under each Area Manager (360 x 13 = 4,680)
    const doManagers = [];
    for (let am = 0; am < areaManagers.length; am++) {
      for (let i = 0; i < 13; i++) {
        const doManager = await User.create({
          name: `DO Manager ${Math.floor(am / 120) + 1}-${Math.floor((am % 120) / 12) + 1}-${(am % 12) + 1}-${i + 1}`,
          email: `do${Math.floor(am / 120) + 1}-${Math.floor((am % 120) / 12) + 1}-${(am % 12) + 1}-${i + 1}@wans.com`,
          password: await hashPassword('do123'),
          phone: `94${String(am).padStart(3, '0')}${String(i).padStart(2, '0')}00`,
          role: 'DO_MANAGER',
          status: 'APPROVED',
          region: `${areaManagers[am].region} - DO ${i + 1}`,
          parentId: areaManagers[am]._id,
        });
        doManagers.push(doManager);
        credentials.push({
          role: 'DO_MANAGER',
          name: doManager.name,
          email: doManager.email,
          password: 'do123',
          region: doManager.region,
          parent: areaManagers[am].name,
        });
      }
      if ((am + 1) % 120 === 0) {
        console.log(`✅ Created 1,560 DO Managers under State ${Math.floor(am / 120) + 1}`);
      }
    }

    // Create 8 Advisors under each DO Manager (4,680 x 8 = 37,440)
    const advisors = [];
    for (let dom = 0; dom < doManagers.length; dom++) {
      for (let i = 0; i < 8; i++) {
        const advisorName = `Advisor ${Math.floor(dom / 1560) + 1}-${Math.floor((dom % 1560) / 156) + 1}-${Math.floor((dom % 156) / 13) + 1}-${(dom % 13) + 1}-${i + 1}`;
        const advisorCode = generateAdvisorCode(advisorName, advisorCounter++);
        
        const advisor = await User.create({
          name: advisorName,
          email: `advisor${Math.floor(dom / 1560) + 1}-${Math.floor((dom % 1560) / 156) + 1}-${Math.floor((dom % 156) / 13) + 1}-${(dom % 13) + 1}-${i + 1}@wans.com`,
          password: await hashPassword('advisor123'),
          phone: `95${String(dom).padStart(4, '0')}${String(i).padStart(2, '0')}`,
          role: 'ADVISOR',
          status: 'APPROVED',
          region: `${doManagers[dom].region} - Territory ${i + 1}`,
          parentId: doManagers[dom]._id,
          advisorCode: advisorCode,
        });
        advisors.push(advisor);
        credentials.push({
          role: 'ADVISOR',
          name: advisor.name,
          email: advisor.email,
          password: 'advisor123',
          advisorCode: advisor.advisorCode,
          region: advisor.region,
          parent: doManagers[dom].name,
        });
      }
      if ((dom + 1) % 1560 === 0) {
        console.log(`✅ Created 12,480 Advisors under State ${Math.floor(dom / 1560) + 1}`);
      }
    }

    console.log('\n🎉 Hierarchy seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   State Heads: ${stateHeads.length}`);
    console.log(`   Zonal Managers: ${zonalManagers.length}`);
    console.log(`   Area Managers: ${areaManagers.length}`);
    console.log(`   DO Managers: ${doManagers.length}`);
    console.log(`   Advisors: ${advisors.length}`);
    console.log(`   Total Employees: ${stateHeads.length + zonalManagers.length + areaManagers.length + doManagers.length + advisors.length}`);

    // Save credentials to file
    const fs = require('fs');
    const credentialsFile = './seeder/credentials.json';
    fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
    console.log(`\n💾 Credentials saved to: ${credentialsFile}`);

    // Create sample credentials file for easy testing
    const sampleCreds = {
      stateHead: credentials.find(c => c.role === 'STATE_HEAD'),
      zonalManager: credentials.find(c => c.role === 'ZONAL_MANAGER'),
      areaManager: credentials.find(c => c.role === 'AREA_MANAGER'),
      doManager: credentials.find(c => c.role === 'DO_MANAGER'),
      advisor: credentials.find(c => c.role === 'ADVISOR'),
    };
    
    const sampleFile = './seeder/sample-credentials.json';
    fs.writeFileSync(sampleFile, JSON.stringify(sampleCreds, null, 2));
    console.log(`📝 Sample credentials saved to: ${sampleFile}`);

    console.log('\n🔑 Sample Login Credentials:');
    console.log('─────────────────────────────────────────────────────');
    console.log('STATE HEAD:');
    console.log(`  Email: ${sampleCreds.stateHead.email}`);
    console.log(`  Password: ${sampleCreds.stateHead.password}`);
    console.log('\nZONAL MANAGER:');
    console.log(`  Email: ${sampleCreds.zonalManager.email}`);
    console.log(`  Password: ${sampleCreds.zonalManager.password}`);
    console.log('\nAREA MANAGER:');
    console.log(`  Email: ${sampleCreds.areaManager.email}`);
    console.log(`  Password: ${sampleCreds.areaManager.password}`);
    console.log('\nDO MANAGER:');
    console.log(`  Email: ${sampleCreds.doManager.email}`);
    console.log(`  Password: ${sampleCreds.doManager.password}`);
    console.log('\nADVISOR:');
    console.log(`  Email: ${sampleCreds.advisor.email}`);
    console.log(`  Password: ${sampleCreds.advisor.password}`);
    console.log(`  Code: ${sampleCreds.advisor.advisorCode}`);
    console.log('─────────────────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Error seeding hierarchy:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

seedHierarchy();
