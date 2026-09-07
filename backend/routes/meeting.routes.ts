import { Router, type Request, type Response, type NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import fs from 'fs';
import path from 'path';

import { MeetingController } from '../controllers/meeting.controller.js';

const router = Router();

// Ensure upload directory exists before handling requests
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 250 MB ceiling (AssemblyAI supports up to 5 GB; 250 MB covers 2-4+ hours of recording safely)
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
    fileFilter: (_req, file, cb) => {
        const isAudioMimeType =
            file.mimetype.startsWith('audio/') ||
            file.mimetype === 'video/mp4' || // Common container MIME for AAC/.m4a on mobile
            file.mimetype === 'application/octet-stream';

        const isAudioExtension = /\.(m4a|mp3|wav|aac|ogg|flac|webm|mp4)$/i.test(
            file.originalname
        );

        if (isAudioMimeType || isAudioExtension) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files (.m4a, .mp3, .wav, .aac, .webm) are allowed.'));
        }
    },
});

// Middleware to gracefully handle Multer limits & filter rejections
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    upload.single('audio')(req, res, (err: unknown) => {
        if (err instanceof MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    success: false,
                    error: 'Audio file exceeds the allowed upload limit (max 250 MB).',
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: `File upload error: ${err.message}`,
            });
            return;
        } else if (err instanceof Error) {
            res.status(400).json({
                success: false,
                error: err.message,
            });
            return;
        }
        next();
    });
};

router.post('/transcribe', handleUpload, MeetingController.transcribeAudio);
router.get('/', MeetingController.getMeetings);

export default router;