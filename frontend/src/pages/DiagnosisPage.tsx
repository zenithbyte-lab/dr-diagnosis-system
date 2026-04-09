import { useState, useCallback } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Spin, Steps, message, Typography, Row, Col } from 'antd';
import { CloudUploadOutlined, ScanOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { createDiagnosis } from '../api/diagnosis';

const { Title, Text } = Typography;

const LOADING_STEPS = ['上传图像', '模型推理', '生成热力图', '保存结果'];

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const onSubmit = async (values: Record<string, string>) => {
    if (!file) { message.warning('请先上传眼底图像'); return; }
    setLoading(true);
    setStep(0);

    // Simulate step progress while waiting for API
    const timer = setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 3000);

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (values.patient_name) fd.append('patient_name', values.patient_name);
      if (values.patient_age) fd.append('patient_age', values.patient_age);
      if (values.patient_gender) fd.append('patient_gender', values.patient_gender);
      if (values.eye_side) fd.append('eye_side', values.eye_side);
      const { data } = await createDiagnosis(fd);
      clearInterval(timer);
      message.success('诊断完成');
      navigate(`/result/${data.uid}`);
    } catch {
      clearInterval(timer);
      message.error('诊断失败，请重试');
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <Spin
      spinning={loading}
      tip={
        <div style={{ marginTop: 16 }}>
          <Steps
            current={step}
            size="small"
            style={{ maxWidth: 400, margin: '16px auto' }}
            items={LOADING_STEPS.map((t) => ({ title: t }))}
          />
          <div style={{ marginTop: 8, color: '#666' }}>AI 模型分析中，请稍候...</div>
        </div>
      }
      size="large"
    >
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title={<><CloudUploadOutlined /> 上传眼底图像</>}>
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? 'upload-zone-active' : ''}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8 }} />
              ) : (
                <>
                  <div className="upload-zone-icon"><CloudUploadOutlined /></div>
                  <Title level={4} style={{ color: '#666' }}>
                    将眼底图像拖拽至此处，或点击浏览选择
                  </Title>
                  <Text type="secondary">支持 PNG / JPG / JPEG 格式，最大 10MB</Text>
                </>
              )}
            </div>
            {preview && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button danger onClick={() => { setFile(null); setPreview(''); }}>
                  移除图像
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="患者信息（选填）">
            <Form layout="vertical" onFinish={onSubmit}>
              <Form.Item name="patient_name" label="患者姓名">
                <Input placeholder="请输入患者姓名" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="patient_age" label="年龄">
                    <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="年龄" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="patient_gender" label="性别">
                    <Select placeholder="请选择" allowClear>
                      <Select.Option value="male">男</Select.Option>
                      <Select.Option value="female">女</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="eye_side" label="眼别">
                <Select placeholder="请选择" allowClear>
                  <Select.Option value="left">左眼</Select.Option>
                  <Select.Option value="right">右眼</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<ScanOutlined />} size="large" block disabled={!file}>
                  开始诊断
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
