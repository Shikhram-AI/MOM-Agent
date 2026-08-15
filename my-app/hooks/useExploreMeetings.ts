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
    const [isLoading, setIsLoading] = useState<boolean>(true); // Only true on first load
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isInitialMount = useRef<boolean>(true);

    const fetchMeetings = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
        if (mode === 'initial') {
            setIsLoading(true);
        } else if (mode === 'refresh') {
            setIsRefreshing(true);
        }
        // If mode is 'silent', we don't flip loading flags, preventing screen flashes

        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/meetings`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch meetings.');
            }

            // Map database format to frontend model
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

    // Initial load
    useEffect(() => {
        fetchMeetings(isInitialMount.current ? 'initial' : 'silent');
    }, [fetchMeetings]);

    return {
        meetings,
        isLoading,
        isRefreshing,
        error,
        refetch: () => fetchMeetings('silent'), // Silent update on screen focus
        onRefresh: () => fetchMeetings('refresh'), // Spinner only on pull-to-refresh
    };
};