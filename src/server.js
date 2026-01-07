const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Rules Configuration Engine API',
    version: '1.0.0',
    status: 'operational',
    description: 'Backend API for managing business rules with approval workflow, versioning, and mapping',
    endpoints: {
      health: '/health',
      rules: '/api/rules',
      mappings: '/api/mappings',
      execution: '/api/execute',
      approvals: '/api/approvals'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'RCE Backend'
  });
});

// Placeholder API routes - to be implemented later
app.get('/api/rules', (req, res) => {
  res.json({ message: 'Rules API endpoint - To be implemented' });
});

app.get('/api/mappings', (req, res) => {
  res.json({ message: 'Mappings API endpoint - To be implemented' });
});

app.post('/api/execute', (req, res) => {
  res.json({ message: 'Rule execution endpoint - To be implemented' });
});

app.get('/api/approvals', (req, res) => {
  res.json({ message: 'Approvals API endpoint - To be implemented' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`Rules Configuration Engine API`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===========================================`);
});

module.exports = app;
