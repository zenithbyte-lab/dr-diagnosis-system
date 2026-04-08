import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Input, Select, Space, message } from 'antd';
import {
  MedicineBoxOutlined, AlertOutlined, AuditOutlined, BarChartOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { getStatistics, searchDiagnoses, reviewDiagnosis } from '../api/admin';
import { SEVERITY_COLORS, SEVERITY_TAG_COLORS, SEVERITY_LABELS, REVIEW_TAG_COLORS } from '../constants/severity';
import type { ColumnsType } from 'antd/es/table';

interface Stats {
  total_diagnoses: number;
  severity_distribution: number[];
  avg_confidence: number;
  high_risk_count: number;
  pending_review_count: number;
  daily_counts: { date: string; count: number }[];
}

interface DiagRecord {
  uid: string;
  user_id: number;
  patient_name: string;
  pred_class: number;
  pred_label: string;
  confidence: number;
  risk_level: string;
  review_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<DiagRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [reviewModal, setReviewModal] = useState<{ uid: string; open: boolean }>({ uid: '', open: false });
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => { getStatistics().then((r) => setStats(r.data)); }, []);

  const loadRecords = async (p = page) => {
    const params: { [key: string]: unknown } = { page: p, size: 10 };
    if (severity !== undefined) params.severity = severity;
    if (keyword) params.keyword = keyword;
    const res = await searchDiagnoses(params);
    setRecords(res.data.items);
    setTotal(res.data.total);
  };

  useEffect(() => { loadRecords(); }, [page, severity, keyword]);

  const handleReview = async (status: string) => {
    await reviewDiagnosis(reviewModal.uid, status, reviewComment);
    message.success('Review submitted');
    setReviewModal({ uid: '', open: false });
    setReviewComment('');
    await Promise.all([loadRecords(), getStatistics().then((r) => setStats(r.data))]);
  };

  const columns: ColumnsType<DiagRecord> = [
    { title: 'Date', dataIndex: 'created_at', width: 160, render: (v: string) => new Date(v).toLocaleString() },
    { title: 'User', dataIndex: 'user_id', width: 70 },
    { title: 'Patient', dataIndex: 'patient_name', render: (v: string) => v || '-' },
    { title: 'Severity', dataIndex: 'pred_class', width: 130, render: (v: number) => <Tag color={SEVERITY_TAG_COLORS[v]}>{SEVERITY_LABELS[v]}</Tag> },
    { title: 'Confidence', dataIndex: 'confidence', width: 100, render: (v: number) => `${v}%` },
    { title: 'Risk', dataIndex: 'risk_level', width: 90 },
    {
      title: 'Review', dataIndex: 'review_status', width: 100,
      render: (v: string) => <Tag color={REVIEW_TAG_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Action', width: 100,
      render: (_: unknown, r: DiagRecord) => r.review_status === 'pending' ? (
        <Button size="small" type="primary" onClick={() => setReviewModal({ uid: r.uid, open: true })}>
          Review
        </Button>
      ) : null,
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Total Diagnoses" value={stats?.total_diagnoses || 0} prefix={<MedicineBoxOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="High Risk" value={stats?.high_risk_count || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Pending Review" value={stats?.pending_review_count || 0} prefix={<AuditOutlined />} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Avg Confidence" value={stats?.avg_confidence || 0} suffix="%" prefix={<BarChartOutlined />} precision={1} />
          </Card>
        </Col>
      </Row>

      {/* Severity Distribution */}
      {stats && (
        <Card title="Severity Distribution" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {SEVERITY_LABELS.map((label, i) => (
              <Col key={i} xs={12} md={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700,
                    color: '#fff', background: SEVERITY_COLORS[i],
                  }}>
                    {stats.severity_distribution[i]}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>{label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Records Table */}
      <Card
        title="All Diagnosis Records"
        extra={
          <Space>
            <Select placeholder="Severity" allowClear style={{ width: 140 }} onChange={setSeverity}>
              {SEVERITY_LABELS.map((l, i) => <Select.Option key={i} value={i}>{l}</Select.Option>)}
            </Select>
            <Input.Search placeholder="Patient name" allowClear onSearch={(v) => { setKeyword(v); setPage(1); }} style={{ width: 200 }} />
          </Space>
        }
      >
        <Table
          rowKey="uid"
          columns={columns}
          dataSource={records}
          pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: (t) => `Total ${t}` }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title="Review Diagnosis"
        open={reviewModal.open}
        onCancel={() => setReviewModal({ uid: '', open: false })}
        footer={[
          <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => handleReview('rejected')}>Reject</Button>,
          <Button key="confirm" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleReview('confirmed')}>Confirm</Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Review comment (optional)"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
