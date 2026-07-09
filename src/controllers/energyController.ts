import { Request, Response } from 'express';
import { getEnergyMixForThreeDays } from '../services/energyService';
import { calculateOptimalWindow } from '../services/chargingService';

export const getEnergyMix = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getEnergyMixForThreeDays();
        res.status(200).json(data);
    } catch (error) {
        console.error('Błąd pobierania miksu energetycznego:', error);
        res.status(500).json({ error: 'Nie udało się pobrać danych o miksie energetycznym' });
    }
};

export const getOptimalChargingWindow = async (req: Request, res: Response): Promise<void> => {
    try {
        const hours = Number(req.query.hours);

        if (!hours || isNaN(hours) || hours < 1 || hours > 6) {
            res.status(400).json({ error: 'Parametr hours musi być liczbą całkowitą od 1 do 6.' });
            return;
        }

        const data = await calculateOptimalWindow(hours);
        res.status(200).json(data);
    } catch (error) {
        console.error('Błąd wyznaczania optymalnego okna:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas obliczeń optymalnego okna.' });
    }
};