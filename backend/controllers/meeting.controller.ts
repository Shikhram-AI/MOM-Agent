import { type Request, type Response } from 'express';
import { MeetingService } from '../services/transcription.service.js';

export class MeetingController {
    static async transcribeAudio(req: Request, res: Response): Promise<void> {
        const file = req.file;
        const { title, date, duration, attendees } = req.body;

        if (!file) {
            res.status(400).json({ success: false, error: 'No audio file provided.' });
            return;
        }

        // Safely parse attendees if it arrives as a JSON string from multipart formData
        let parsedAttendees: string[] = [];
        if (attendees) {
            try {
                parsedAttendees = typeof attendees === 'string' ? JSON.parse(attendees) : attendees;
            } catch (e) {
                // Fallback: If sent as a comma-separated string instead of JSON array
                parsedAttendees = typeof attendees === 'string'
                    ? attendees.split(',').map((e) => e.trim()).filter(Boolean)
                    : [];
            }
        }

        try {
            const result = await MeetingService.processTranscriptionPipeline({
                file,
                title,
                date,
                duration,
                attendees: parsedAttendees,
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Transcription Pipeline Error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error during transcription.',
            });
        }
    }

    static async getMeetings(_req: Request, res: Response): Promise<void> {
        try {
            const meetings = await MeetingService.getAllMeetings();
            res.status(200).json({ success: true, data: meetings });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}