import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : 'http://localhost:5174',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Payload validation

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again later."
});
app.use('/api/', apiLimiter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: corsOptions.origin,
        methods: ["GET", "POST"]
    }
});

const GOOGLE_API_KEY = process.env.GEMINI_KEY;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('sync_config', (data) => {
        socket.broadcast.emit('sync_config', data);
    });

    socket.on('sync_action', (data) => {
        socket.broadcast.emit('sync_action', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Backend proxy and Socket.IO running on http://localhost:${PORT}`);
});