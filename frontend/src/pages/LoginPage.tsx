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
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: { username: string; password: string; real_name: string }) => {
    try {
      const { data } = await register(values.username, values.password, values.real_name);
      setAuth(data.access_token, data.user);
      message.success('注册成功');
      setRegOpen(false);
      navigate('/');
    } catch {
      message.error('注册失败，用户名可能已存在');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <EyeOutlined style={{ fontSize: 48, color: '#0e7490' }} />
        </div>
        <Title level={3} className="login-title">糖尿病视网膜病变诊断系统</Title>
        <Text className="login-subtitle" style={{ display: 'block' }}>
          基于深度学习的眼底图像辅助诊断平台
        </Text>

        <Form onFinish={onLogin} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => setRegOpen(true)}>
            注册新账号
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            演示账号：admin / admin123
          </Text>
        </div>

        <Modal title="用户注册" open={regOpen} onCancel={() => setRegOpen(false)} footer={null}>
          <Form onFinish={onRegister} layout="vertical">
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="real_name" label="姓名">
              <Input />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>注 册</Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
