import { type Request, type Response } from 'express';
import fs from 'fs';
import { MeetingService } from '../services/transcription.service.js';

export class MeetingController {
    static async transcribeAudio(req: Request, res: Response): Promise<void> {
        const file = req.file;
        const { title, date, duration, attendees, created_by } = req.body;

        // 1. Validate Audio File
        if (!file) {
            res.status(400).json({
                success: false,
                error: 'No audio file provided.',
            });
            return;
        }

        // 2. Normalize and Validate Attendees Array
        let parsedAttendees: string[] = [];

        if (attendees) {
            try {
                const parsed = typeof attendees === 'string' ? JSON.parse(attendees) : attendees;

                if (Array.isArray(parsed)) {
                    parsedAttendees = parsed
                        .map((email) => (typeof email === 'string' ? email.replace(/^=+/, '').trim().toLowerCase() : ''))
                        .filter((email) => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                }
            } catch {
                if (typeof attendees === 'string') {
                    parsedAttendees = attendees
                        .split(',')
                        .map((email) => email.replace(/^=+/, '').trim().toLowerCase())
                        .filter((email) => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                }
            }
        }

        // 3. Process Pipeline
        try {
            const result = await MeetingService.processTranscriptionPipeline({
                file,
                title:
                    typeof title === 'string' && title.trim().length > 0
                        ? title.trim()
                        : 'Untitled Meeting',

                date:
                    typeof date === 'string' && date.trim().length > 0
                        ? date.trim()
                        : new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }),

                duration:
                    typeof duration === 'string' && duration.trim().length > 0
                        ? duration.trim()
                        : '00:00',

                attendees: parsedAttendees,

                ...(typeof created_by === 'string' && created_by.trim().length > 0
                    ? { created_by: created_by.trim().toLowerCase() }
                    : {}),
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: unknown) {
            // Ensure temp file deletion if pipeline threw before reaching service finally block
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlink(file.path, () => { });
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown server error.';
            console.error('[MeetingController.transcribeAudio Error]:', errorMessage);

            res.status(500).json({
                success: false,
                error: 'Failed to process meeting transcription.',
                message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            });
        }
    }

    static async getMeetings(req: Request, res: Response): Promise<void> {
        try {
            const rawEmail = (req.query.email as string) || (req.query.userEmail as string);
            const userEmail = typeof rawEmail === 'string' && rawEmail.trim() ? rawEmail.trim().toLowerCase() : undefined;

            const meetings = await MeetingService.getAllMeetings(userEmail);

            res.status(200).json({
                success: true,
                data: meetings,
            });
        } catch (error: any) {
            console.error('[MeetingController.getMeetings Error]:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch meetings',
            });
        }
    }
}