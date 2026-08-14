import express from 'express';
import cors from 'cors';
import meetingRoutes from './routes/meeting.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/meetings', meetingRoutes);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Pipeline API running on http://localhost:${PORT}`);
});