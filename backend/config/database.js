"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.closePool = exports.getConnection = exports.transaction = exports.queryOne = exports.query = exports.testConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables FIRST
dotenv_1.default.config();
// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'human_ai_interaction',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};
// Create connection pool
const pool = promise_1.default.createPool(dbConfig);
exports.pool = pool;
// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`👤 User: ${dbConfig.user}`);
        console.log(`🔐 Password: ${dbConfig.password ? 'SET' : 'NOT SET'}`);
        connection.release();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        console.error(`🔍 Attempted connection with user: ${dbConfig.user}`);
        console.error(`🔍 Password set: ${dbConfig.password ? 'YES' : 'NO'}`);
        return false;
    }
};
exports.testConnection = testConnection;
// Execute query with connection from pool
const query = async (sql, params) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    }
    catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};
exports.query = query;
// Execute query and return first row
const queryOne = async (sql, params) => {
    try {
        const [rows] = await pool.execute(sql, params);
        const result = rows;
        return result.length > 0 ? result[0] : null;
    }
    catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};
exports.queryOne = queryOne;
// Execute transaction
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        console.error('❌ Transaction error:', error);
        throw error;
    }
    finally {
        connection.release();
    }
};
exports.transaction = transaction;
// Get connection from pool (for custom operations)
const getConnection = async () => {
    return await pool.getConnection();
};
exports.getConnection = getConnection;
// Close all connections in pool
const closePool = async () => {
    await pool.end();
    console.log('🔌 Database connection pool closed');
};
exports.closePool = closePool;
// Export default connection
exports.default = {
    query: exports.query,
    queryOne: exports.queryOne,
    transaction: exports.transaction,
    getConnection: exports.getConnection,
    testConnection: exports.testConnection,
    closePool: exports.closePool,
    pool,
};
