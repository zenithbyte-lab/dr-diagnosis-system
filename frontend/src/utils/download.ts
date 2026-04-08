import { generateReport, downloadReport } from '../api/diagnosis';

export async function exportDiagnosisReport(uid: string) {
  await generateReport(uid);
  const res = await downloadReport(uid);
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DR_Report_${uid}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
