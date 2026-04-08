import axios from 'axios';
import { useAuth } from '../store/auth';

const client = axios.create({ baseURL: '' });

client.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuth.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
