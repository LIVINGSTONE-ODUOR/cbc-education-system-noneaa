// Quick script to fix the unique constraint
// Run with: node fix_constraint.js
const { pool } = require('./src/config/database');

async function fixConstraint() {
  const client = await pool.connect();
  try {
    // Drop old constraint
    await client.query(`
      ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_school_year_unique
    `);
    console.log('✅ Dropped old constraint');

    // Add new constraint that allows Term 1, Term 2, Term 3 per year
    await client.query(`
      ALTER TABLE academic_years ADD CONSTRAINT academic_years_school_year_name_unique 
      UNIQUE (school_id, year, name)
    `);
    console.log('✅ Added new constraint: academic_years_school_year_name_unique');
    console.log('Now you can have Term 1, Term 2, Term 3 per year!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixConstraint();
