import { type Request, type Response } from 'express';
import { MeetingService } from '../services/transcription.service.js';

export class MeetingController {
    static async transcribeAudio(req: Request, res: Response): Promise<void> {
        const file = req.file;
        const { title, date, duration, attendees } = req.body;

        if (!file) {
            res.status(400).json({
                success: false,
                error: 'No audio file provided.',
            });
            return;
        }

        let parsedAttendees: string[] = [];

        if (attendees) {
            try {
                const parsed =
                    typeof attendees === 'string'
                        ? JSON.parse(attendees)
                        : attendees;

                if (Array.isArray(parsed)) {
                    parsedAttendees = parsed.filter(
                        (attendee): attendee is string =>
                            typeof attendee === 'string'
                    );
                }
            } catch {
                if (typeof attendees === 'string') {
                    parsedAttendees = attendees
                        .split(',')
                        .map((attendee) => attendee.trim())
                        .filter(Boolean);
                }
            }
        }

        try {
            const result =
                await MeetingService.processTranscriptionPipeline({
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
        } catch (error: unknown) {
            console.error('Transcription Pipeline Error:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to process meeting transcription.',
            });
        }
    }

    static async getMeetings(
        _req: Request,
        res: Response
    ): Promise<void> {
        try {
            const meetings = await MeetingService.getAllMeetings();

            res.status(200).json({
                success: true,
                data: meetings,
            });
        } catch (error: unknown) {
            console.error('Get Meetings Error:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to fetch meetings.',
            });
        }
    }
}