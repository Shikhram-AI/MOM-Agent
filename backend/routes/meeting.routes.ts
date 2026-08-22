import { Router } from 'express';
import multer from 'multer';

import { MeetingController } from '../controllers/meeting.controller.js';

const router = Router();

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const isAudioMimeType = file.mimetype.startsWith('audio/');
        const isAudioExtension =
            /\.(m4a|mp3|wav|aac|ogg|flac|webm)$/i.test(
                file.originalname
            );

        if (isAudioMimeType || isAudioExtension) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed.'));
        }
    },
});

router.post(
    '/transcribe',
    upload.single('audio'),
    MeetingController.transcribeAudio
);

router.get('/', MeetingController.getMeetings);

export default router;