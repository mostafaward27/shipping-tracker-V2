# Shipping Tracker System

A complete shipping tracking system with admin dashboard and public tracking interface.

## Features

- **Public Tracking**: Customers can track orders by order ID
- **Admin Dashboard**: Protected panel for order management
- **Order Management**: Create, read, update, delete orders
- **Status Updates**: Update order status with notes
- **Status History**: Complete history of all status changes
- **RTL Support**: Full Arabic language support
- **Responsive Design**: Works on all devices
- **API Documentation**: Swagger UI included

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL Database
- JWT Authentication
- Swagger for API documentation

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 (RTL version)
- Responsive Design

## Installation

### 1. Database Setup

```bash
# Create database
mysql -u root -p < database/schema.sql

# Or manually create database and tables