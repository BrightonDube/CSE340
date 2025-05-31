const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Sample data
const sampleClassifications = [
  { classification_name: 'SUV' },
  { classification_name: 'Sedan' },
  { classification_name: 'Truck' },
  { classification_name: 'Motorcycle' },
  { classification_name: 'Van' }
];

const sampleInventory = [
  {
    classification_id: 1, // SUV
    inv_make: 'Jeep',
    inv_model: 'Wrangler',
    inv_year: 2023,
    inv_description: 'The iconic off-road SUV with removable doors and roof.',
    inv_image: '/images/vehicles/no-image.png',
    inv_thumbnail: '/images/vehicles/no-image-tn.png',
    inv_price: 35000,
    inv_miles: 1500,
    inv_color: 'Black'
  },
  {
    classification_id: 2, // Sedan
    inv_make: 'Honda',
    inv_model: 'Civic',
    inv_year: 2023,
    inv_description: 'Reliable and fuel-efficient compact sedan.',
    inv_image: '/images/vehicles/no-image.png',
    inv_thumbnail: '/images/vehicles/no-image-tn.png',
    inv_price: 25000,
    inv_miles: 2000,
    inv_color: 'Blue'
  },
  {
    classification_id: 3, // Truck
    inv_make: 'Ford',
    inv_model: 'F-150',
    inv_year: 2023,
    inv_description: 'America\'s best-selling truck for over 40 years.',
    inv_image: '/images/vehicles/no-image.png',
    inv_thumbnail: '/images/vehicles/no-image-tn.png',
    inv_price: 45000,
    inv_miles: 1000,
    inv_color: 'White'
  },
  {
    classification_id: 4, // Motorcycle
    inv_make: 'Harley-Davidson',
    inv_model: 'Street Glide',
    inv_year: 2023,
    inv_description: 'Touring motorcycle with classic Harley styling.',
    inv_image: '/images/vehicles/no-image.png',
    inv_thumbnail: '/images/vehicles/no-image-tn.png',
    inv_price: 28000,
    inv_miles: 500,
    inv_color: 'Black'
  },
  {
    classification_id: 5, // Van
    inv_make: 'Chrysler',
    inv_model: 'Pacifica',
    inv_year: 2023,
    inv_description: 'Family-friendly minivan with Stow 'n Go seating.',
    inv_image: '/images/vehicles/no-image.png',
    inv_thumbnail: '/images/vehicles/no-image-tn.png',
    inv_price: 40000,
    inv_miles: 3000,
    inv_color: 'Silver'
  }
];

// Insert sample data
async function insertSampleData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert classifications
    console.log('Inserting sample classifications...');
    for (const classification of sampleClassifications) {
      const result = await client.query(
        'INSERT INTO classification (classification_name) VALUES ($1) RETURNING *',
        [classification.classification_name]
      );
      console.log(`Inserted classification: ${result.rows[0].classification_name}`);
    }
    
    // Insert inventory items
    console.log('\nInserting sample inventory items...');
    for (const item of sampleInventory) {
      const result = await client.query(
        `INSERT INTO inventory (
          classification_id, inv_make, inv_model, inv_year, inv_description,
          inv_image, inv_thumbnail, inv_price, inv_miles, inv_color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          item.classification_id,
          item.inv_make,
          item.inv_model,
          item.inv_year,
          item.inv_description,
          item.inv_image,
          item.inv_thumbnail,
          item.inv_price,
          item.inv_miles,
          item.inv_color
        ]
      );
      console.log(`Inserted inventory item: ${item.inv_year} ${item.inv_make} ${item.inv_model}`);
    }
    
    await client.query('COMMIT');
    console.log('\nSample data inserted successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting sample data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
insertSampleData();
