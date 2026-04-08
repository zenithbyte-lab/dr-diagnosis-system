import client from './client';

export const login = (username: string, password: string) =>
  client.post('/api/auth/login', { username, password });

export const register = (username: string, password: string, real_name: string) =>
  client.post('/api/auth/register', { username, password, real_name });

export const getMe = () => client.get('/api/auth/me');
