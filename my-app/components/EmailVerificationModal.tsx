import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { API_BASE_URL } from '../hooks/api';
import { storage } from '@/hooks/storage';

interface Props {
    visible: boolean;
    onVerified: (email: string) => void;
}

export const EmailVerificationModal: React.FC<Props> = ({ visible, onVerified }) => {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send OTP');

            setStep('otp');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Unable to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.trim().length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your email.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Verification failed');

            await storage.setUserVerified(email);
            // Automatically add user's verified email to attendee directory
            await storage.addAttendees([email]);

            onVerified(email.trim());
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>
                        {step === 'email' ? 'Welcome to MIRA' : 'Verify Your Email'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'email'
                            ? 'Enter your email to link your account and receive your MoM reports.'
                            : `We sent a 6-digit code to ${email}`}
                    </Text>

                    {step === 'email' ? (
                        <TextInput
                            style={styles.input}
                            placeholder="name@company.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={setEmail}
                            editable={!loading}
                        />
                    ) : (
                        <TextInput
                            style={[styles.input, styles.otpInput]}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                            editable={!loading}
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={step === 'email' ? handleSendOtp : handleVerifyOtp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {step === 'email' ? 'Send Code' : 'Verify & Continue'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {step === 'otp' && (
                        <TouchableOpacity
                            onPress={() => {
                                setStep('email');
                                setOtp('');
                            }}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>Change Email</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0F172A',
        marginBottom: 16,
    },
    otpInput: {
        textAlign: 'center',
        letterSpacing: 8,
        fontSize: 22,
        fontWeight: '700',
    },
    button: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 14,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#6366F1',
        fontSize: 14,
        fontWeight: '500',
    },
});