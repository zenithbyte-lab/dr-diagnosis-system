import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Progress, Alert, Button, Tabs, Descriptions, Spin, message, Space } from 'antd';
import { DownloadOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { getDiagnosis } from '../api/diagnosis';
import { SEVERITY_COLORS, SEVERITY_LABELS, ALERT_TYPES } from '../constants/severity';
import { exportDiagnosisReport } from '../utils/download';

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
  eye_side: string;
  created_at: string;
  image: string;
  heatmap: string;
}

export default function ResultPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getDiagnosis(uid).then((res) => setData(res.data)).catch(() => message.error('Failed to load')).finally(() => setLoading(false));
  }, [uid]);

  const handleExport = async () => {
    if (!uid) return;
    setExporting(true);
    try {
      await exportDiagnosisReport(uid);
      message.success('Report downloaded');
    } catch {
      message.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return <Alert type="error" message="Diagnosis not found" />;

  const probs = [data.prob_no_dr, data.prob_mild, data.prob_moderate, data.prob_severe, data.prob_proliferative];

  return (
    <div>
      <Row gutter={24}>
        {/* Left: Images */}
        <Col xs={24} lg={12}>
          <Card>
            <Tabs
              items={[
                {
                  key: 'original',
                  label: 'Original Image',
                  children: <img src={data.image} alt="original" style={{ width: '100%', borderRadius: 8 }} />,
                },
                {
                  key: 'heatmap',
                  label: 'Grad-CAM Heatmap',
                  children: <img src={data.heatmap} alt="heatmap" style={{ width: '100%', borderRadius: 8 }} />,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right: Results */}
        <Col xs={24} lg={12}>
          <Card title="Diagnosis Result">
            {/* Severity Badge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span className={`severity-badge severity-${data.pred_class}`} style={{ fontSize: 18, padding: '8px 24px' }}>
                {data.pred_label}
              </span>
            </div>

            {/* Confidence Circle */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress
                type="circle"
                percent={data.confidence}
                size={140}
                strokeColor={SEVERITY_COLORS[data.pred_class]}
                format={(p) => <span style={{ fontSize: 20 }}>{p}%</span>}
              />
              <div style={{ marginTop: 8, color: '#666' }}>Diagnostic Confidence</div>
            </div>

            {/* Class Probabilities */}
            <div style={{ marginBottom: 24 }}>
              {SEVERITY_LABELS.map((label, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 600 }}>{probs[i]}%</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 4, height: 12, overflow: 'hidden' }}>
                    <div style={{ width: `${probs[i]}%`, height: '100%', background: SEVERITY_COLORS[i], borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Alert */}
            <Alert
              type={ALERT_TYPES[data.pred_class]}
              showIcon
              message={`Risk Level: ${data.risk_level}`}
              description={data.recommendation}
              style={{ marginBottom: 24 }}
            />

            {/* Patient Info */}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Patient">{data.patient_name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Age">{data.patient_age || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Eye">{data.eye_side}</Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(data.created_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
                Export Word Report
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => navigate('/')}>
                New Diagnosis
              </Button>
              <Button icon={<HistoryOutlined />} onClick={() => navigate('/history')}>
                View History
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
