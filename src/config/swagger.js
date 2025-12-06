const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Shipping Tracker API',
        version: '1.0.0',
        description: 'API for tracking shipping orders',
        contact: {
            name: 'Shipping Tracker Support',
            email: 'support@shippingtracker.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:3000/api',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    customer_name: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    origin: { type: 'string' },
                    destination: { type: 'string' },
                    current_status: { 
                        type: 'string',
                        enum: ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled']
                    },
                    metadata: { type: 'object' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' }
                }
            }
        }
    }
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;