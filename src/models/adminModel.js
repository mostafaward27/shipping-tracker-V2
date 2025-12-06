const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
    static async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    static async create(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return result.insertId;
    }

    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = Admin;