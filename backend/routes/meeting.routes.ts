import { Router } from 'express';
import multer from 'multer';
import { MeetingController } from '../controllers/meeting.controller.js';

const router = Router();

// Multer upload config
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max for Groq Whisper
    fileFilter: (_req, file, cb) => {
        // Accept audio formats (.m4a, .mp3, .wav, .aac, .ogg, .flac, webm)
        if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(m4a|mp3|wav|aac|ogg|flac|webm)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed.'));
        }
    },
});

// Endpoints
router.post('/transcribe', upload.single('audio'), MeetingController.transcribeAudio);
router.get('/', MeetingController.getMeetings);

export default router;