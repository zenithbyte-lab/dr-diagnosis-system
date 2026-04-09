CLASSES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR']

# Chinese translations (shared across word_export and any future i18n)
RISK_CN = {"Low": "低风险", "Low-Medium": "低中风险", "Medium": "中风险", "High": "高风险", "Critical": "极高风险"}
GENDER_CN = {"male": "男", "female": "女"}
EYE_CN = {"left": "左眼", "right": "右眼", "unknown": "未指定"}
SEVERITY_CN = ["无明显病变（0级）", "轻度（1级）", "中度（2级）", "重度（3级）", "增殖期（4级）"]
REVIEW_CN = {"pending": "待审核", "confirmed": "已确认", "rejected": "已驳回"}

SEVERITY_INFO = {
    0: {"risk": "Low", "recommendation": "Continue regular eye examinations and maintain good blood sugar control."},
    1: {"risk": "Low-Medium", "recommendation": "Schedule a follow-up examination within 6-12 months."},
    2: {"risk": "Medium", "recommendation": "Consult with an ophthalmologist within 3-6 months. Close monitoring required."},
    3: {"risk": "High", "recommendation": "Immediate consultation with a retinal specialist required."},
    4: {"risk": "Critical", "recommendation": "Urgent medical attention required. Immediate treatment necessary."},
}
