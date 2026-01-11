
import axios from 'axios';
import { Platform } from 'react-native';

// 10.0.2.2 is the special alias to your host loopback interface (127.0.0.1)
// on the Android Emulator.
// For physical device, you would need your machine's LAN IP (e.g. 192.168.1.X).
const BASE_URL = 'http://192.168.0.100:4000/api';

const api = axios.create({
  baseURL: BASE_URL, 
});

export default api;
