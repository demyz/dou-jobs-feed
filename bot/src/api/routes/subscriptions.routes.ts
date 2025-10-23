import { Router } from 'express';
import {
  getSubscriptions,
  saveSubscriptions,
} from '../controllers/subscriptions.controller.js';

const router = Router();

router.get('/', getSubscriptions);
router.post('/', saveSubscriptions);

export default router;


