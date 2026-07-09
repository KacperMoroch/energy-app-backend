import { Router } from 'express';
import { getEnergyMix, getOptimalChargingWindow } from '../controllers/energyController';

const router = Router();

router.get('/energy-mix', getEnergyMix);
router.get('/optimal-window', getOptimalChargingWindow);

export default router;