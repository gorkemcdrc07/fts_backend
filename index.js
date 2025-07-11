const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// ✅ Sadece belirli domain'lere izin veriyoruz (özellikle production için)
const allowedOrigins = [
    'http://localhost:3000',
    'https://filo-web.vercel.app', // Vercel'deki frontend domainin
    'https://filo-web-gorkems-projects-f9c4a0e9.vercel.app' // otomatik Vercel URL'si (gerekliyse)
];

app.use(cors({
    origin: function (origin, callback) {
        // local veya tanımsız origin'e (örneğin Postman) de izin veriyoruz
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS engellendi: ' + origin));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.post('/api/seferler', async (req, res) => {
    try {
        const now = new Date();
        const trOffset = 3 * 60 * 60 * 1000;

        const end = new Date(now.getTime() + trOffset);
        end.setHours(23, 59, 59, 999);

        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + trOffset);
        start.setHours(0, 0, 0, 0);

        const body = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            userId: 1
        };

        console.log('[→] TR zamanlı istek:', body);

        const response = await fetch('https://api.odaklojistik.com.tr/api/tmsdespatches/getall', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_TOKEN}`
            },
            body: JSON.stringify(body)
        });

        const text = await response.text();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (err) {
            console.error('❌ JSON parse hatası:', err.message);
            res.status(500).json({ hata: 'Geçersiz JSON', detay: text });
        }

    } catch (err) {
        console.error('❌ Sunucu hatası:', err.message);
        res.status(500).json({ hata: 'Sunucu hatası', detay: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Proxy sunucusu çalışıyor: http://localhost:${PORT}`);
});
