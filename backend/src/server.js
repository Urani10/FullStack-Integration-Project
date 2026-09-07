import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config/env.js';

async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB at:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Server] MongoDB connection established successfully.');

    const server = app.listen(config.port, () => {
      console.log(`[Server] Live Data Hub Backend listening on port ${config.port}`);
      console.log(`[Server] Health check available at http://localhost:${config.port}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP server and database connections...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('[Server] Connections cleanly closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (err) {
    console.error('[Server Fatal] Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
