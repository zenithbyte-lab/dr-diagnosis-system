import { downloadReport } from '../api/diagnosis';

export async function exportDiagnosisReport(uid: string) {
  const res = await downloadReport(uid);
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `诊断报告_${uid}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
