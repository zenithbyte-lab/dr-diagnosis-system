import { useState, useCallback } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Spin, message, Typography, Row, Col } from 'antd';
import { CloudUploadOutlined, ScanOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { createDiagnosis } from '../api/diagnosis';

const { Title, Text } = Typography;

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    if (!file) { message.warning('Please upload a fundus image'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (values.patient_name) fd.append('patient_name', values.patient_name);
      if (values.patient_age) fd.append('patient_age', values.patient_age);
      if (values.patient_gender) fd.append('patient_gender', values.patient_gender);
      if (values.eye_side) fd.append('eye_side', values.eye_side);
      const { data } = await createDiagnosis(fd);
      message.success('Diagnosis complete');
      navigate(`/result/${data.uid}`);
    } catch {
      message.error('Diagnosis failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading} tip="Analyzing fundus image with AI model..." size="large">
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title={<><CloudUploadOutlined /> Upload Fundus Image</>}>
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
                    Drag fundus image here or click to browse
                  </Title>
                  <Text type="secondary">Supports PNG / JPG / JPEG, max 10MB</Text>
                </>
              )}
            </div>
            {preview && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button danger onClick={() => { setFile(null); setPreview(''); }}>
                  Remove Image
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Patient Information (Optional)">
            <Form layout="vertical" onFinish={onSubmit}>
              <Form.Item name="patient_name" label="Patient Name">
                <Input placeholder="Enter patient name" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="patient_age" label="Age">
                    <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="Age" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="patient_gender" label="Gender">
                    <Select placeholder="Select" allowClear>
                      <Select.Option value="male">Male</Select.Option>
                      <Select.Option value="female">Female</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="eye_side" label="Eye Side">
                <Select placeholder="Select" allowClear>
                  <Select.Option value="left">Left Eye</Select.Option>
                  <Select.Option value="right">Right Eye</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<ScanOutlined />} size="large" block disabled={!file}>
                  Start Diagnosis
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
