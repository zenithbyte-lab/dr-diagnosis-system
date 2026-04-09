import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Input, Select, Space, message } from 'antd';
import {
  MedicineBoxOutlined, AlertOutlined, AuditOutlined, BarChartOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStatistics, searchDiagnoses, reviewDiagnosis, listUsers } from '../api/admin';
import { SEVERITY_COLORS, SEVERITY_TAG_COLORS, SEVERITY_LABELS_CN, REVIEW_TAG_COLORS, REVIEW_CN, RISK_CN } from '../constants/severity';
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

interface UserInfo {
  id: number;
  username: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<DiagRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [reviewModal, setReviewModal] = useState<{ uid: string; open: boolean }>({ uid: '', open: false });
  const [reviewComment, setReviewComment] = useState('');
  const [userMap, setUserMap] = useState<Record<number, string>>({});

  useEffect(() => {
    getStatistics().then((r) => setStats(r.data));
    listUsers().then((r) => {
      const map: Record<number, string> = {};
      r.data.forEach((u: UserInfo) => { map[u.id] = u.username; });
      setUserMap(map);
    });
  }, []);

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
    message.success('审核完成');
    setReviewModal({ uid: '', open: false });
    setReviewComment('');
    await Promise.all([loadRecords(), getStatistics().then((r) => setStats(r.data))]);
  };

  const columns: ColumnsType<DiagRecord> = [
    { title: '诊断时间', dataIndex: 'created_at', width: 170, render: (v: string) => new Date(v).toLocaleString() },
    { title: '用户', dataIndex: 'user_id', width: 90, render: (v: number) => userMap[v] || `用户${v}` },
    { title: '患者姓名', dataIndex: 'patient_name', render: (v: string) => v || '-' },
    { title: '病变等级', dataIndex: 'pred_class', width: 120, render: (v: number) => <Tag color={SEVERITY_TAG_COLORS[v]}>{SEVERITY_LABELS_CN[v]}</Tag> },
    { title: '置信度', dataIndex: 'confidence', width: 90, render: (v: number) => `${v}%` },
    { title: '风险', dataIndex: 'risk_level', width: 70, render: (v: string) => RISK_CN[v] || v },
    {
      title: '审核', dataIndex: 'review_status', width: 90,
      render: (v: string) => <Tag color={REVIEW_TAG_COLORS[v] || 'default'}>{REVIEW_CN[v] || v}</Tag>,
    },
    {
      title: '操作', width: 160,
      render: (_: unknown, r: DiagRecord) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/result/${r.uid}`)}>
            查看
          </Button>
          {r.review_status === 'pending' && (
            <Button size="small" type="primary" onClick={() => setReviewModal({ uid: r.uid, open: true })}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="诊断总数" value={stats?.total_diagnoses || 0} prefix={<MedicineBoxOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="高危病例" value={stats?.high_risk_count || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="待审核" value={stats?.pending_review_count || 0} prefix={<AuditOutlined />} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title="平均置信度" value={stats?.avg_confidence || 0} suffix="%" prefix={<BarChartOutlined />} precision={1} />
          </Card>
        </Col>
      </Row>

      {/* 病变等级分布 */}
      {stats && (
        <Card title="病变等级分布" style={{ marginBottom: 24 }}>
          <Row gutter={16} justify="space-around">
            {SEVERITY_LABELS_CN.map((_: string, i: number) => {
              const count = stats.severity_distribution[i];
              const totalCount = stats.total_diagnoses || 1;
              const pct = Math.round((count / totalCount) * 100);
              return (
                <Col key={i} style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: '50%', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700,
                    color: '#fff', background: SEVERITY_COLORS[i], boxShadow: `0 4px 12px ${SEVERITY_COLORS[i]}40`,
                  }}>
                    {count}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>{SEVERITY_LABELS_CN[i]}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{pct}%</div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* 诊断记录表 */}
      <Card
        title="全部诊断记录"
        extra={
          <Space>
            <Select placeholder="病变等级" allowClear style={{ width: 130 }} onChange={(v) => { setSeverity(v); setPage(1); }}>
              {SEVERITY_LABELS_CN.map((l, i) => <Select.Option key={i} value={i}>{l}</Select.Option>)}
            </Select>
            <Input.Search placeholder="患者姓名" allowClear onSearch={(v) => { setKeyword(v); setPage(1); }} style={{ width: 180 }} />
          </Space>
        }
      >
        <Table
          rowKey="uid"
          columns={columns}
          dataSource={records}
          pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title="诊断审核"
        open={reviewModal.open}
        onCancel={() => setReviewModal({ uid: '', open: false })}
        footer={[
          <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => handleReview('rejected')}>驳回</Button>,
          <Button key="confirm" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleReview('confirmed')}>确认通过</Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="审核意见（选填）"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
