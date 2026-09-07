import { Router } from 'express';
import { locationController } from '../controllers/location.controller.js';

const router = Router();

// Locations CRUD and Sync
router.post('/locations', locationController.addLocation);
router.get('/locations', locationController.listLocations);
router.get('/locations/:id', locationController.getLocationById);
router.post('/locations/:id/sync', locationController.syncLocation);
router.delete('/locations/:id', locationController.deleteLocation);

// Global integrations health check
router.get('/integrations/status', locationController.getIntegrationsStatus);

export default router;
