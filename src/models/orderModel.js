const pool = require('../config/database');

class Order {
    // إنشاء طلب جديد
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

        // إضافة الحالة الأولى للتاريخ
        if (result.insertId) {
            await this.addStatusHistory(result.insertId, current_status, 'Order created');
        }

        return result.insertId;
    }

    // جلب طلب حسب الـ ID
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // جلب جميع الطلبات مع Pagination
    static async findAll(page = 1, limit = 10) {
        // تحويل القيم إلى أعداد صحيحة
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;

        // التأكد من أن القيم صحيحة
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100; // تحديد حد أقصى للحماية

        const offset = (page - 1) * limit;

        // استخدام parseInt للتأكد من إرسال أعداد صحيحة
        const limitInt = parseInt(limit, 10);
        const offsetInt = parseInt(offset, 10);

        const [rows] = await pool.execute(
            'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limitInt, offsetInt]
        );

        const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM orders');
        return {
            orders: rows,
            total: countRows[0].total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }

    // تحديث بيانات طلب
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

    // تحديث حالة الطلب
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

    // إضافة سجل حالة للطلب
    static async addStatusHistory(orderId, status, note = '') {
        await pool.execute(
            'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
            [orderId, status, note]
        );
    }

    // جلب تاريخ الحالات للطلب
    static async getStatusHistory(orderId) {
        const [rows] = await pool.execute(
            'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at DESC',
            [orderId]
        );
        return rows;
    }

    // حذف طلب
    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // البحث عن الطلبات
    static async searchOrders(searchTerm, page = 1, limit = 10) {
        // تحويل القيم إلى أعداد صحيحة
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;

        // التأكد من أن القيم صحيحة
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100;

        const offset = (page - 1) * limit;

        // استخدام parseInt للتأكد من إرسال أعداد صحيحة
        const limitInt = parseInt(limit, 10);
        const offsetInt = parseInt(offset, 10);

        // تحضير شروط البحث
        const term = searchTerm ? `%${searchTerm}%` : '%';
        
        // إذا كان searchTerm رقم صالح، استخدمه للبحث بالـ ID
        let searchId = 0;
        if (searchTerm && !isNaN(parseInt(searchTerm, 10))) {
            searchId = parseInt(searchTerm, 10);
        }

        const [rows] = await pool.execute(
            `SELECT * FROM orders 
             WHERE customer_name LIKE ? OR phone LIKE ? OR id = ?
             ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [term, term, searchId, limitInt, offsetInt]
        );

        const [countRows] = await pool.execute(
            `SELECT COUNT(*) as total FROM orders 
             WHERE customer_name LIKE ? OR phone LIKE ? OR id = ?`,
            [term, term, searchId]
        );

        return {
            orders: rows,
            total: countRows[0].total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }
}

module.exports = Order;