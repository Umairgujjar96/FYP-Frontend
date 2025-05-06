import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  notification,
  Layout,
  Row,
  Col,
  Checkbox,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../Store/stores.js";

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await login(values.email, values.password);
      notification.success({
        message: "Login Successful",
        description: "Welcome back to PharmManager!",
      });
      navigate("/dashboard");
    } catch (err) {
      notification.error({
        message: "Login Failed",
        description:
          err.message || "Please check your credentials and try again.",
      });
    }
  };

  return (
    <Layout className="login-layout" style={{ minHeight: "100vh" }}>
      <Content>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Col xs={22} sm={16} md={12} lg={8} xl={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <Title
                  level={2}
                  style={{ color: "#1890ff", marginBottom: "8px" }}
                >
                  Audica
                </Title>
                <Text type="secondary">Sign in to your account</Text>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    color: "red",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    placeholder="Email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    placeholder="Password"
                  />
                </Form.Item>

                <Form.Item>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>

                  <a
                    style={{ float: "right" }}
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      notification.info({
                        message: "Reset Password",
                        description:
                          "Password reset functionality will be implemented soon.",
                      });
                    }}
                  >
                    Forgot password?
                  </a>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                  >
                    Sign In
                  </Button>
                </Form.Item>

                <Divider plain>
                  <Text type="secondary">OR</Text>
                </Divider>

                <div style={{ textAlign: "center" }}>
                  <Text>Don't have an account?</Text>{" "}
                  <Link to="/register">Sign up now</Link>
                </div>
              </Form>
            </Card>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Text type="secondary">
                © {new Date().getFullYear()} PharmManager. All rights reserved.
              </Text>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LoginPage;
