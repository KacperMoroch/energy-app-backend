import { Router } from 'express';
import { getEnergyMix } from '../controllers/energyController';

const router = Router();

router.get('/energy-mix', getEnergyMix);

export default router;