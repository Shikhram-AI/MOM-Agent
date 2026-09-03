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

        prompt: `
This is a technical software/product development meeting spoken in English, Hindi, and Hinglish.

Transcribe the meeting faithfully and preserve the original meaning.

IMPORTANT TRANSCRIPTION RULES:
- Preserve English technical terms exactly when they are spoken.
- Do NOT translate technical terms into Hindi.
- Do NOT replace technical words with phonetically similar Hindi words.
- Pay special attention to software development terminology, product names, platform names, programming languages, frameworks, libraries, tools, APIs, deployment platforms, databases, AI/LLM terminology, UI/UX terminology, and meeting/task terminology.
- Preserve names of people, products, companies, projects, websites, and platforms as accurately as possible.
- Preserve dates, times, percentages, deadlines, and quantities exactly.
- Preserve words such as "today", "tomorrow", "Tuesday", "Wednesday", "EOD", "deadline", "meeting", "task", "action item", "owner", "integration", and "complete".
- Do not invent missing words or sentences.
- Do not summarize or interpret the meeting.
- Do not turn unclear audio into confident text.
- If a phrase is unclear, transcribe the closest audible wording rather than inventing a plausible sentence.
- Remove obvious non-speech artifacts and repeated meaningless fragments when they are clearly transcription noise.
- Keep the transcript in natural Hinglish when the speaker switches between Hindi and English.

IMPORTANT TECHNICAL VOCABULARY:
Chatbot, AI agent, MIRA, OpenRouter, Groq, Whisper, LLM, RAG, knowledge base,
Python, JavaScript, TypeScript, React, React Native, Node.js, Express,
Streamlit, Llama, FastAPI, Expo, Expo Router, n8n, Make,
Supabase, MongoDB, MySQL, PostgreSQL,
API, REST API, backend, frontend, full stack,
UI, UX, component, responsive, deployment, integration,
Render, Vercel, AWS, S3, GitHub, Git,
OTP, authentication, login, signup,
website, dashboard, portal, mobile app,
Zoom, Google Meet, WhatsApp,
Jira, task, issue, sprint,
course, project, internship, demo,
action item, deadline, EOD, owner, review.

When technical terms appear inside Hindi sentences, keep the technical terms in their English form.

Example:
"Python mein backend banana hai"
should remain:
"Python mein backend banana hai"

Do not convert it into:
"पाइथन में बैकएंड बनाना है"

Similarly preserve terms such as:
"Streamlit", "Llama", "knowledge base", "website integration", "API", "frontend", "backend", "deployment", and "action item".

The output must be ONLY the transcript.
`,
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