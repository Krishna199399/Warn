require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User             = require('../src/models/User');
const Product          = require('../src/models/Product');
const Farmer           = require('../src/models/Farmer');
const Order            = require('../src/models/Order');
const Commission       = require('../src/models/Commission');
const Task             = require('../src/models/Task');
const Inventory        = require('../src/models/Inventory');

const { buildHierarchySnapshot, calculateCommissions } = require('../src/services/hierarchy.service');

// ─── Seed data ────────────────────────────────────────────────────────────────
const USERS_SEED = [
  // Admin - APPROVED
  { name:'Ravi Kumar',     email:'admin@wans.com',      password:'admin123', role:'ADMIN',         region:'All India',    state:'All',         avatar:'RK', phone:'9876500001', parentEmail: null, status:'APPROVED' },
  
  // State Heads - APPROVED
  { name:'Suresh Patel',   email:'state@wans.com',      password:'state123', role:'STATE_HEAD',    region:'Gujarat',      state:'Gujarat',     avatar:'SP', phone:'9876500002', parentEmail:'admin@wans.com', status:'APPROVED' },
  { name:'Rajesh Singh',   email:'state2@wans.com',     password:'state123', role:'STATE_HEAD',    region:'Maharashtra',  state:'Maharashtra', avatar:'RS', phone:'9876500020', parentEmail:'admin@wans.com', status:'APPROVED' },
  
  // Zonal Managers - Gujarat - APPROVED
  { name:'Anita Sharma',   email:'zonal@wans.com',      password:'zone123',  role:'ZONAL_MANAGER', region:'Ahmedabad',    state:'Gujarat',     avatar:'AS', phone:'9876500003', parentEmail:'state@wans.com', status:'APPROVED' },
  { name:'Vikram Desai',   email:'zonal2@wans.com',     password:'zone123',  role:'ZONAL_MANAGER', region:'Surat',        state:'Gujarat',     avatar:'VD', phone:'9876500021', parentEmail:'state@wans.com', status:'APPROVED' },
  
  // Zonal Managers - Maharashtra - APPROVED
  { name:'Meera Kulkarni', email:'zonal3@wans.com',     password:'zone123',  role:'ZONAL_MANAGER', region:'Pune',         state:'Maharashtra', avatar:'MK', phone:'9876500022', parentEmail:'state2@wans.com', status:'APPROVED' },
  
  // Area Managers - Gujarat - APPROVED
  { name:'Priya Nair',     email:'area@wans.com',       password:'area123',  role:'AREA_MANAGER',  region:'Anand',        state:'Gujarat',     avatar:'PN', phone:'9876500006', parentEmail:'zonal@wans.com', status:'APPROVED' },
  { name:'Ketan Shah',     email:'area2@wans.com',      password:'area123',  role:'AREA_MANAGER',  region:'Nadiad',       state:'Gujarat',     avatar:'KS', phone:'9876500023', parentEmail:'zonal@wans.com', status:'APPROVED' },
  { name:'Deepak Joshi',   email:'area3@wans.com',      password:'area123',  role:'AREA_MANAGER',  region:'Bharuch',      state:'Gujarat',     avatar:'DJ', phone:'9876500024', parentEmail:'zonal2@wans.com', status:'APPROVED' },
  
  // Area Managers - Maharashtra - APPROVED
  { name:'Sanjay Patil',   email:'area4@wans.com',      password:'area123',  role:'AREA_MANAGER',  region:'Satara',       state:'Maharashtra', avatar:'SP', phone:'9876500025', parentEmail:'zonal3@wans.com', status:'APPROVED' },
  
  // DO Managers - Gujarat - APPROVED
  { name:'Ramesh Yadav',   email:'do@wans.com',         password:'do123',    role:'DO_MANAGER',    region:'Anand North',  state:'Gujarat',     avatar:'RY', phone:'9876500007', parentEmail:'area@wans.com', status:'APPROVED' },
  { name:'Gopal Krishna',  email:'do2@wans.com',        password:'do123',    role:'DO_MANAGER',    region:'Anand South',  state:'Gujarat',     avatar:'GK', phone:'9876500026', parentEmail:'area@wans.com', status:'APPROVED' },
  { name:'Ashok Mehta',    email:'do3@wans.com',        password:'do123',    role:'DO_MANAGER',    region:'Nadiad East',  state:'Gujarat',     avatar:'AM', phone:'9876500027', parentEmail:'area2@wans.com', status:'APPROVED' },
  { name:'Bharat Trivedi', email:'do4@wans.com',        password:'do123',    role:'DO_MANAGER',    region:'Bharuch West', state:'Gujarat',     avatar:'BT', phone:'9876500028', parentEmail:'area3@wans.com', status:'APPROVED' },
  
  // DO Managers - Maharashtra - APPROVED
  { name:'Anil Jadhav',    email:'do5@wans.com',        password:'do123',    role:'DO_MANAGER',    region:'Satara North', state:'Maharashtra', avatar:'AJ', phone:'9876500029', parentEmail:'area4@wans.com', status:'APPROVED' },
  
  // Advisors - Gujarat - APPROVED
  { name:'Mohan Verma',    email:'advisor@wans.com',    password:'adv123',   role:'ADVISOR',       region:'Anand',        state:'Gujarat',     avatar:'MV', phone:'9876500008', parentEmail:'do@wans.com',   advisorCode:'ADV00108', status:'APPROVED' },
  { name:'Savita Bai',     email:'savita@wans.com',     password:'adv456',   role:'ADVISOR',       region:'Anand',        state:'Gujarat',     avatar:'SB', phone:'9876500009', parentEmail:'do@wans.com',   advisorCode:'ADV00109', status:'APPROVED' },
  { name:'Dinesh Kumar',   email:'dinesh@wans.com',     password:'adv123',   role:'ADVISOR',       region:'Anand',        state:'Gujarat',     avatar:'DK', phone:'9876500030', parentEmail:'do2@wans.com',  advisorCode:'ADV00110', status:'APPROVED' },
  { name:'Lalita Devi',    email:'lalita@wans.com',     password:'adv123',   role:'ADVISOR',       region:'Nadiad',       state:'Gujarat',     avatar:'LD', phone:'9876500031', parentEmail:'do3@wans.com',  advisorCode:'ADV00111', status:'APPROVED' },
  { name:'Prakash Rao',    email:'prakash@wans.com',    password:'adv123',   role:'ADVISOR',       region:'Bharuch',      state:'Gujarat',     avatar:'PR', phone:'9876500032', parentEmail:'do4@wans.com',  advisorCode:'ADV00112', status:'APPROVED' },
  
  // Advisors - Maharashtra - APPROVED
  { name:'Sunita Pawar',   email:'sunita@wans.com',     password:'adv123',   role:'ADVISOR',       region:'Satara',       state:'Maharashtra', avatar:'SP', phone:'9876500033', parentEmail:'do5@wans.com',  advisorCode:'ADV00113', status:'APPROVED' },
  { name:'Ganesh More',    email:'ganesh@wans.com',     password:'adv123',   role:'ADVISOR',       region:'Satara',       state:'Maharashtra', avatar:'GM', phone:'9876500034', parentEmail:'do5@wans.com',  advisorCode:'ADV00114', status:'APPROVED' },
  
  // Wholesale & Mini Stock - APPROVED
  { name:'Kiran Bros.',    email:'wholesale@wans.com',  password:'ws123',    role:'WHOLESALE',     region:'Vadodara',     state:'Gujarat',     avatar:'KB', phone:'9876500010', parentEmail: null, status:'APPROVED' },
  { name:'Agro Traders',   email:'wholesale2@wans.com', password:'ws123',    role:'WHOLESALE',     region:'Pune',         state:'Maharashtra', avatar:'AT', phone:'9876500035', parentEmail: null, status:'APPROVED' },
  { name:'Laxmi Stores',   email:'mini@wans.com',       password:'mini123',  role:'MINI_STOCK',    region:'Anand Town',   state:'Gujarat',     avatar:'LS', phone:'9876500011', parentEmail: null, status:'APPROVED' },
  { name:'Shree Traders',  email:'mini2@wans.com',      password:'mini123',  role:'MINI_STOCK',    region:'Satara Town',  state:'Maharashtra', avatar:'ST', phone:'9876500036', parentEmail: null, status:'APPROVED' },
];

