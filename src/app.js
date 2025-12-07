const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const rateLimit = require('express-rate-limit'); // نضيفه هنا

// Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const trackRoutes = require('./routes/trackRoutes');

const app = express();

// 1️⃣ Trust proxy
app.set('trust proxy', 1);

// 2️⃣ Rate limiter خاص بالـ Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // أقصى 100 طلب لكل IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authLimiter, authRoutes); // هنا بنطبق الـ limiter
app.use('/api/orders', orderRoutes);
app.use('/api/track', trackRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
