import fs from 'fs';
import { supabase, groq } from '../config.js';

interface IngestMeetingParams {
    file: Express.Multer.File;
    title?: string;
    date?: string;
    duration?: string;
}

export class MeetingService {
    /**
     * 1. Uploads audio file to Supabase Storage
     * 2. Creates initial record (status: 'processing')
     * 3. Transcribes with Groq Whisper
     * 4. Updates record with transcript (status: 'completed')
     */
    static async processTranscriptionPipeline({
        file,
        title,
        date,
        duration,
    }: IngestMeetingParams) {
        const meetingId = crypto.randomUUID();
        const fileExtension = file.originalname.split('.').pop() || 'm4a';
        const storagePath = `recordings/${meetingId}.${fileExtension}`;

        // 1. Upload audio to Supabase Storage
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

        // 2. Insert initial meeting entry
        const { error: dbInitError } = await supabase
            .from('meetings')
            .insert({
                id: meetingId,
                title: title || 'Untitled Meeting',
                date: date || new Date().toLocaleDateString(),
                duration: duration || '00:00',
                audio_path: storagePath,
                status: 'processing',
            });

        if (dbInitError) {
            throw new Error(`Supabase DB Insert Error: ${dbInitError.message}`);
        }

        try {
            // 3. Request Transcription from Groq Whisper
            const audioReadStream = fs.createReadStream(file.path);
            const transcription = await groq.audio.transcriptions.create({
                file: audioReadStream,
                model: 'whisper-large-v3',
                response_format: 'json',
                temperature: 0.0,
            });

            // 4. Update the DB record with transcript & mark completed
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
            // Mark as failed if Groq or DB update fails
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

    /**
     * Fetch all meetings for Explore Screen
     */
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