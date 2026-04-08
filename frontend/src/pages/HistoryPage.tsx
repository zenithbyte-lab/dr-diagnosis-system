import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Popconfirm, message } from 'antd';
import { EyeOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listDiagnoses, deleteDiagnosis } from '../api/diagnosis';
import { SEVERITY_TAG_COLORS, SEVERITY_LABELS, REVIEW_TAG_COLORS } from '../constants/severity';
import { exportDiagnosisReport } from '../utils/download';
import type { ColumnsType } from 'antd/es/table';

interface DiagRecord {
  uid: string;
  patient_name: string;
  eye_side: string;
  pred_class: number;
  pred_label: string;
  confidence: number;
  risk_level: string;
  review_status: string;
  created_at: string;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DiagRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await listDiagnoses(p, 10);
      setData(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const handleDelete = async (uid: string) => {
    await deleteDiagnosis(uid);
    message.success('Deleted');
    load();
  };

  const handleExport = async (uid: string) => {
    try {
      await exportDiagnosisReport(uid);
      message.success('Downloaded');
    } catch {
      message.error('Export failed');
    }
  };

  const columns: ColumnsType<DiagRecord> = [
    {
      title: 'Date', dataIndex: 'created_at', width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: 'Patient', dataIndex: 'patient_name', render: (v: string) => v || '-' },
    { title: 'Eye', dataIndex: 'eye_side', width: 80 },
    {
      title: 'Severity', dataIndex: 'pred_class', width: 130,
      render: (v: number) => <Tag color={SEVERITY_TAG_COLORS[v]}>{SEVERITY_LABELS[v]}</Tag>,
    },
    {
      title: 'Confidence', dataIndex: 'confidence', width: 100,
      render: (v: number) => `${v}%`,
    },
    {
      title: 'Review', dataIndex: 'review_status', width: 100,
      render: (v: string) => <Tag color={REVIEW_TAG_COLORS[v]}>{v}</Tag>,
    },
    {
      title: 'Actions', width: 200,
      render: (_: unknown, record: DiagRecord) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/result/${record.uid}`)}>
            View
          </Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record.uid)}>
            Report
          </Button>
          <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.uid)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Diagnosis History">
      <Table
        rowKey="uid"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: (t) => `Total ${t} records` }}
      />
    </Card>
  );
}
