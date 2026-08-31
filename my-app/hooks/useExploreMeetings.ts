import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from './api';

export type MoMStatus = 'completed' | 'processing' | 'failed';

export interface MeetingRecord {
    id: string;
    title: string;
    date: string;
    duration: string;
    status: MoMStatus;
    attendees?: string[];
    attendeesCount: number;
    transcript?: string;
    created_at: string;
}

export const useExploreMeetings = () => {
    const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isInitialMount = useRef<boolean>(true);

    // Track polling state internally to prevent 4k+ requests
    const pollCountRef = useRef<number>(0);
    const processingIdsRef = useRef<string>('');

    const fetchMeetings = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
        if (mode === 'initial') setIsLoading(true);
        else if (mode === 'refresh') setIsRefreshing(true);

        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/meetings`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch meetings.');
            }

            const mappedData: MeetingRecord[] = (json.data || []).map((item: any) => {
                let attendeesList: string[] = [];
                if (Array.isArray(item.attendees)) {
                    attendeesList = item.attendees;
                } else if (typeof item.attendees === 'string') {
                    try {
                        attendeesList = JSON.parse(item.attendees);
                    } catch {
                        attendeesList = [];
                    }
                }

                return {
                    id: item.id,
                    title: item.title || 'Untitled Meeting',
                    date: item.date,
                    duration: item.duration || '00:00',
                    status: (item.status as MoMStatus) || 'processing',
                    attendees: attendeesList,
                    attendeesCount: attendeesList.length,
                    transcript: item.transcript,
                    created_at: item.created_at,
                };
            });

            setMeetings(mappedData);
        } catch (err: any) {
            console.error('Error fetching meetings:', err);
            setError(err.message || 'Unable to load recordings.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            isInitialMount.current = false;
        }
    }, []);

    // 1. Initial Load
    useEffect(() => {
        fetchMeetings(isInitialMount.current ? 'initial' : 'silent');
    }, [fetchMeetings]);

    // 2. Controlled Polling Logic (30s and 60s checks only)
    useEffect(() => {
        // Generate a string signature of currently processing IDs
        const currentProcessingIds = meetings
            .filter((m) => m.status === 'processing')
            .map((m) => m.id)
            .sort()
            .join(',');

        // If no meetings are processing, reset trackers and do nothing
        if (!currentProcessingIds) {
            pollCountRef.current = 0;
            processingIdsRef.current = '';
            return;
        }

        // If a NEW meeting was added to the processing list, reset the timer count
        if (currentProcessingIds !== processingIdsRef.current) {
            pollCountRef.current = 0;
            processingIdsRef.current = currentProcessingIds;
        }

        // Schedule exactly 2 fetches: one at 30s, one at 60s
        if (pollCountRef.current < 2) {
            const timer = setTimeout(() => {
                pollCountRef.current += 1;
                fetchMeetings('silent');
            }, 30000); // 30-second delay

            // Cleanup timeout if component unmounts or state changes
            return () => clearTimeout(timer);
        }
    }, [meetings, fetchMeetings]);

    return {
        meetings,
        isLoading,
        isRefreshing,
        error,
        refetch: () => fetchMeetings('silent'),
        onRefresh: () => fetchMeetings('refresh'),
    };
};