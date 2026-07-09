import axios from 'axios';
import { API_BASE_URL, CLEAN_ENERGY_SOURCES } from '../utils/constants';

export const getEnergyMixForThreeDays = async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const getLocalDateStr = (date: Date): string => {
        const offset = date.getTimezoneOffset() * 60000;
        const isoString = new Date(date.getTime() - offset).toISOString();
        return isoString.split('T')[0] as string;
    };

    const validDates = [
        getLocalDateStr(today),
        getLocalDateStr(tomorrow),
        getLocalDateStr(dayAfter)
    ];

    const fetchStart = new Date(today);
    fetchStart.setDate(today.getDate() - 1);
    const fetchEnd = new Date(today);
    fetchEnd.setDate(today.getDate() + 3);

    const response = await axios.get(`${API_BASE_URL}/generation/${fetchStart.toISOString()}/${fetchEnd.toISOString()}`);
    const data = response.data.data;

    const groupedByDay: Record<string, any> = {};

    data.forEach((interval: any) => {
        const intervalDate = new Date(interval.from);
        const dateStr = getLocalDateStr(intervalDate);

        if (!validDates.includes(dateStr)) return;

        if (!groupedByDay[dateStr]) {
            groupedByDay[dateStr] = {
                date: dateStr,
                totalIntervals: 0,
                generationmix: {},
                cleanEnergyPercent: 0
            };
        }

        interval.generationmix.forEach((source: any) => {
            const fuel = source.fuel as string;

            if (!groupedByDay[dateStr].generationmix[fuel]) {
                groupedByDay[dateStr].generationmix[fuel] = 0;
            }
            groupedByDay[dateStr].generationmix[fuel] += source.perc;
        });

        groupedByDay[dateStr].totalIntervals += 1;
    });

    const result = Object.values(groupedByDay).map((day: any) => {
        let dailyCleanEnergy = 0;
        const averagedMix = Object.keys(day.generationmix).map(fuel => {
            const avgPerc = day.generationmix[fuel] / day.totalIntervals;
            if (CLEAN_ENERGY_SOURCES.includes(fuel)) {
                dailyCleanEnergy += avgPerc;
            }
            return { fuel, perc: Number(avgPerc.toFixed(2)) };
        });

        return {
            date: day.date,
            generationmix: averagedMix,
            cleanEnergyPercent: Number(dailyCleanEnergy.toFixed(2))
        };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
};