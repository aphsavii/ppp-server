import { Pool } from 'pg';

// Define database connection settings
const dbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
const testConnection = async (): Promise<void> => {
  try {
    const client = await dbPool.connect();
    console.log('Connected to the PostgreSQL database!');
    client.release(); // release the client back to the pool
  } catch (err) {
    console.error('Failed to connect to the PostgreSQL database:', err);
  }
};

export {dbPool, testConnection};
