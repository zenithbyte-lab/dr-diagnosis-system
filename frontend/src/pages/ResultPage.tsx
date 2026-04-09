import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Progress, Alert, Button, Tabs, Descriptions, Spin, message, Space, Typography, Tag } from 'antd';
import { DownloadOutlined, PlusOutlined, HistoryOutlined, FundViewOutlined } from '@ant-design/icons';
import { getDiagnosis } from '../api/diagnosis';
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_LABELS_CN, ALERT_TYPES, RISK_CN, EYE_CN, GENDER_CN, REVIEW_CN, REVIEW_TAG_COLORS } from '../constants/severity';
import { exportDiagnosisReport } from '../utils/download';

const { Text } = Typography;

interface DiagnosisData {
  uid: string;
  pred_class: number;
  pred_label: string;
  confidence: number;
  prob_no_dr: number;
  prob_mild: number;
  prob_moderate: number;
  prob_severe: number;
  prob_proliferative: number;
  risk_level: string;
  recommendation: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  eye_side: string;
  created_at: string;
  image: string;
  heatmap: string;
  review_status?: string;
  review_comment?: string;
}

export default function ResultPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!uid) return;
    // Use navigation state from DiagnosisPage if available (avoids second fetch)
    const stateData = (location.state as { diagnosis?: DiagnosisData })?.diagnosis;
    if (stateData && stateData.uid === uid) {
      setData(stateData);
      setLoading(false);
    } else {
      getDiagnosis(uid)
        .then((res) => setData(res.data))
        .catch(() => message.error('加载失败'))
        .finally(() => setLoading(false));
    }
  }, [uid, location.state]);

  const handleExport = async () => {
    if (!uid) return;
    setExporting(true);
    try {
      await exportDiagnosisReport(uid);
      message.success('报告已下载');
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return <Alert type="error" message="诊断记录未找到" />;

  const probs = [data.prob_no_dr, data.prob_mild, data.prob_moderate, data.prob_severe, data.prob_proliferative];

  return (
    <div>
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title={<><FundViewOutlined /> 眼底图像分析</>}>
            <Tabs
              items={[
                {
                  key: 'original',
                  label: '原始图像',
                  children: <img src={data.image} alt="original" style={{ width: '100%', borderRadius: 8 }} />,
                },
                {
                  key: 'heatmap',
                  label: 'Grad-CAM 热力图',
                  children: (
                    <div>
                      <img src={data.heatmap} alt="heatmap" style={{ width: '100%', borderRadius: 8 }} />
                      <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6f6f6', borderRadius: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          热力图说明：
                          <span style={{ color: '#dc2626', fontWeight: 600 }}> 红色/黄色 </span>
                          表示模型高度关注的区域（疑似病灶），
                          <span style={{ color: '#3b82f6', fontWeight: 600 }}> 蓝色/绿色 </span>
                          表示关注度较低的区域。热力图仅作为辅助参考，不能替代医生诊断。
                        </Text>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="诊断结果">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span className={`severity-badge severity-${data.pred_class}`} style={{ fontSize: 18, padding: '8px 24px' }}>
                {SEVERITY_LABELS_CN[data.pred_class]}（{data.pred_label}）
              </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress
                type="circle"
                percent={data.confidence}
                size={140}
                strokeColor={SEVERITY_COLORS[data.pred_class]}
                format={(p) => <span style={{ fontSize: 20 }}>{p}%</span>}
              />
              <div style={{ marginTop: 8, color: '#666' }}>诊断置信度</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              {SEVERITY_LABELS.map((label, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{SEVERITY_LABELS_CN[i]}（{label}）</span>
                    <span style={{ fontWeight: 600 }}>{probs[i]}%</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 4, height: 12, overflow: 'hidden' }}>
                    <div style={{ width: `${probs[i]}%`, height: '100%', background: SEVERITY_COLORS[i], borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <Alert
              type={ALERT_TYPES[data.pred_class]}
              showIcon
              message={`风险等级：${RISK_CN[data.risk_level] || data.risk_level}`}
              description={data.recommendation}
              style={{ marginBottom: 24 }}
            />

            {/* Show review status if reviewed */}
            {data.review_status && data.review_status !== 'pending' && (
              <Alert
                type={data.review_status === 'confirmed' ? 'success' : 'error'}
                showIcon
                message={<>审核状态：<Tag color={REVIEW_TAG_COLORS[data.review_status]}>{REVIEW_CN[data.review_status]}</Tag></>}
                description={data.review_comment || '无审核意见'}
                style={{ marginBottom: 24 }}
              />
            )}

            {data.confidence < 60 && (
              <Alert
                type="warning"
                showIcon
                message="低置信度提醒"
                description="本次诊断置信度低于 60%，建议重新上传更清晰的眼底图像，或请专业医生复核。"
                style={{ marginBottom: 24 }}
              />
            )}

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="患者姓名">{data.patient_name || '未填写'}</Descriptions.Item>
              <Descriptions.Item label="年龄">{data.patient_age || '未填写'}</Descriptions.Item>
              <Descriptions.Item label="性别">{GENDER_CN[data.patient_gender || ''] || '未填写'}</Descriptions.Item>
              <Descriptions.Item label="眼别">{EYE_CN[data.eye_side] || data.eye_side}</Descriptions.Item>
              <Descriptions.Item label="诊断时间" span={2}>{new Date(data.created_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
                导出 Word 报告
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => navigate('/')}>
                新建诊断
              </Button>
              <Button icon={<HistoryOutlined />} onClick={() => navigate('/history')}>
                诊断历史
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
