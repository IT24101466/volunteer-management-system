import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for all API calls 
const BASE_URL = 'https://volunteer-management-system-myg0.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000
});

api.interceptors.request.use(
  async (config) => {
    // Attach JWT token 
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'; // banner image upload
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
   

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;