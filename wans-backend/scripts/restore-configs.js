const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Restoring system configurations...\n');

const scripts = [
  { name: 'Income Config', path: 'src/scripts/seed-income-config.js' },
  { name: 'Pool Config', path: 'src/scripts/seed-pool-config.js' },
  { name: 'Salary Plans', path: 'seeder/seed-salary-plans.js' }
];

let success = 0;
let failed = 0;

for (const script of scripts) {
  try {
    console.log(`\n📦 Seeding ${script.name}...`);
    execSync(`node ${script.path}`, { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
    success++;
  } catch (error) {
    console.error(`❌ Failed to seed ${script.name}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Successfully restored: ${success}/${scripts.length} configurations`);
if (failed > 0) {
  console.log(`❌ Failed: ${failed}/${scripts.length} configurations`);
}
console.log('='.repeat(60));
