import { Router } from 'express';
import { getLocations } from '../controllers/locations.controller.js';

const router = Router();

router.get('/', getLocations);

export default router;


