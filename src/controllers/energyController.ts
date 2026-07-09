import { Request, Response } from 'express';
import { getEnergyMixForThreeDays } from '../services/energyService';

export const getEnergyMix = async (req: Request, res: Response) => {
    try {
        const data = await getEnergyMixForThreeDays();
        res.status(200).json(data);
    } catch (error) {
        console.error('Błąd pobierania miksu energetycznego:', error);
        res.status(500).json({ error: 'Nie udało się pobrać danych o miksie energetycznym' });
    }
};