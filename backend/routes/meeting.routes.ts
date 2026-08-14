import { Router } from 'express';
import multer from 'multer';
import { MeetingController } from '../controllers/meeting.controller.js';

const router = Router();

// Multer upload config
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max for Groq Whisper
});

router.post('/transcribe', upload.single('audio'), MeetingController.transcribeAudio);
router.get('/', MeetingController.getMeetings);

export default router;