import axios from 'axios';
import { API_BASE_URL, CLEAN_ENERGY_SOURCES } from '../utils/constants';

export const calculateOptimalWindow = async (hours: number) => {
    const now = new Date();

    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(now.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const from = now.toISOString();
    const to = endOfTomorrow.toISOString();

    const response = await axios.get(`${API_BASE_URL}/generation/${from}/${to}`);
    const data = response.data.data;

    const k = hours * 2;

    if (data.length < k) {
        throw new Error('Zbyt mało danych z API, aby wyznaczyć okno ładowania.');
    }

    let currentCleanSum = 0;
    let maxCleanSum = -1;
    let bestStartIndex = -1;
    let validIntervalCount = 0;

    const getCleanEnergyForInterval = (interval: any) => {
        return interval.generationmix
            .filter((source: any) => CLEAN_ENERGY_SOURCES.includes(source.fuel))
            .reduce((sum: number, source: any) => sum + source.perc, 0);
    };

    for (let i = 0; i < data.length; i++) {
        const cleanEnergy = getCleanEnergyForInterval(data[i]);

        if (i > 0 && data[i].from !== data[i - 1].to) {
            currentCleanSum = cleanEnergy;
            validIntervalCount = 1;
        } else {
            currentCleanSum += cleanEnergy;
            validIntervalCount += 1;
        }

        if (validIntervalCount > k) {
            const oldestCleanEnergy = getCleanEnergyForInterval(data[i - k]);
            currentCleanSum -= oldestCleanEnergy;
            validIntervalCount -= 1;
        }

        if (validIntervalCount === k) {
            if (currentCleanSum > maxCleanSum) {
                maxCleanSum = currentCleanSum;
                bestStartIndex = i - k + 1;
            }
        }
    }

    if (bestStartIndex === -1) {
        throw new Error('Nie udało się znaleźć ciągłego okna o podanej długości.');
    }

    const bestStartInterval = data[bestStartIndex];
    const bestEndInterval = data[bestStartIndex + k - 1];
    const averageCleanEnergy = maxCleanSum / k;

    return {
        startTime: bestStartInterval.from,
        endTime: bestEndInterval.to,
        averageCleanEnergyPercent: Number(averageCleanEnergy.toFixed(2))
    };
};