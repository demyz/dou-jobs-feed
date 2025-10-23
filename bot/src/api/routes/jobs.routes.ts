import { Router } from 'express';
import { getJobById } from '../controllers/jobs.controller.js';

const router = Router();

router.get('/:id', getJobById);

export default router;


