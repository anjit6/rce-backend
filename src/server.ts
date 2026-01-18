import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import pool from './config/database';
import apiRoutes from './routes';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
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
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const result = await pool.query('SELECT NOW()');
    if (result.rows[0]) {
      dbStatus = 'connected';
    }
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'RCE Backend',
    database: dbStatus
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
interface CustomError extends Error {
  status?: number;
}

app.use((err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
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
app.use((_req: Request, res: Response) => {
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

export default app;
