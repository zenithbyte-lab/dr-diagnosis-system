import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Space, Popconfirm, Empty, message } from 'antd';
import { EyeOutlined, DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listDiagnoses, deleteDiagnosis } from '../api/diagnosis';
import { SEVERITY_TAG_COLORS, SEVERITY_LABELS_CN, REVIEW_TAG_COLORS, REVIEW_CN, EYE_CN } from '../constants/severity';
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

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await listDiagnoses(p, 10);
      setData(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (uid: string) => {
    await deleteDiagnosis(uid);
    message.success('已删除');
    load();
  };

  const handleExport = async (uid: string) => {
    try {
      await exportDiagnosisReport(uid);
      message.success('报告已下载');
    } catch {
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<DiagRecord> = [
    {
      title: '诊断时间', dataIndex: 'created_at', width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: '患者姓名', dataIndex: 'patient_name', render: (v: string) => v || '-' },
    { title: '眼别', dataIndex: 'eye_side', width: 80, render: (v: string) => EYE_CN[v] || v },
    {
      title: '病变等级', dataIndex: 'pred_class', width: 130,
      render: (v: number) => <Tag color={SEVERITY_TAG_COLORS[v]}>{SEVERITY_LABELS_CN[v]}</Tag>,
    },
    {
      title: '置信度', dataIndex: 'confidence', width: 90,
      render: (v: number) => `${v}%`,
    },
    {
      title: '审核状态', dataIndex: 'review_status', width: 100,
      render: (v: string) => <Tag color={REVIEW_TAG_COLORS[v]}>{REVIEW_CN[v] || v}</Tag>,
    },
    {
      title: '操作', width: 220,
      render: (_: unknown, record: DiagRecord) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/result/${record.uid}`)}>
            查看
          </Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record.uid)}>
            报告
          </Button>
          <Popconfirm title="确定删除此记录？" okText="确定" cancelText="取消" onConfirm={() => handleDelete(record.uid)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="诊断历史">
      <Table
        rowKey="uid"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{
          emptyText: (
            <Empty description="暂无诊断记录" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/')}>
                上传眼底图像开始诊断
              </Button>
            </Empty>
          ),
        }}
        pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: (t) => `共 ${t} 条记录` }}
      />
    </Card>
  );
}