const PRODUCTS_SEED = [
  // Seeds
  { name:'Premium Wheat Seeds',     category:'Seeds',      price:850,  stock:450, unit:'kg',         sku:'SED001' },
  { name:'Hybrid Cotton Seeds',     category:'Seeds',      price:1100, stock:12,  unit:'packet',     sku:'SED005' },
  { name:'Basmati Rice Seeds',      category:'Seeds',      price:950,  stock:280, unit:'kg',         sku:'SED009' },
  { name:'Sunflower Seeds',         category:'Seeds',      price:720,  stock:195, unit:'kg',         sku:'SED010' },
  { name:'Maize Hybrid Seeds',      category:'Seeds',      price:680,  stock:340, unit:'kg',         sku:'SED011' },
  
  // Fertilizers
  { name:'NPK Fertilizer 15-15-15', category:'Fertilizer', price:1200, stock:320, unit:'bag (50kg)', sku:'FER002' },
  { name:'Urea Granules',           category:'Fertilizer', price:660,  stock:0,   unit:'bag (45kg)', sku:'FER006' },
  { name:'DAP Fertilizer',          category:'Fertilizer', price:1450, stock:210, unit:'bag (50kg)', sku:'FER012' },
  { name:'Potash Fertilizer',       category:'Fertilizer', price:980,  stock:165, unit:'bag (50kg)', sku:'FER013' },
  { name:'Organic Compost',         category:'Fertilizer', price:420,  stock:380, unit:'bag (25kg)', sku:'FER014' },
  
  // Pesticides
  { name:'Bio Pesticide Spray',     category:'Pesticide',  price:450,  stock:180, unit:'litre',      sku:'PES003' },
  { name:'Insecticide Powder',      category:'Pesticide',  price:580,  stock:145, unit:'kg',         sku:'PES015' },
  { name:'Fungicide Solution',      category:'Pesticide',  price:720,  stock:98,  unit:'litre',      sku:'PES016' },
  { name:'Herbicide Spray',         category:'Pesticide',  price:650,  stock:122, unit:'litre',      sku:'PES017' },
  
  // Equipment
  { name:'Drip Irrigation Kit',     category:'Equipment',  price:8500, stock:45,  unit:'set',        sku:'EQP004' },
  { name:'Soil Testing Kit',        category:'Equipment',  price:2200, stock:35,  unit:'kit',        sku:'EQP008' },
  { name:'Sprayer Pump',            category:'Equipment',  price:3500, stock:28,  unit:'unit',       sku:'EQP018' },
  { name:'Garden Tools Set',        category:'Equipment',  price:1850, stock:52,  unit:'set',        sku:'EQP019' },
  { name:'Water Tank 500L',         category:'Equipment',  price:4200, stock:18,  unit:'unit',       sku:'EQP020' },
  
  // Supplements
  { name:'Growth Booster Liquid',   category:'Supplement', price:380,  stock:220, unit:'litre',      sku:'SUP007' },
  { name:'Micronutrient Mix',       category:'Supplement', price:520,  stock:175, unit:'kg',         sku:'SUP021' },
  { name:'Root Stimulator',         category:'Supplement', price:450,  stock:140, unit:'litre',      sku:'SUP022' },
  { name:'Flowering Booster',       category:'Supplement', price:680,  stock:95,  unit:'litre',      sku:'SUP023' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}), Product.deleteMany({}), Farmer.deleteMany({}),
      Order.deleteMany({}), Commission.deleteMany({}), Task.deleteMany({}),
      Inventory.deleteMany({}),
    ]);
    console.log('🗑  Cleared all collections');

    // ── Create Users (in order so parentId refs work) ────────────────────────
    const emailToId = {};
    for (const u of USERS_SEED) {
      const { parentEmail, ...data } = u;
      const roleHistory = [{ role: data.role, from: new Date('2023-01-01'), to: null }];
      const created = await User.create({ ...data, roleHistory });
      emailToId[data.email] = created._id;
    }
    // Second pass: wire up parentId
    for (const u of USERS_SEED) {
      if (u.parentEmail) {
        await User.findByIdAndUpdate(emailToId[u.email], { parentId: emailToId[u.parentEmail] });
      }
    }
    console.log(`👥 Created ${USERS_SEED.length} users`);

    // ── Products ─────────────────────────────────────────────────────────────
    const products = await Product.insertMany(PRODUCTS_SEED);
    const prodMap  = Object.fromEntries(products.map(p => [p.sku, p._id]));
    console.log(`📦 Created ${products.length} products`);

    // ── Farmers ──────────────────────────────────────────────────────────────
    const mohanId   = emailToId['advisor@wans.com'];
    const savitaId  = emailToId['savita@wans.com'];
    const dineshId  = emailToId['dinesh@wans.com'];
    const lalitaId  = emailToId['lalita@wans.com'];
    const prakashId = emailToId['prakash@wans.com'];
    const sunitaId  = emailToId['sunita@wans.com'];
    const ganeshId  = emailToId['ganesh@wans.com'];
    
    const farmers  = await Farmer.insertMany([
      // Mohan's farmers (Anand)
      { advisorId: mohanId,   name:'Hasmukh Patel',    phone:'9898000001', village:'Borsad',    acres:5.5,  crop:'Cotton'   },
      { advisorId: mohanId,   name:'Ranchod Desai',    phone:'9898000002', village:'Petlad',    acres:3.0,  crop:'Wheat'    },
      { advisorId: mohanId,   name:'Natvarlal Shah',   phone:'9898000003', village:'Anklav',    acres:7.2,  crop:'Rice'     },
      { advisorId: mohanId,   name:'Jagdish Parmar',   phone:'9898000010', village:'Borsad',    acres:4.8,  crop:'Sugarcane'},
      
      // Savita's farmers (Anand)
      { advisorId: savitaId,  name:'Devjibhai Amin',   phone:'9898000004', village:'Umreth',    acres:4.5,  crop:'Cotton'   },
      { advisorId: savitaId,  name:'Bhikha Bhai',      phone:'9898000005', village:'Sojitra',   acres:2.0,  crop:'Tobacco'  },
      { advisorId: savitaId,  name:'Kantibhai Patel',  phone:'9898000011', village:'Umreth',    acres:6.3,  crop:'Wheat'    },
      
      // Dinesh's farmers (Anand)
      { advisorId: dineshId,  name:'Ramanbhai Desai',  phone:'9898000012', village:'Khambhat',  acres:5.0,  crop:'Cotton'   },
      { advisorId: dineshId,  name:'Jayesh Trivedi',   phone:'9898000013', village:'Tarapur',   acres:3.5,  crop:'Rice'     },
      { advisorId: dineshId,  name:'Mahesh Solanki',   phone:'9898000014', village:'Borsad',    acres:4.2,  crop:'Maize'    },
      
      // Lalita's farmers (Nadiad)
      { advisorId: lalitaId,  name:'Suresh Chaudhari', phone:'9898000006', village:'Nadiad',    acres:8.0,  crop:'Wheat'    },
      { advisorId: lalitaId,  name:'Kishore Pandya',   phone:'9898000007', village:'Mahemdabad',acres:6.5,  crop:'Cotton'   },
      { advisorId: lalitaId,  name:'Dilip Raval',      phone:'9898000015', village:'Nadiad',    acres:3.8,  crop:'Vegetables'},
      
      // Prakash's farmers (Bharuch)
      { advisorId: prakashId, name:'Ashwin Bhatt',     phone:'9898000008', village:'Bharuch',   acres:10.0, crop:'Sugarcane'},
      { advisorId: prakashId, name:'Nilesh Vora',      phone:'9898000009', village:'Ankleshwar',acres:7.5,  crop:'Cotton'   },
      { advisorId: prakashId, name:'Hitesh Makwana',   phone:'9898000016', village:'Bharuch',   acres:5.5,  crop:'Rice'     },
      
      // Sunita's farmers (Satara)
      { advisorId: sunitaId,  name:'Balasaheb Patil',  phone:'9898000017', village:'Satara',    acres:9.0,  crop:'Sugarcane'},
      { advisorId: sunitaId,  name:'Dnyaneshwar Jadhav',phone:'9898000018',village:'Karad',     acres:6.0,  crop:'Cotton'   },
      { advisorId: sunitaId,  name:'Vitthal Shinde',   phone:'9898000019', village:'Phaltan',   acres:4.5,  crop:'Wheat'    },
      
      // Ganesh's farmers (Satara)
      { advisorId: ganeshId,  name:'Raghunath More',   phone:'9898000020', village:'Satara',    acres:7.8,  crop:'Cotton'   },
      { advisorId: ganeshId,  name:'Shankar Kamble',   phone:'9898000021', village:'Wai',       acres:5.2,  crop:'Rice'     },
      { advisorId: ganeshId,  name:'Baban Gaikwad',    phone:'9898000022', village:'Koregaon',  acres:3.9,  crop:'Vegetables'},
    ]);
    console.log(`🌾 Created ${farmers.length} farmers`);

    // ── Orders + Snapshots + Commissions ─────────────────────────────────────
    // Reload users with parentId populated for snapshot building
    const allUsers = await User.find({}).lean();
    // Patch mongoose model so buildHierarchySnapshot works (needs DB)
    const orderSeeds = [
      // Recent orders (April 2024)
      { advisorId: mohanId,   farmerId: farmers[0]._id,  productId: prodMap['SED001'], qty:20,  total:17000,  status:'Delivered',  region:'Anand',        date: new Date('2024-04-10') },
      { advisorId: savitaId,  farmerId: farmers[4]._id,  productId: prodMap['FER002'], qty:5,   total:6000,   status:'Processing', region:'Anand',        date: new Date('2024-04-10') },
      { advisorId: mohanId,   farmerId: farmers[1]._id,  productId: prodMap['PES003'], qty:10,  total:4500,   status:'Delivered',  region:'Anand',        date: new Date('2024-04-09') },
      { advisorId: savitaId,  farmerId: farmers[5]._id,  productId: prodMap['SUP007'], qty:15,  total:5700,   status:'Pending',    region:'Anand',        date: new Date('2024-04-09') },
      { advisorId: mohanId,   farmerId: farmers[2]._id,  productId: prodMap['SED005'], qty:8,   total:8800,   status:'Delivered',  region:'Anand',        date: new Date('2024-04-08') },
      { advisorId: mohanId,   farmerId: farmers[0]._id,  productId: prodMap['EQP008'], qty:3,   total:6600,   status:'Delivered',  region:'Anand',        date: new Date('2024-04-07') },
      { advisorId: dineshId,  farmerId: farmers[7]._id,  productId: prodMap['SED009'], qty:25,  total:23750,  status:'Delivered',  region:'Anand',        date: new Date('2024-04-10') },
      { advisorId: dineshId,  farmerId: farmers[8]._id,  productId: prodMap['FER012'], qty:4,   total:5800,   status:'Processing', region:'Anand',        date: new Date('2024-04-09') },
      { advisorId: lalitaId,  farmerId: farmers[10]._id, productId: prodMap['SED001'], qty:30,  total:25500,  status:'Delivered',  region:'Nadiad',       date: new Date('2024-04-10') },
      { advisorId: lalitaId,  farmerId: farmers[11]._id, productId: prodMap['PES015'], qty:12,  total:6960,   status:'Delivered',  region:'Nadiad',       date: new Date('2024-04-08') },
      { advisorId: prakashId, farmerId: farmers[13]._id, productId: prodMap['FER014'], qty:20,  total:8400,   status:'Delivered',  region:'Bharuch',      date: new Date('2024-04-09') },
      { advisorId: prakashId, farmerId: farmers[14]._id, productId: prodMap['SED005'], qty:15,  total:16500,  status:'Processing', region:'Bharuch',      date: new Date('2024-04-10') },
      { advisorId: sunitaId,  farmerId: farmers[16]._id, productId: prodMap['FER002'], qty:10,  total:12000,  status:'Delivered',  region:'Satara',       date: new Date('2024-04-10') },
      { advisorId: sunitaId,  farmerId: farmers[17]._id, productId: prodMap['SUP021'], qty:8,   total:4160,   status:'Delivered',  region:'Satara',       date: new Date('2024-04-09') },
      { advisorId: ganeshId,  farmerId: farmers[19]._id, productId: prodMap['SED011'], qty:22,  total:14960,  status:'Delivered',  region:'Satara',       date: new Date('2024-04-08') },
      
      // Older orders (March 2024)
      { advisorId: mohanId,   farmerId: farmers[3]._id,  productId: prodMap['FER013'], qty:6,   total:5880,   status:'Delivered',  region:'Anand',        date: new Date('2024-03-28') },
      { advisorId: savitaId,  farmerId: farmers[6]._id,  productId: prodMap['SED001'], qty:18,  total:15300,  status:'Delivered',  region:'Anand',        date: new Date('2024-03-25') },
      { advisorId: dineshId,  farmerId: farmers[9]._id,  productId: prodMap['PES016'], qty:7,   total:5040,   status:'Delivered',  region:'Anand',        date: new Date('2024-03-22') },
      { advisorId: lalitaId,  farmerId: farmers[12]._id, productId: prodMap['SUP022'], qty:10,  total:4500,   status:'Delivered',  region:'Nadiad',       date: new Date('2024-03-20') },
      { advisorId: prakashId, farmerId: farmers[15]._id, productId: prodMap['EQP018'], qty:2,   total:7000,   status:'Delivered',  region:'Bharuch',      date: new Date('2024-03-18') },
      { advisorId: sunitaId,  farmerId: farmers[18]._id, productId: prodMap['FER012'], qty:8,   total:11600,  status:'Delivered',  region:'Satara',       date: new Date('2024-03-15') },
      { advisorId: ganeshId,  farmerId: farmers[20]._id, productId: prodMap['SED009'], qty:16,  total:15200,  status:'Delivered',  region:'Satara',       date: new Date('2024-03-12') },
      
      // February 2024
      { advisorId: mohanId,   farmerId: farmers[1]._id,  productId: prodMap['SUP023'], qty:5,   total:3400,   status:'Delivered',  region:'Anand',        date: new Date('2024-02-28') },
      { advisorId: savitaId,  farmerId: farmers[4]._id,  productId: prodMap['PES017'], qty:9,   total:5850,   status:'Delivered',  region:'Anand',        date: new Date('2024-02-25') },
      { advisorId: lalitaId,  farmerId: farmers[11]._id, productId: prodMap['FER014'], qty:15,  total:6300,   status:'Delivered',  region:'Nadiad',       date: new Date('2024-02-20') },
      { advisorId: prakashId, farmerId: farmers[14]._id, productId: prodMap['SED010'], qty:20,  total:14400,  status:'Delivered',  region:'Bharuch',      date: new Date('2024-02-15') },
    ];

    let allCommissions = [];
    for (const seed of orderSeeds) {
      const snapshot = await buildHierarchySnapshot(seed.advisorId);
      const order    = await Order.create({ ...seed, hierarchySnapshot: snapshot });
      const comms    = await calculateCommissions(order, snapshot);
      allCommissions.push(...comms);
    }
    await Commission.insertMany(allCommissions);
    console.log(`📋 Created ${orderSeeds.length} orders + ${allCommissions.length} commission records`);

    // ── Tasks ─────────────────────────────────────────────────────────────────
    await Task.insertMany([
      // Mohan's tasks
      { assignedTo: mohanId,   title:'Visit Hasmukh Patel farm',        due: new Date('2024-04-12'), priority:'High',   type:'Field Visit'  },
      { assignedTo: mohanId,   title:'Collect feedback from Borsad',     due: new Date('2024-04-13'), priority:'Medium', type:'Feedback'     },
      { assignedTo: mohanId,   title:'Demo NPK Fertilizer to farmers',   due: new Date('2024-04-11'), priority:'High',   status:'Completed', type:'Demo' },
      { assignedTo: mohanId,   title:'Submit weekly report',             due: new Date('2024-04-14'), priority:'Low',    type:'Report'       },
      
      // Savita's tasks
      { assignedTo: savitaId,  title:'Follow up Devjibhai',              due: new Date('2024-04-10'), priority:'Medium', status:'Completed', type:'Follow-up' },
      { assignedTo: savitaId,  title:'Organize farmer meeting Umreth',   due: new Date('2024-04-15'), priority:'High',   type:'Other'        },
      { assignedTo: savitaId,  title:'Collect payment from Kantibhai',   due: new Date('2024-04-11'), priority:'High',   type:'Collection'   },
      
      // Dinesh's tasks
      { assignedTo: dineshId,  title:'Visit Ramanbhai farm',             due: new Date('2024-04-12'), priority:'High',   type:'Field Visit'  },
      { assignedTo: dineshId,  title:'Demo drip irrigation system',      due: new Date('2024-04-14'), priority:'Medium', type:'Demo'         },
      { assignedTo: dineshId,  title:'Submit monthly sales report',      due: new Date('2024-04-16'), priority:'Medium', type:'Report'       },
      
      // Lalita's tasks
      { assignedTo: lalitaId,  title:'Meet Suresh Chaudhari',            due: new Date('2024-04-11'), priority:'High',   status:'Completed', type:'Field Visit' },
      { assignedTo: lalitaId,  title:'Conduct soil testing demo',        due: new Date('2024-04-13'), priority:'Medium', type:'Demo'         },
      { assignedTo: lalitaId,  title:'Follow up pending orders',         due: new Date('2024-04-15'), priority:'Low',    type:'Follow-up'    },
      
      // Prakash's tasks
      { assignedTo: prakashId, title:'Visit Ashwin Bhatt sugarcane farm',due: new Date('2024-04-12'), priority:'High',   type:'Field Visit'  },
      { assignedTo: prakashId, title:'Collect feedback Bharuch region',  due: new Date('2024-04-14'), priority:'Medium', type:'Feedback'     },
      { assignedTo: prakashId, title:'Demo new pesticide products',      due: new Date('2024-04-16'), priority:'Medium', type:'Demo'         },
      
      // Sunita's tasks
      { assignedTo: sunitaId,  title:'Visit Balasaheb Patil farm',       due: new Date('2024-04-11'), priority:'High',   status:'Completed', type:'Field Visit' },
      { assignedTo: sunitaId,  title:'Organize training session Satara', due: new Date('2024-04-15'), priority:'High',   type:'Other'        },
      { assignedTo: sunitaId,  title:'Submit weekly activity report',    due: new Date('2024-04-13'), priority:'Low',    type:'Report'       },
      
      // Ganesh's tasks
      { assignedTo: ganeshId,  title:'Follow up Raghunath More',         due: new Date('2024-04-12'), priority:'Medium', type:'Follow-up'    },
      { assignedTo: ganeshId,  title:'Demo organic fertilizer',          due: new Date('2024-04-14'), priority:'Medium', type:'Demo'         },
      { assignedTo: ganeshId,  title:'Visit Shankar Kamble rice field',  due: new Date('2024-04-16'), priority:'High',   type:'Field Visit'  },
    ]);
    console.log('✅ Created tasks');

    // ── Inventory ─────────────────────────────────────────────────────────────
    const wholesaleId  = emailToId['wholesale@wans.com'];
    const wholesale2Id = emailToId['wholesale2@wans.com'];
    const miniId       = emailToId['mini@wans.com'];
    const mini2Id      = emailToId['mini2@wans.com'];
    
    await Inventory.insertMany([
      {
        ownerId: wholesaleId, ownerRole: 'WHOLESALE',
        items: [
          { productId: prodMap['SED001'], received:600,  dispatched:150, current:450, minLevel:100 },
          { productId: prodMap['FER002'], received:500,  dispatched:180, current:320, minLevel:80  },
          { productId: prodMap['PES003'], received:300,  dispatched:120, current:180, minLevel:50  },
          { productId: prodMap['SED005'], received:100,  dispatched:88,  current:12,  minLevel:30  },
          { productId: prodMap['SED009'], received:400,  dispatched:120, current:280, minLevel:70  },
          { productId: prodMap['FER012'], received:350,  dispatched:140, current:210, minLevel:60  },
          { productId: prodMap['SUP007'], received:300,  dispatched:80,  current:220, minLevel:50  },
        ],
      },
      {
        ownerId: wholesale2Id, ownerRole: 'WHOLESALE',
        items: [
          { productId: prodMap['SED001'], received:500,  dispatched:180, current:320, minLevel:80  },
          { productId: prodMap['FER002'], received:450,  dispatched:200, current:250, minLevel:70  },
          { productId: prodMap['SED011'], received:400,  dispatched:60,  current:340, minLevel:80  },
          { productId: prodMap['FER014'], received:500,  dispatched:120, current:380, minLevel:100 },
          { productId: prodMap['SUP021'], received:250,  dispatched:75,  current:175, minLevel:40  },
        ],
      },
      {
        ownerId: miniId, ownerRole: 'MINI_STOCK',
        items: [
          { productId: prodMap['SED001'], received:150, dispatched:85,  current:65,  minLevel:20 },
          { productId: prodMap['FER002'], received:80,  dispatched:55,  current:25,  minLevel:15 },
          { productId: prodMap['PES003'], received:60,  dispatched:40,  current:20,  minLevel:10 },
          { productId: prodMap['SUP007'], received:100, dispatched:45,  current:55,  minLevel:15 },
          { productId: prodMap['EQP008'], received:50,  dispatched:15,  current:35,  minLevel:10 },
        ],
      },
      {
        ownerId: mini2Id, ownerRole: 'MINI_STOCK',
        items: [
          { productId: prodMap['SED009'], received:120, dispatched:65,  current:55,  minLevel:20 },
          { productId: prodMap['FER012'], received:90,  dispatched:50,  current:40,  minLevel:15 },
          { productId: prodMap['SED011'], received:100, dispatched:45,  current:55,  minLevel:20 },
          { productId: prodMap['SUP021'], received:70,  dispatched:30,  current:40,  minLevel:15 },
        ],
      },
    ]);
    console.log('🏪 Created inventory');

    console.log('\n🌱 Seed complete! Demo accounts:');
    console.log('\n📊 HIERARCHY:');
    console.log('   ADMIN          → admin@wans.com     / admin123');
    console.log('   STATE_HEAD     → state@wans.com     / state123  (Gujarat)');
    console.log('   STATE_HEAD     → state2@wans.com    / state123  (Maharashtra)');
    console.log('   ZONAL_MANAGER  → zonal@wans.com     / zone123   (Ahmedabad)');
    console.log('   ZONAL_MANAGER  → zonal2@wans.com    / zone123   (Surat)');
    console.log('   ZONAL_MANAGER  → zonal3@wans.com    / zone123   (Pune)');
    console.log('   AREA_MANAGER   → area@wans.com      / area123   (Anand)');
    console.log('   AREA_MANAGER   → area2@wans.com     / area123   (Nadiad)');
    console.log('   AREA_MANAGER   → area3@wans.com     / area123   (Bharuch)');
    console.log('   AREA_MANAGER   → area4@wans.com     / area123   (Satara)');
    console.log('   DO_MANAGER     → do@wans.com        / do123     (Anand North)');
    console.log('   DO_MANAGER     → do2@wans.com       / do123     (Anand South)');
    console.log('   DO_MANAGER     → do3@wans.com       / do123     (Nadiad East)');
    console.log('   DO_MANAGER     → do4@wans.com       / do123     (Bharuch West)');
    console.log('   DO_MANAGER     → do5@wans.com       / do123     (Satara North)');
    console.log('   ADVISOR        → advisor@wans.com   / adv123    (Mohan - ADV00108)');
    console.log('   ADVISOR        → savita@wans.com    / adv456    (Savita - ADV00109)');
    console.log('   ADVISOR        → dinesh@wans.com    / adv123    (Dinesh - ADV00110)');
    console.log('   ADVISOR        → lalita@wans.com    / adv123    (Lalita - ADV00111)');
    console.log('   ADVISOR        → prakash@wans.com   / adv123    (Prakash - ADV00112)');
    console.log('   ADVISOR        → sunita@wans.com    / adv123    (Sunita - ADV00113)');
    console.log('   ADVISOR        → ganesh@wans.com    / adv123    (Ganesh - ADV00114)');
    console.log('\n🏪 INVENTORY:');
    console.log('   WHOLESALE      → wholesale@wans.com / ws123     (Vadodara)');
    console.log('   WHOLESALE      → wholesale2@wans.com/ ws123     (Pune)');
    console.log('   MINI_STOCK     → mini@wans.com      / mini123   (Anand Town)');
    console.log('   MINI_STOCK     → mini2@wans.com     / mini123   (Satara Town)');
    console.log('\n📈 DATA SUMMARY:');
    console.log(`   • ${USERS_SEED.length} users across 2 states`);
    console.log(`   • ${products.length} products (Seeds, Fertilizers, Pesticides, Equipment, Supplements)`);
    console.log(`   • ${farmers.length} farmers`);
    console.log(`   • ${orderSeeds.length} orders with commission tracking`);
    console.log(`   • 22 tasks assigned to advisors`);
    console.log(`   • 4 inventory records (2 wholesale + 2 mini stock)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
