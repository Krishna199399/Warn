/**
 * seed-salary-plans.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Seeds the WKR SalaryPlan collection with the new compensation model.
 *
 * Role Hierarchy:
 *   PR  = Promotion Representative  (ADVISOR)
 *   DO  = Development Officer       (DO_MANAGER)
 *   RM  = Regional Manager          (AREA_MANAGER)
 *   ZM  = Zonal Manager             (ZONAL_MANAGER)
 *   EM  = Executive Manager         (STATE_HEAD)
 *
 * Each role has 3 levels: STAR → RUBY → PEARL
 * Each level has an SV target and sequential RV reward benefits.
 *
 * Usage:
 *   node wans-backend/src/scripts/seed-salary-plans.js
 *
 * WARNING: This deletes and recreates all SalaryPlan documents.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const mongoose  = require('mongoose');
const SalaryPlan = require('../models/SalaryPlan');
const path      = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ─── Lakh / Crore helpers ────────────────────────────────────────────────────
const L  = (n) => n * 100_000;      // n Lakhs  → rupees
const Cr = (n) => n * 10_000_000;   // n Crores → rupees

// ─── Salary Plan Data ────────────────────────────────────────────────────────
const PLANS = [

  // ══════════════════════════════════════════════════════════════════════════
  // 01. PR — Promotion Representative (DB role: ADVISOR)
  // ══════════════════════════════════════════════════════════════════════════
  {
    role: 'ADVISOR',
    level: 'STAR',
    svTarget: L(10),              // 10 Lakhs SV
    description: 'PR STAR Level — 10 Lakhs SV target',
    rewardBenefits: [
      { name: 'PR Star Reward 1', rvAmount: 50_000 },  // 50K RV
      { name: 'PR Star Reward 2', rvAmount: L(1)   },  // 1L RV
      { name: 'PR Star Reward 3', rvAmount: L(1.5) },  // 1.5L RV
      { name: 'PR Star Reward 4', rvAmount: L(3)   },  // 3L RV
      { name: 'PR Star Reward 5', rvAmount: L(4)   },  // 4L RV
    ],
  },
  {
    role: 'ADVISOR',
    level: 'RUBY',
    svTarget: L(15),              // 15 Lakhs SV (fresh counter after STAR)
    description: 'PR RUBY Level — 15 Lakhs SV target',
    rewardBenefits: [
      { name: 'PR Ruby Reward 1', rvAmount: 80_000 },  // 80K RV
      { name: 'PR Ruby Reward 2', rvAmount: L(1.7) },  // 1.7L RV
      { name: 'PR Ruby Reward 3', rvAmount: L(2.5) },  // 2.5L RV
      { name: 'PR Ruby Reward 4', rvAmount: L(4.5) },  // 4.5L RV
      { name: 'PR Ruby Reward 5', rvAmount: L(5.5) },  // 5.5L RV
    ],
  },
  {
    role: 'ADVISOR',
    level: 'PEARL',
    svTarget: L(20),              // 20 Lakhs SV (fresh counter after RUBY)
    description: 'PR PEARL Level — 20 Lakhs SV target',
    rewardBenefits: [
      { name: 'PR Pearl Reward 1', rvAmount: L(1.1) },  // 1.1L RV
      { name: 'PR Pearl Reward 2', rvAmount: L(2.4) },  // 2.4L RV
      { name: 'PR Pearl Reward 3', rvAmount: L(3.5) },  // 3.5L RV
      { name: 'PR Pearl Reward 4', rvAmount: L(6)   },  // 6L RV
      { name: 'PR Pearl Reward 5', rvAmount: L(7)   },  // 7L RV
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 02. DO — Development Officer (DB role: DO_MANAGER)
  // ══════════════════════════════════════════════════════════════════════════
  {
    role: 'DO_MANAGER',
    level: 'STAR',
    svTarget: L(30),              // 30 Lakhs SV
    description: 'DO STAR Level — 30 Lakhs SV target',
    rewardBenefits: [
      { name: 'DO Star Reward 1', rvAmount: L(2)  },  // 2L RV
      { name: 'DO Star Reward 2', rvAmount: L(4)  },  // 4L RV
      { name: 'DO Star Reward 3', rvAmount: L(6)  },  // 6L RV
      { name: 'DO Star Reward 4', rvAmount: L(8)  },  // 8L RV
      { name: 'DO Star Reward 5', rvAmount: L(10) },  // 10L RV
    ],
  },
  {
    role: 'DO_MANAGER',
    level: 'RUBY',
    svTarget: L(40),              // 40 Lakhs SV (fresh counter after STAR)
    description: 'DO RUBY Level — 40 Lakhs SV target',
    rewardBenefits: [
      { name: 'DO Ruby Reward 1', rvAmount: L(2.5)  },  // 2.5L RV
      { name: 'DO Ruby Reward 2', rvAmount: L(5)    },  // 5L RV
      { name: 'DO Ruby Reward 3', rvAmount: L(7.5)  },  // 7.5L RV
      { name: 'DO Ruby Reward 4', rvAmount: L(11)   },  // 11L RV
      { name: 'DO Ruby Reward 5', rvAmount: L(14)   },  // 14L RV
    ],
  },
  {
    role: 'DO_MANAGER',
    level: 'PEARL',
    svTarget: L(50),              // 50 Lakhs SV (fresh counter after RUBY)
    description: 'DO PEARL Level — 50 Lakhs SV target',
    rewardBenefits: [
      { name: 'DO Pearl Reward 1', rvAmount: L(3)   },  // 3L RV
      { name: 'DO Pearl Reward 2', rvAmount: L(6)   },  // 6L RV
      { name: 'DO Pearl Reward 3', rvAmount: L(9)   },  // 9L RV
      { name: 'DO Pearl Reward 4', rvAmount: L(14)  },  // 14L RV
      { name: 'DO Pearl Reward 5', rvAmount: L(18)  },  // 18L RV
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 03. RM — Regional Manager (DB role: AREA_MANAGER)
  // ══════════════════════════════════════════════════════════════════════════
  {
    role: 'AREA_MANAGER',
    level: 'STAR',
    svTarget: Cr(1),              // 1 Crore SV
    description: 'RM STAR Level — 1 Crore SV target',
    rewardBenefits: [
      { name: 'RM Star Reward 1', rvAmount: L(6)  },  // 6L RV
      { name: 'RM Star Reward 2', rvAmount: L(14) },  // 14L RV
      { name: 'RM Star Reward 3', rvAmount: L(19) },  // 19L RV
      { name: 'RM Star Reward 4', rvAmount: L(28) },  // 28L RV
      { name: 'RM Star Reward 5', rvAmount: L(33) },  // 33L RV
    ],
  },
  {
    role: 'AREA_MANAGER',
    level: 'RUBY',
    svTarget: Cr(1.15),           // 1.15 Crore SV (fresh counter after STAR)
    description: 'RM RUBY Level — 1.15 Crore SV target',
    rewardBenefits: [
      { name: 'RM Ruby Reward 1', rvAmount: L(7)   },  // 7L RV
      { name: 'RM Ruby Reward 2', rvAmount: L(16)  },  // 16L RV
      { name: 'RM Ruby Reward 3', rvAmount: L(22)  },  // 22L RV
      { name: 'RM Ruby Reward 4', rvAmount: L(32)  },  // 32L RV
      { name: 'RM Ruby Reward 5', rvAmount: L(38)  },  // 38L RV
    ],
  },
  {
    role: 'AREA_MANAGER',
    level: 'PEARL',
    svTarget: Cr(1.30),           // 1.30 Crore SV (fresh counter after RUBY)
    description: 'RM PEARL Level — 1.30 Crore SV target',
    rewardBenefits: [
      { name: 'RM Pearl Reward 1', rvAmount: L(8)   },  // 8L RV
      { name: 'RM Pearl Reward 2', rvAmount: L(18)  },  // 18L RV
      { name: 'RM Pearl Reward 3', rvAmount: L(25)  },  // 25L RV
      { name: 'RM Pearl Reward 4', rvAmount: L(36)  },  // 36L RV
      { name: 'RM Pearl Reward 5', rvAmount: L(43)  },  // 43L RV
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 04. ZM — Zonal Manager (DB role: ZONAL_MANAGER)
  // ══════════════════════════════════════════════════════════════════════════
  {
    role: 'ZONAL_MANAGER',
    level: 'STAR',
    svTarget: Cr(3),              // 3 Crore SV
    description: 'ZM STAR Level — 3 Crore SV target',
    rewardBenefits: [
      { name: 'ZM Star Reward 1', rvAmount: L(20)  },  // 20L RV
      { name: 'ZM Star Reward 2', rvAmount: L(40)  },  // 40L RV
      { name: 'ZM Star Reward 3', rvAmount: L(60)  },  // 60L RV
      { name: 'ZM Star Reward 4', rvAmount: L(80)  },  // 80L RV
      { name: 'ZM Star Reward 5', rvAmount: L(100) },  // 100L RV
    ],
  },
  {
    role: 'ZONAL_MANAGER',
    level: 'RUBY',
    svTarget: Cr(3.2),            // 3.2 Crore SV (fresh counter after STAR)
    description: 'ZM RUBY Level — 3.2 Crore SV target',
    rewardBenefits: [
      { name: 'ZM Ruby Reward 1', rvAmount: L(22)   },  // 22L RV
      { name: 'ZM Ruby Reward 2', rvAmount: L(43)   },  // 43L RV
      { name: 'ZM Ruby Reward 3', rvAmount: L(64)   },  // 64L RV
      { name: 'ZM Ruby Reward 4', rvAmount: L(85)   },  // 85L RV
      { name: 'ZM Ruby Reward 5', rvAmount: L(106)  },  // 106L RV
    ],
  },
  {
    role: 'ZONAL_MANAGER',
    level: 'PEARL',
    svTarget: Cr(3.4),            // 3.4 Crore SV (fresh counter after RUBY)
    description: 'ZM PEARL Level — 3.4 Crore SV target',
    rewardBenefits: [
      { name: 'ZM Pearl Reward 1', rvAmount: L(24)   },  // 24L RV
      { name: 'ZM Pearl Reward 2', rvAmount: L(46)   },  // 46L RV
      { name: 'ZM Pearl Reward 3', rvAmount: L(68)   },  // 68L RV
      { name: 'ZM Pearl Reward 4', rvAmount: L(90)   },  // 90L RV
      { name: 'ZM Pearl Reward 5', rvAmount: L(112)  },  // 112L RV
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 05. EM — Executive Manager (DB role: STATE_HEAD)
  // ══════════════════════════════════════════════════════════════════════════
  {
    role: 'STATE_HEAD',
    level: 'STAR',
    svTarget: Cr(6),              // 6 Crore SV
    description: 'EM STAR Level — 6 Crore SV target',
    rewardBenefits: [
      { name: 'EM Star Reward 1', rvAmount: L(40)  },  // 40L RV
      { name: 'EM Star Reward 2', rvAmount: L(80)  },  // 80L RV
      { name: 'EM Star Reward 3', rvAmount: L(120) },  // 120L RV
      { name: 'EM Star Reward 4', rvAmount: L(160) },  // 160L RV
      { name: 'EM Star Reward 5', rvAmount: L(200) },  // 200L RV
    ],
  },
  {
    role: 'STATE_HEAD',
    level: 'RUBY',
    svTarget: Cr(6.25),           // 6.25 Crore SV (fresh counter after STAR)
    description: 'EM RUBY Level — 6.25 Crore SV target',
    rewardBenefits: [
      { name: 'EM Ruby Reward 1', rvAmount: L(43)   },  // 43L RV
      { name: 'EM Ruby Reward 2', rvAmount: L(84)   },  // 84L RV
      { name: 'EM Ruby Reward 3', rvAmount: L(125)  },  // 125L RV
      { name: 'EM Ruby Reward 4', rvAmount: L(166)  },  // 166L RV
      { name: 'EM Ruby Reward 5', rvAmount: L(207)  },  // 207L RV
    ],
  },
  {
    role: 'STATE_HEAD',
    level: 'PEARL',
    svTarget: Cr(6.50),           // 6.50 Crore SV (fresh counter after RUBY)
    description: 'EM PEARL Level — 6.50 Crore SV target',
    rewardBenefits: [
      { name: 'EM Pearl Reward 1', rvAmount: L(46)   },  // 46L RV
      { name: 'EM Pearl Reward 2', rvAmount: L(88)   },  // 88L RV
      { name: 'EM Pearl Reward 3', rvAmount: L(130)  },  // 130L RV
      { name: 'EM Pearl Reward 4', rvAmount: L(172)  },  // 172L RV
      { name: 'EM Pearl Reward 5', rvAmount: L(214)  },  // 214L RV
    ],
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
async function seedSalaryPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans
    const deleted = await SalaryPlan.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing salary plans`);

    // Insert all plans
    const inserted = await SalaryPlan.insertMany(PLANS);
    console.log(`✅ Seeded ${inserted.length} salary plans\n`);

    // Summary table
    console.log('📊 Salary Plan Summary:');
    console.log('─'.repeat(72));
    console.log(
      'Role'.padEnd(16) + 'Level'.padEnd(8) +
      'SV Target'.padEnd(20) + 'RV Rewards Count'
    );
    console.log('─'.repeat(72));

    const ROLE_ABBR = {
      ADVISOR: 'PR', DO_MANAGER: 'DO', AREA_MANAGER: 'RM',
      ZONAL_MANAGER: 'ZM', STATE_HEAD: 'EM',
    };
    const fmtNum = (n) => {
      if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
      if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
      if (n >= 1000) return (n / 1000).toFixed(1) + ' K';
      return n.toString();
    };

    PLANS.forEach(p => {
      const abbr = ROLE_ABBR[p.role] || p.role;
      console.log(
        `${abbr} (${p.role})`.padEnd(16) +
        p.level.padEnd(8) +
        fmtNum(p.svTarget).padEnd(20) +
        `${p.rewardBenefits.length} benefits`
      );
    });
    console.log('─'.repeat(72));
    console.log(`\nTotal: ${PLANS.length} plans (5 roles × 3 levels)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedSalaryPlans();
