import fs from 'fs';
import { supabase, groq } from '../config.js';
import { toFile } from 'groq-sdk';

interface IngestMeetingParams {
    file: Express.Multer.File;
    title?: string;
    date?: string;
    duration?: string;
    attendees?: string[];
}

export class MeetingService {
    static async processTranscriptionPipeline({
        file,
        title,
        date,
        duration,
        attendees = [],
    }: IngestMeetingParams) {
        const meetingId = crypto.randomUUID();

        // 1. Resolve proper extension (.m4a, .mp3, etc.)
        const fileExtension = file.originalname.includes('.')
            ? file.originalname.split('.').pop()
            : 'm4a';
        const storagePath = `recordings/${meetingId}.${fileExtension}`;

        // 2. Upload audio buffer to Supabase Storage
        const fileBuffer = fs.readFileSync(file.path);
        const { error: storageError } = await supabase.storage
            .from('meeting-recordings')
            .upload(storagePath, fileBuffer, {
                contentType: file.mimetype || 'audio/m4a',
                upsert: true,
            });

        if (storageError) {
            throw new Error(`Supabase Storage Error: ${storageError.message}`);
        }

        // 3. Insert initial meeting entry
        const { error: dbInitError } = await supabase
            .from('meetings')
            .insert({
                id: meetingId,
                title: title || 'Untitled Meeting',
                date: date || new Date().toLocaleDateString(),
                duration: duration || '00:00',
                audio_path: storagePath,
                attendees: attendees,
                status: 'processing',
            });

        if (dbInitError) {
            throw new Error(`Supabase DB Insert Error: ${dbInitError.message}`);
        }

        try {
            // 4. Wrap the stream using Groq's `toFile` helper with an explicit filename
            const audioFile = await toFile(
                fs.createReadStream(file.path),
                `meeting.${fileExtension}`,
                { type: file.mimetype || 'audio/m4a' }
            );

            // 5. Request Transcription from Groq Whisper
            const transcription = await groq.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3',
                response_format: 'json',
                temperature: 0.0,
            });

            // 6. Update DB record with transcript & mark completed
            const { data: updatedRecord, error: dbUpdateError } = await supabase
                .from('meetings')
                .update({
                    transcript: transcription.text,
                    status: 'completed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', meetingId)
                .select()
                .single();

            if (dbUpdateError) {
                throw new Error(`Supabase DB Update Error: ${dbUpdateError.message}`);
            }

            return updatedRecord;
        } catch (error: any) {
            await supabase
                .from('meetings')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', meetingId);

            throw error;
        } finally {
            // Clean up local temp disk file
            if (fs.existsSync(file.path)) {
                fs.unlink(file.path, () => { });
            }
        }
    }

    static async getAllMeetings() {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Supabase Fetch Error: ${error.message}`);
        }

        return data;
    }
}