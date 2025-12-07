const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shipping_tracker',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // For Railway/Render deployment
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined
};

// For Railway specific configuration
if (process.env.RAILWAY_ENVIRONMENT) {
    // Railway provides DATABASE_URL environment variable
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        dbConfig.host = url.hostname;
        dbConfig.port = url.port;
        dbConfig.user = url.username;
        dbConfig.password = url.password;
        dbConfig.database = url.pathname.substring(1);
        dbConfig.ssl = { rejectUnauthorized: false };
    }
}

// For Render deployment
if (process.env.RENDER) {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        dbConfig.host = url.hostname;
        dbConfig.port = url.port;
        dbConfig.user = url.username;
        dbConfig.password = url.password;
        dbConfig.database = url.pathname.substring(1);
        dbConfig.ssl = { rejectUnauthorized: false };
    }
}

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        console.log(`📊 Host: ${dbConfig.host}`);
        console.log(`📁 Database: ${dbConfig.database}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.log('📝 Current config:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });
    });

module.exports = pool;