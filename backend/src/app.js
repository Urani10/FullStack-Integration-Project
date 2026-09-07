import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import locationRoutes from './routes/location.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}));
app.use(express.json());

// Request logging (omit noisy health checks in development)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Routes
app.use('/', healthRoutes);
app.use('/api', locationRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.url} does not exist.` });
});

// Centralized Error Handler
app.use(errorHandler);
