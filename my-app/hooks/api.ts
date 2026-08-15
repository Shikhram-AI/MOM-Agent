import { Platform } from 'react-native';

const LOCAL_IP = '192.168.29.166';

export const API_BASE_URL = Platform.select({
    ios: `http://${LOCAL_IP}:5000/api`,
    android: `http://${LOCAL_IP}:5000/api`,
    default: 'http://localhost:5000/api',
});