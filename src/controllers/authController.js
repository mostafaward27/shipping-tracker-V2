const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Username and password required' 
                });
            }

            const admin = await Admin.findByUsername(username);
            if (!admin) {
                return res.status(401).json({ 
                    error: 'Invalid credentials' 
                });
            }

            const validPassword = await Admin.verifyPassword(password, admin.password_hash);
            if (!validPassword) {
                return res.status(401).json({ 
                    error: 'Invalid credentials' 
                });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({ 
                message: 'Login successful',
                token,
                user: {
                    id: admin.id,
                    username: admin.username
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    }

    static async register(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Username and password required' 
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ 
                    error: 'Password must be at least 6 characters' 
                });
            }

            const existingAdmin = await Admin.findByUsername(username);
            if (existingAdmin) {
                return res.status(400).json({ 
                    error: 'Username already exists' 
                });
            }

            const adminId = await Admin.create(username, password);
            
            res.status(201).json({ 
                message: 'Admin created successfully',
                adminId 
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    }
}

module.exports = AuthController;