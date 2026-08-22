import express from 'express';
import cors from 'cors';
import meetingRoutes from './routes/meeting.routes.js';

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'OPTIONS'],
    })
);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use('/api/meetings', meetingRoutes);

// Global error handler
app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error('Unhandled Server Error:', error);

        if (error instanceof Error && error.message === 'Only audio files are allowed.') {
            res.status(400).json({
                success: false,
                error: error.message,
            });
            return;
        }

        if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'LIMIT_FILE_SIZE'
        ) {
            res.status(400).json({
                success: false,
                error: 'File too large. Maximum allowed size is 25 MB.',
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error.',
        });
    }
);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pipeline API running on port ${PORT}`);
});