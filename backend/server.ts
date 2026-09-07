import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { MulterError } from 'multer';
import meetingRoutes from './routes/meeting.routes.js';
import authRoutes from './routes/auth.routes.js';
import { CONFIG } from './config.js';

const app = express();

// Enable CORS for mobile & web clients
app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/meetings', meetingRoutes);
app.use('/api/auth', authRoutes);

// 404 Catch-All Route
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found.',
    });
});

// Global Error Handling Middleware
app.use(
    (
        error: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        console.error('[Unhandled Server Error]:', error);

        if (error instanceof MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    error: 'File too large. Maximum allowed size is 25 MB.',
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: `Upload error: ${error.message}`,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error.',
        });
    }
);

const PORT = CONFIG.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pipeline API running on port ${PORT} [${CONFIG.NODE_ENV}]`);
});

// Graceful Shutdown
const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Closing server gracefully...`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });

    // Force close if graceful exit takes too long
    setTimeout(() => {
        console.error('Forced shutdown due to timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));