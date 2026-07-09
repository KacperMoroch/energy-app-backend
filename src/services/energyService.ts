import axios from 'axios';
import { API_BASE_URL, CLEAN_ENERGY_SOURCES } from '../utils/constants';

export const getEnergyMixForThreeDays = async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const inThreeDays = new Date(today);
    inThreeDays.setUTCDate(today.getUTCDate() + 3);

    const from = today.toISOString();
    const to = inThreeDays.toISOString();

    const response = await axios.get(`${API_BASE_URL}/generation/${from}/${to}`);
    const data = response.data.data;

    const groupedByDay: Record<string, any> = {};

    data.forEach((interval: any) => {
        const date = interval.from.split('T')[0];

        if (!groupedByDay[date]) {
            groupedByDay[date] = {
                date,
                totalIntervals: 0,
                generationmix: {},
                cleanEnergyPercent: 0
            };
        }

        interval.generationmix.forEach((source: any) => {
            if (!groupedByDay[date].generationmix[source.fuel]) {
                groupedByDay[date].generationmix[source.fuel] = 0;
            }
            groupedByDay[date].generationmix[source.fuel] += source.perc;
        });

        groupedByDay[date].totalIntervals += 1;
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

    return result.slice(0, 3);
};