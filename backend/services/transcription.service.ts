import fs from 'fs';
import { randomUUID } from 'crypto';
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
    const meetingId = randomUUID();
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'm4a';
    const storagePath = `recordings/${meetingId}.${fileExtension}`;

    let meetingCreated = false;

    try {
      // 1. Upload audio to Supabase Storage
      const fileBuffer = await fs.promises.readFile(file.path);

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
          date: date || new Date().toISOString(),
          duration: duration || '00:00',
          audio_path: storagePath,
          attendees,
          status: 'processing',
        });

      if (dbInitError) {
        throw new Error(`Supabase DB Insert Error: ${dbInitError.message}`);
      }

      meetingCreated = true;

      // 3. Prepare audio stream for Groq
      const audioFile = await toFile(
        fs.createReadStream(file.path),
        `meeting.${fileExtension}`,
        { type: file.mimetype || 'audio/m4a' }
      );

      // 4. Request transcription from Groq Whisper with Hinglish technical context
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'json',
        temperature: 0.0,
        prompt: 'Technical meeting discussion in English and Hindi (Hinglish). Topics include software architecture, APIs, frontend UI, backend deployment, database, integrations, task assignments, and project deadlines.',
      });

      // 5. Update DB record with transcript & mark completed
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

      // 6. Trigger Make / Agent Webhook for LLM processing via OpenRouter
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;

      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId: updatedRecord.id,
            title: updatedRecord.title,
            date: updatedRecord.date,
            duration: updatedRecord.duration,
            attendees: updatedRecord.attendees,
            transcript: updatedRecord.transcript,
          }),
        }).catch((error: unknown) => {
          console.error(
            '[Webhook Agent Error]:',
            error instanceof Error ? error.message : error
          );
        });
      }

      return updatedRecord;
    } catch (error: unknown) {
      if (meetingCreated) {
        await supabase
          .from('meetings')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', meetingId);
      }

      throw error;
    } finally {
      // 7. Cleanup local Multer temp file
      try {
        await fs.promises.unlink(file.path);
      } catch {
        // File already cleaned up or moved
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