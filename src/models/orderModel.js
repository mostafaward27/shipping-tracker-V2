const pool = require('../config/database');

class Order {
    // جلب جميع الطلبات مع Pagination - الإصدار النهائي
    static async findAll(page = 1, limit = 10) {
        try {
            console.log('Model findAll - Input:', { page, limit, typePage: typeof page, typeLimit: typeof limit });
            
            // تحويل القيم بأمان
            let pageNum;
            let limitNum;
            
            // معالجة page
            if (page === undefined || page === null || page === '') {
                pageNum = 1;
            } else {
                pageNum = parseInt(String(page), 10);
                if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
            }
            
            // معالجة limit
            if (limit === undefined || limit === null || limit === '') {
                limitNum = 10;
            } else {
                limitNum = parseInt(String(limit), 10);
                if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
                if (limitNum > 100) limitNum = 100;
            }
            
            console.log('Model findAll - Processed:', { pageNum, limitNum });
            
            const offset = (pageNum - 1) * limitNum;
            
            // تأكد من أن القيم أعداد صحيحة
            const limitInt = Number.isInteger(limitNum) ? limitNum : Math.floor(limitNum);
            const offsetInt = Number.isInteger(offset) ? offset : Math.floor(offset);
            
            console.log('Model findAll - Final SQL params:', { limitInt, offsetInt });
            
            // استخدم query بدلاً من execute للتأكد
            const [rows] = await pool.query(
                'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [limitInt, offsetInt]
            );
            
            const [countRows] = await pool.query('SELECT COUNT(*) as total FROM orders');
            return {
                orders: rows,
                total: countRows[0].total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(countRows[0].total / limitNum)
            };
        } catch (error) {
            console.error('Order.findAll error:', {
                message: error.message,
                sql: error.sql,
                parameters: error.parameters,
                stack: error.stack
            });
            throw error;
        }
    }

    // ... باقي الدوال كما هي بدون تغيير
    static async create(orderData) {
        const {
            customer_name,
            phone,
            address,
            origin,
            destination,
            current_status = 'pending',
            metadata = null
        } = orderData;

        const [result] = await pool.execute(
            `INSERT INTO orders 
            (customer_name, phone, address, origin, destination, current_status, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                customer_name,
                phone,
                address,
                origin,
                destination,
                current_status,
                metadata ? JSON.stringify(metadata) : null
            ]
        );

        if (result.insertId) {
            await this.addStatusHistory(result.insertId, current_status, 'Order created');
        }

        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, orderData) {
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(orderData)) {
            if (key !== 'id' && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(key === 'metadata' && value ? JSON.stringify(value) : value);
            }
        }
        
        if (fields.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.execute(query, values);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status, note = '') {
        const [result] = await pool.execute(
            'UPDATE orders SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows > 0) {
            await this.addStatusHistory(id, status, note);
        }

        return result.affectedRows > 0;
    }

    static async addStatusHistory(orderId, status, note = '') {
        await pool.execute(
            'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
            [orderId, status, note]
        );
    }

    static async getStatusHistory(orderId) {
        const [rows] = await pool.execute(
            'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at DESC',
            [orderId]
        );
        return rows;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async searchOrders(searchTerm, page = 1, limit = 10) {
        try {
            // نفس معالجة findAll
            let pageNum;
            let limitNum;
            
            if (page === undefined || page === null || page === '') {
                pageNum = 1;
            } else {
                pageNum = parseInt(String(page), 10);
                if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
            }
            
            if (limit === undefined || limit === null || limit === '') {
                limitNum = 10;
            } else {
                limitNum = parseInt(String(limit), 10);
                if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
                if (limitNum > 100) limitNum = 100;
            }
            
            const offset = (pageNum - 1) * limitNum;
            const limitInt = Number.isInteger(limitNum) ? limitNum : Math.floor(limitNum);
            const offsetInt = Number.isInteger(offset) ? offset : Math.floor(offset);
            
            const term = searchTerm ? `%${searchTerm}%` : '%';
            let searchId = 0;
            if (searchTerm && !isNaN(parseInt(String(searchTerm), 10))) {
                searchId = parseInt(String(searchTerm), 10);
            }

            const [rows] = await pool.query(
                `SELECT * FROM orders 
                 WHERE customer_name LIKE ? OR phone LIKE ? OR id = ?
                 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                [term, term, searchId, limitInt, offsetInt]
            );

            const [countRows] = await pool.query(
                `SELECT COUNT(*) as total FROM orders 
                 WHERE customer_name LIKE ? OR phone LIKE ? OR id = ?`,
                [term, term, searchId]
            );

            return {
                orders: rows,
                total: countRows[0].total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(countRows[0].total / limitNum)
            };
        } catch (error) {
            console.error('Order.searchOrders error:', error);
            throw error;
        }
    }
}

module.exports = Order;