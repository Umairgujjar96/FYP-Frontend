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
  Select,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../Store/stores.js";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      notification.error({
        message: "Registration Failed",
        description: "Passwords do not match.",
      });
      return;
    }

    try {
      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        businessType: values.businessType,
      };

      await register(userData);

      notification.success({
        message: "Registration Successful",
        description: "Your account has been created. You can now log in.",
      });

      navigate("/login");
    } catch (err) {
      notification.error({
        message: "Registration Failed",
        description:
          err.message || "Please check your information and try again.",
      });
    }
  };

  return (
    <Layout className="register-layout" style={{ minHeight: "100vh" }}>
      <Content>
        <Row
          justify="center"
          align="middle"
          style={{ minHeight: "100vh", padding: "24px 0" }}
        >
          <Col xs={22} sm={20} md={16} lg={12} xl={10}>
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
                  PharmManager
                </Title>
                <Text type="secondary">Create a new account</Text>
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
                name="register"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your full name",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <UserOutlined className="site-form-item-icon" />
                        }
                        placeholder="Full Name"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        {
                          type: "email",
                          message: "Please enter a valid email",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <MailOutlined className="site-form-item-icon" />
                        }
                        placeholder="Email"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phoneNumber"
                      label="Phone Number"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your phone number",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <PhoneOutlined className="site-form-item-icon" />
                        }
                        placeholder="Phone Number"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="businessType"
                  label="Business Type"
                  rules={[
                    {
                      required: true,
                      message: "Please select your business type",
                    },
                  ]}
                >
                  <Select
                    placeholder="Select your business type"
                    suffixIcon={<ShopOutlined />}
                  >
                    <Option value="pharmacy">Pharmacy</Option>
                    <Option value="clinic">Clinic</Option>
                    <Option value="hospital">Hospital</Option>
                    <Option value="laboratory">Laboratory</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your password",
                        },
                        {
                          min: 8,
                          message: "Password must be at least 8 characters",
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={
                          <LockOutlined className="site-form-item-icon" />
                        }
                        placeholder="Password"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="confirmPassword"
                      label="Confirm Password"
                      dependencies={["password"]}
                      rules={[
                        {
                          required: true,
                          message: "Please confirm your password",
                        },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Passwords do not match")
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={
                          <LockOutlined className="site-form-item-icon" />
                        }
                        placeholder="Confirm Password"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="agreement"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                "You must accept the terms and conditions"
                              )
                            ),
                    },
                  ]}
                >
                  <Checkbox>
                    I agree to the <a href="#terms">Terms of Service</a> and{" "}
                    <a href="#privacy">Privacy Policy</a>
                  </Checkbox>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                  >
                    Create Account
                  </Button>
                </Form.Item>

                <Divider plain>
                  <Text type="secondary">OR</Text>
                </Divider>

                <div style={{ textAlign: "center" }}>
                  <Text>Already have an account?</Text>{" "}
                  <Link to="/login">Sign in</Link>
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

export default RegisterPage;
