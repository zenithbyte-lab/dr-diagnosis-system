import { useState } from 'react';
import { Card, Form, Input, Button, message, Modal, Typography } from 'antd';
import { EyeOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuth } from '../store/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [regOpen, setRegOpen] = useState(false);

  const onLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await login(values.username, values.password);
      setAuth(data.access_token, data.user);
      message.success('Login successful');
      navigate('/');
    } catch {
      message.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: { username: string; password: string; real_name: string }) => {
    try {
      const { data } = await register(values.username, values.password, values.real_name);
      setAuth(data.access_token, data.user);
      message.success('Registration successful');
      setRegOpen(false);
      navigate('/');
    } catch {
      message.error('Registration failed, username may already exist');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <EyeOutlined style={{ fontSize: 48, color: '#0e7490' }} />
        </div>
        <Title level={3} className="login-title">DR Diagnosis System</Title>
        <Text className="login-subtitle" style={{ display: 'block' }}>
          Diabetic Retinopathy AI-Assisted Diagnosis
        </Text>

        <Form onFinish={onLogin} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Login
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => setRegOpen(true)}>
            Create Account
          </Button>
        </div>

        <Modal title="Register" open={regOpen} onCancel={() => setRegOpen(false)} footer={null}>
          <Form onFinish={onRegister} layout="vertical">
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="real_name" label="Real Name">
              <Input />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>Register</Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
