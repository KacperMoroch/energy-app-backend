import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import app from '../src/index';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Energy API - Endpoints', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/optimal-window', () => {
        it('powinien zwrócić błąd 400 dla czasu ładowania powyżej 6h', async () => {
            const res = await request(app).get('/api/optimal-window?hours=7');
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('powinien zwrócić błąd 400 dla czasu ładowania poniżej 1h', async () => {
            const res = await request(app).get('/api/optimal-window?hours=0');
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('powinien zwrócić błąd 400, jeśli nie podano parametru hours', async () => {
            const res = await request(app).get('/api/optimal-window');
            expect(res.status).toBe(400);
        });

        it('powinien zwrócić status 200 i wyliczyć okno ze sztucznych danych API', async () => {
            const mockApiResponse = {
                data: {
                    data: [
                        {
                            from: "2026-07-10T12:00Z",
                            to: "2026-07-10T12:30Z",
                            generationmix: [
                                { fuel: "wind", perc: 50 },
                                { fuel: "solar", perc: 20 },
                                { fuel: "gas", perc: 30 }
                            ]
                        },
                        {
                            from: "2026-07-10T12:30Z",
                            to: "2026-07-10T13:00Z",
                            generationmix: [
                                { fuel: "wind", perc: 60 },
                                { fuel: "solar", perc: 30 },
                                { fuel: "gas", perc: 10 }
                            ]
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

            const res = await request(app).get('/api/optimal-window?hours=1');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('startTime', '2026-07-10T12:00Z');
            expect(res.body).toHaveProperty('endTime', '2026-07-10T13:00Z');
            expect(res.body).toHaveProperty('averageCleanEnergyPercent');

            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/energy-mix', () => {
        it('powinien zwrócić status 200 oraz dokładnie 3 dni w tablicy', async () => {
            const today = new Date();
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);

            const mockApiResponse = {
                data: {
                    data: [
                        { from: today.toISOString(), generationmix: [{ fuel: "wind", perc: 100 }] },
                        { from: tomorrow.toISOString(), generationmix: [{ fuel: "wind", perc: 100 }] },
                        { from: dayAfter.toISOString(), generationmix: [{ fuel: "wind", perc: 100 }] },
                        { from: "2030-01-01T10:00Z", generationmix: [{ fuel: "wind", perc: 100 }] }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

            const res = await request(app).get('/api/energy-mix');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);

            expect(res.body).toHaveLength(3);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('powinien zwrócić status 500 (błąd serwera), gdy zewnętrzne API jest niedostępne', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

            const res = await request(app).get('/api/energy-mix');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });
    });
});