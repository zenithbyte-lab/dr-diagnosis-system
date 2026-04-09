import client from './client';

export const createDiagnosis = (formData: FormData) =>
  client.post('/api/diagnoses/', formData);

export const listDiagnoses = (page = 1, size = 10) =>
  client.get('/api/diagnoses/', { params: { page, size } });

export const getDiagnosis = (uid: string) =>
  client.get(`/api/diagnoses/${uid}`);

export const deleteDiagnosis = (uid: string) =>
  client.delete(`/api/diagnoses/${uid}`);

export const downloadReport = (uid: string) =>
  client.get(`/api/reports/${uid}/download`, { responseType: 'blob' });
