import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_EMAIL_KEY = '@mira_user_email';
const USER_VERIFIED_KEY = '@mira_user_verified';
const ATTENDEES_KEY = '@mira_saved_attendees';

// Simple standard email regex validator
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
};

export const storage = {
    // --- User Verification ---
    async getUserEmail(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(USER_EMAIL_KEY);
        } catch (error) {
            console.error('Error reading user email from storage:', error);
            return null;
        }
    },

    async isUserVerified(): Promise<boolean> {
        try {
            const status = await AsyncStorage.getItem(USER_VERIFIED_KEY);
            return status === 'true';
        } catch (error) {
            console.error('Error reading verification status:', error);
            return false;
        }
    },

    async setUserVerified(email: string): Promise<void> {
        try {
            const cleanEmail = email.trim().toLowerCase();
            await AsyncStorage.multiSet([
                [USER_EMAIL_KEY, cleanEmail],
                [USER_VERIFIED_KEY, 'true'],
            ]);
        } catch (error) {
            console.error('Error saving user verification state:', error);
        }
    },

    async clearUser(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([USER_EMAIL_KEY, USER_VERIFIED_KEY]);
        } catch (error) {
            console.error('Error clearing user verification state:', error);
        }
    },

    // --- Attendees Directory ---
    async getSavedAttendees(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(ATTENDEES_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (error) {
            console.error('Error reading saved attendees:', error);
            return [];
        }
    },

    async addAttendees(emails: string[]): Promise<string[]> {
        try {
            const current = await this.getSavedAttendees();
            const set = new Set(current.map((e) => e.toLowerCase()));

            emails.forEach((email) => {
                const clean = email.trim().toLowerCase();
                if (isValidEmail(clean)) {
                    set.add(clean);
                }
            });

            const updated = Array.from(set);
            await AsyncStorage.setItem(ATTENDEES_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error adding attendees to storage:', error);
            return [];
        }
    },

    async removeAttendee(email: string): Promise<string[]> {
        try {
            const current = await this.getSavedAttendees();
            const target = email.trim().toLowerCase();
            const updated = current.filter((e) => e.toLowerCase() !== target);

            await AsyncStorage.setItem(ATTENDEES_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error removing attendee from storage:', error);
            return [];
        }
    },

    async clearAllAttendees(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ATTENDEES_KEY);
        } catch (error) {
            console.error('Error clearing attendee directory:', error);
        }
    },
};