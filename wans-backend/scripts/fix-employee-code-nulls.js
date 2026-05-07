/**
 * Migration: Fix duplicate-key errors on employeeCode sparse unique index
 *
 * Root cause: The User model had `employeeCode: { ..., default: null }`.
 * MongoDB's sparse unique index DOES index documents where the field is
 * explicitly set to null — only absent (undefined) fields are skipped.
 * This caused duplicate key errors when a second user registered with
 * no employee code (MINI_STOCK, WHOLESALE, CUSTOMER, ADVISOR).
 *
 * Fix: $unset the employeeCode field from all documents where it is null
 * so those documents are no longer indexed, allowing unlimited non-employee
 * users to coexist without conflicting on the unique index.
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const col = mongoose.connection.collection('users');

  // Count how many documents have the field explicitly set to null
  const nullCount = await col.countDocuments({ employeeCode: null });
  console.log(`Found ${nullCount} user(s) with employeeCode = null`);

  if (nullCount === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  // Remove the field entirely using a raw MongoDB update with $unset operator
  // We must use the raw driver here because Mongoose strips $unset when using
  // its own update methods on a field that has no default.
  const result = await col.bulkWrite([
    {
      updateMany: {
        filter: { employeeCode: null },
        update: { $unset: { employeeCode: '' } },
      },
    },
  ]);

  console.log(`✅ Migration complete — modified ${result.modifiedCount} document(s)`);

  // Verify
  const remaining = await col.countDocuments({ employeeCode: null });
  const absent    = await col.countDocuments({ employeeCode: { $exists: false } });
  console.log(`Remaining null employeeCodes: ${remaining}`);
  console.log(`Documents with absent employeeCode (correct): ${absent}`);

  await mongoose.disconnect();
  console.log('✅ Disconnected. Done.');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
