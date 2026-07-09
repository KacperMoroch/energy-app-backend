import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend działa poprawnie!');
});

app.listen(PORT, () => {
    console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});