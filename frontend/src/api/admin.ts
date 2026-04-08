import client from './client';

export const getStatistics = () => client.get('/api/admin/statistics');

export const searchDiagnoses = (params: Record<string, unknown>) =>
  client.get('/api/admin/diagnoses', { params });

export const reviewDiagnosis = (uid: string, status: string, comment = '') =>
  client.put(`/api/admin/diagnoses/${uid}/review`, null, { params: { status, comment } });

export const listUsers = () => client.get('/api/admin/users');
