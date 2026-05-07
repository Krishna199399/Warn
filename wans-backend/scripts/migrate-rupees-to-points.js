const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function migrateRupeesToPoints() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Starting Rupees → Points Migration...\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Migrate Commission collection
    // ─────────────────────────────────────────────────────────────────────────
    const commissionResult = await mongoose.connection.db.collection('commissions').updateMany(
      { amount: { $exists: true } },
      [
        {
          $set: {
            points: '$amount',
            poolPoints: '$poolAmount',
            saleTotal: '$saleRV'
          }
        },
        {
          $unset: ['amount', 'poolAmount', 'saleRV']
        }
      ]
    );
    console.log(`✅ Commissions: ${commissionResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Migrate PayoutRecord collection
    // ─────────────────────────────────────────────────────────────────────────
    const payoutResult = await mongoose.connection.db.collection('payoutrecords').updateMany(
      { amount: { $exists: true } },
      [
        {
          $set: {
            points: '$amount'
          }
        },
        {
          $unset: ['amount']
        }
      ]
    );
    console.log(`✅ Payout Records: ${payoutResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Migrate UserSalaryStatus collection
    // ─────────────────────────────────────────────────────────────────────────
    const salaryStatusResult = await mongoose.connection.db.collection('usersalarystatuses').updateMany(
      { totalSvEarned: { $exists: true } },
      [
        {
          $set: {
            totalSvPoints: '$totalSvEarned'
          }
        },
        {
          $unset: ['totalSvEarned']
        }
      ]
    );
    console.log(`✅ User Salary Status: ${salaryStatusResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Migrate UserRewardProgress collection
    // ─────────────────────────────────────────────────────────────────────────
    const rewardProgressResult = await mongoose.connection.db.collection('userrewardprogresses').updateMany(
      { 'levelProgress.rvBaseline': { $exists: true } },
      [
        {
          $set: {
            levelProgress: {
              $map: {
                input: '$levelProgress',
                as: 'level',
                in: {
                  $mergeObjects: [
                    '$$level',
                    {
                      rvPointsBaseline: '$$level.rvBaseline',
                      benefits: {
                        $map: {
                          input: '$$level.benefits',
                          as: 'benefit',
                          in: {
                            $mergeObjects: [
                              '$$benefit',
                              { rvPointsTarget: '$$benefit.rvTarget' }
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $set: {
            levelProgress: {
              $map: {
                input: '$levelProgress',
                as: 'level',
                in: {
                  salaryLevel: '$$level.salaryLevel',
                  isActive: '$$level.isActive',
                  activatedAt: '$$level.activatedAt',
                  currentBenefitIdx: '$$level.currentBenefitIdx',
                  rvPointsBaseline: '$$level.rvPointsBaseline',
                  benefits: {
                    $map: {
                      input: '$$level.benefits',
                      as: 'benefit',
                      in: {
                        name: '$$benefit.name',
                        rvPointsTarget: '$$benefit.rvPointsTarget',
                        earned: '$$benefit.earned',
                        earnedAt: '$$benefit.earnedAt'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    );
    console.log(`✅ User Reward Progress: ${rewardProgressResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Migrate SalaryPlan collection
    // ─────────────────────────────────────────────────────────────────────────
    const salaryPlanResult = await mongoose.connection.db.collection('salaryplans').updateMany(
      { svTarget: { $exists: true } },
      [
        {
          $set: {
            svPointsTarget: '$svTarget',
            monthlySalaryPoints: '$monthlySalaryAmount',
            rewardBenefits: {
              $map: {
                input: '$rewardBenefits',
                as: 'benefit',
                in: {
                  name: '$$benefit.name',
                  rvPoints: '$$benefit.rvAmount'
                }
              }
            }
          }
        },
        {
          $unset: ['svTarget', 'monthlySalaryAmount']
        }
      ]
    );
    console.log(`✅ Salary Plans: ${salaryPlanResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Migrate Product collection (productSnapshot fields)
    // ─────────────────────────────────────────────────────────────────────────
    const productResult = await mongoose.connection.db.collection('products').updateMany(
      { rp: { $exists: true } },
      [
        {
          $set: {
            rpPoints: '$rp',
            svPoints: '$sv',
            rvPoints: '$rv',
            ivPoints: '$iv'
          }
        },
        {
          $unset: ['rp', 'sv', 'rv', 'iv']
        }
      ]
    );
    console.log(`✅ Products: ${productResult.modifiedCount} records migrated`);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Migrate Order collection (productSnapshot fields)
    // ─────────────────────────────────────────────────────────────────────────
    const orderResult = await mongoose.connection.db.collection('orders').updateMany(
      { 'productSnapshot.rp': { $exists: true } },
      [
        {
          $set: {
            'productSnapshot.rpPoints': '$productSnapshot.rp',
            'productSnapshot.svPoints': '$productSnapshot.sv',
            'productSnapshot.rvPoints': '$productSnapshot.rv',
            'productSnapshot.ivPoints': '$productSnapshot.iv'
          }
        },
        {
          $unset: ['productSnapshot.rp', 'productSnapshot.sv', 'productSnapshot.rv', 'productSnapshot.iv']
        }
      ]
    );
    console.log(`✅ Orders: ${orderResult.modifiedCount} records migrated`);

    console.log('\n✅ Migration Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Commissions:         ${commissionResult.modifiedCount} records`);
    console.log(`   Payout Records:      ${payoutResult.modifiedCount} records`);
    console.log(`   User Salary Status:  ${salaryStatusResult.modifiedCount} records`);
    console.log(`   User Reward Progress:${rewardProgressResult.modifiedCount} records`);
    console.log(`   Salary Plans:        ${salaryPlanResult.modifiedCount} records`);
    console.log(`   Products:            ${productResult.modifiedCount} records`);
    console.log(`   Orders:              ${orderResult.modifiedCount} records`);
    console.log('\n💡 All rupee fields have been renamed to points fields.');
    console.log('   Values remain the same (1:1 conversion).');

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

migrateRupeesToPoints();
