import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /health
 * 
 * MANDATORY REQUIREMENT (Page 6 & Page 8 Debug Drill):
 * - Reports application uptime and whether MongoDB is currently reachable.
 * - If MongoDB is stopped, returns HTTP 503 with degraded status.
 */
router.get('/health', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  let dbPing = 'failed';
  if (isMongoConnected) {
    try {
      await mongoose.connection.db.admin().ping();
      dbPing = 'ok';
    } catch {
      dbPing = 'ping_failed';
    }
  }

  const isHealthy = isMongoConnected && dbPing === 'ok';

  const healthData = {
    status: isHealthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: isMongoConnected ? 'connected' : 'disconnected',
        ping: dbPing,
      },
      api: {
        status: 'running',
      },
    },
  };

  return res.status(isHealthy ? 200 : 503).json(healthData);
});

export default router;
