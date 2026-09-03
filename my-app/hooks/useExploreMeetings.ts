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

    const isMountedRef = useRef<boolean>(true);
    const isInitialMount = useRef<boolean>(true);

    // Track polling state internally to prevent runaway loops
    const pollCountRef = useRef<number>(0);
    const processingIdsRef = useRef<string>('');

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchMeetings = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
        if (mode === 'initial') setIsLoading(true);
        else if (mode === 'refresh') setIsRefreshing(true);

        if (isMountedRef.current) {
            setError(null);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s network timeout

        try {
            const response = await fetch(`${API_BASE_URL}/meetings`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch meetings.');
            }

            const mappedData: MeetingRecord[] = (json.data || []).map((item: any, index: number) => {
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
                    id: item.id ? String(item.id) : `meeting-${index}`,
                    title: item.title || 'Untitled Meeting',
                    date: item.date || 'Recent',
                    duration: item.duration || '00:00',
                    status: (item.status as MoMStatus) || 'processing',
                    attendees: attendeesList,
                    attendeesCount: attendeesList.length,
                    transcript: item.transcript || '',
                    created_at: item.created_at || new Date().toISOString(),
                };
            });

            if (isMountedRef.current) {
                setMeetings(mappedData);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.warn('Meetings fetch timed out');
            } else {
                console.error('Error fetching meetings:', err);
            }
            if (isMountedRef.current) {
                setError(err.message || 'Unable to load recordings.');
            }
        } finally {
            clearTimeout(timeoutId);
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
                isInitialMount.current = false;
            }
        }
    }, []);

    // 1. Initial Load
    useEffect(() => {
        fetchMeetings(isInitialMount.current ? 'initial' : 'silent');
    }, [fetchMeetings]);

    // 2. Controlled Polling Logic (30s and 60s checks only)
    useEffect(() => {
        const currentProcessingIds = meetings
            .filter((m) => m.status === 'processing')
            .map((m) => m.id)
            .sort()
            .join(',');

        if (!currentProcessingIds) {
            pollCountRef.current = 0;
            processingIdsRef.current = '';
            return;
        }

        if (currentProcessingIds !== processingIdsRef.current) {
            pollCountRef.current = 0;
            processingIdsRef.current = currentProcessingIds;
        }

        if (pollCountRef.current < 2) {
            const timer = setTimeout(() => {
                pollCountRef.current += 1;
                fetchMeetings('silent');
            }, 30000);

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