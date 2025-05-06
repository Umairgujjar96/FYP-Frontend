import React from "react";
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
  Space,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  NumberOutlined,
  IdcardOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../Store/stores.js";

const { Title, Text } = Typography;
const { Content } = Layout;

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
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        storeName: values.storeName,
        registrationNumber: values.registrationNumber,
        licenseNumber: values.licenseNumber,
        storePhone: values.storePhone,
        storeEmail: values.storeEmail,
        address: values.address,
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

  const validatePhoneNumber = (_, value) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!value || phoneRegex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Please enter a valid phone number"));
  };

  const validateEmail = (_, value) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!value || emailRegex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Please enter a valid email address"));
  };

  return (
    <Layout
      className="register-layout"
      style={{ minHeight: "100vh", background: "#f5f5f5" }}
    >
      <Content>
        <Row
          justify="center"
          align="middle"
          style={{ minHeight: "100vh", padding: "24px 0" }}
        >
          <Col xs={23} sm={22} md={20} lg={18} xl={16}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                borderRadius: "12px",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <Title
                  level={2}
                  style={{ color: "#1890ff", marginBottom: "8px" }}
                >
                  Welcome to Audica
                </Title>
                <Title level={4} style={{ marginBottom: "8px" }}>
                  Create Your Account
                </Title>
                <Text type="secondary">
                  Complete the form below to register your pharmacy
                </Text>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    color: "red",
                    textAlign: "center",
                    padding: "8px",
                    background: "#ffeeee",
                    borderRadius: "4px",
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
                requiredMark="optional"
              >
                <Divider orientation="left">
                  <Space>
                    <UserOutlined />
                    <span>Personal Information</span>
                  </Space>
                </Divider>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="firstName"
                      label="First Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your first name",
                        },
                        {
                          min: 2,
                          message: "First name must be at least 2 characters",
                        },
                      ]}
                    >
                      <Input placeholder="First Name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="lastName"
                      label="Last Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your last name",
                        },
                        {
                          min: 2,
                          message: "Last name must be at least 2 characters",
                        },
                      ]}
                    >
                      <Input placeholder="Last Name" />
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
                        { validator: validateEmail },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="Your Email"
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
                        { validator: validatePhoneNumber },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="Your Phone Number"
                      />
                    </Form.Item>
                  </Col>
                </Row>

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
                        {
                          pattern:
                            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                          message:
                            "Password must contain letters, numbers, and special characters",
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
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
                        prefix={<LockOutlined />}
                        placeholder="Confirm Password"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">
                  <Space>
                    <ShopOutlined />
                    <span>Pharmacy Information</span>
                  </Space>
                </Divider>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="storeName"
                      label="Pharmacy Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your pharmacy name",
                        },
                        {
                          min: 3,
                          message:
                            "Pharmacy name must be at least 3 characters",
                        },
                      ]}
                    >
                      <Input
                        prefix={<ShopOutlined />}
                        placeholder="Pharmacy Name"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="storePhone"
                      label="Pharmacy Phone Number"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the pharmacy phone number",
                        },
                        { validator: validatePhoneNumber },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="Pharmacy Phone Number"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="registrationNumber"
                      label="Registration Number"
                      rules={[
                        {
                          required: true,
                          message: "Please enter registration number",
                        },
                      ]}
                    >
                      <Input
                        prefix={<NumberOutlined />}
                        placeholder="Registration Number"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="licenseNumber"
                      label="License Number"
                      rules={[
                        {
                          required: true,
                          message: "Please enter license number",
                        },
                      ]}
                    >
                      <Input
                        prefix={<IdcardOutlined />}
                        placeholder="License Number"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="storeEmail"
                      label="Pharmacy Email"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the pharmacy email",
                        },
                        { validator: validateEmail },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="Pharmacy Email"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      name="address"
                      label="Pharmacy Address"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the pharmacy address",
                        },
                        {
                          min: 10,
                          message: "Please enter a complete address",
                        },
                      ]}
                    >
                      <Input.TextArea
                        prefix={<HomeOutlined />}
                        placeholder="Full Address"
                        rows={3}
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
                    style={{ height: "45px", fontSize: "16px" }}
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
