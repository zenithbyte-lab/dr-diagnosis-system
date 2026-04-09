export const SEVERITY_LABELS = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];
export const SEVERITY_LABELS_CN = ['无明显病变', '轻度', '中度', '重度', '增殖期'];
export const SEVERITY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];
export const SEVERITY_TAG_COLORS = ['green', 'blue', 'orange', 'red', 'magenta'];
export const ALERT_TYPES: ('success' | 'info' | 'warning' | 'error')[] = ['success', 'info', 'warning', 'error', 'error'];

export const REVIEW_TAG_COLORS: Record<string, string> = { pending: 'default', confirmed: 'success', rejected: 'error' };
export const REVIEW_CN: Record<string, string> = { pending: '待审核', confirmed: '已确认', rejected: '已驳回' };
export const EYE_CN: Record<string, string> = { left: '左眼', right: '右眼', unknown: '未指定' };
export const GENDER_CN: Record<string, string> = { male: '男', female: '女' };
export const RISK_CN: Record<string, string> = { Low: '低风险', 'Low-Medium': '低中风险', Medium: '中风险', High: '高风险', Critical: '极高风险' };
