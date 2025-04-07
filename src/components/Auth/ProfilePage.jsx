import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Divider,
  Spin,
  Upload,
  Typography,
  Tabs,
  Badge,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../Store/stores.js";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const BaseUrl = "http://localhost:5000/";

const ProfilePage = () => {
  const { user, token, isLoading, error, updateProfile } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      });
      setProfileImage(user.profileImage);
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleProfileUpdate = async (values) => {
    setIsUpdating(true);
    try {
      // Use the updateProfile method from the store
      await updateProfile({
        ...values,
        profileImage: profileImage,
      });
      message.success("Profile updated successfully");
    } catch (err) {
      // Error is handled by the store and displayed via useEffect
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setIsChangingPassword(true);
    try {
      if (values.newPassword !== values.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Make a direct API call here since we're using a different endpoint
      const response = await fetch(`${BaseUrl}api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      message.success("Password updated successfully");
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileImageChange = async (info) => {
    if (info.file.status === "done") {
      // If you're handling file uploads directly
      setProfileImage(URL.createObjectURL(info.file.originFileObj));

      // If you need to send the file to the server
      const formData = new FormData();
      formData.append("profileImage", info.file.originFileObj);

      try {
        const response = await fetch(`${BaseUrl}api/auth/profile-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to upload image");
        }

        message.success("Profile picture successfully updated");

        // Update the user object in the store with the new image URL
        updateProfile({
          profileImage: data.imageUrl,
        });
      } catch (error) {
        message.error(error.message || "Error uploading profile picture");
      }
    } else if (info.file.status === "error") {
      message.error("Error uploading profile picture");
    }
  };

  const getFullName = () => {
    if (!user) return "";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  };

  const getSubscriptionBadgeColor = () => {
    if (!user?.subscription) return "#52c41a";

    switch (user.subscription.status) {
      case "active":
        return "#52c41a"; // Green
      case "expired":
        return "#f5222d"; // Red
      case "trial":
        return "#1890ff"; // Blue
      default:
        return "#52c41a";
    }
  };

  const getSubscriptionDisplayText = () => {
    if (!user?.subscription) return "";

    const plan = user.subscription.currentPlan || "Free";
    const status = user.subscription.status;

    if (status === "trial") {
      return `${plan} (Trial)`;
    } else {
      return `${plan} ${status === "expired" ? "(Expired)" : ""}`;
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <Title level={2} className="m-0">
          My Profile
        </Title>
        {user?.subscription && (
          <Badge
            count={getSubscriptionDisplayText()}
            style={{ backgroundColor: getSubscriptionBadgeColor() }}
            className="mr-2"
          />
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={profileImage}
                  className="border-4 border-blue-50"
                />
                <div className="absolute bottom-0 right-0">
                  <Upload
                    name="profileImage"
                    showUploadList={false}
                    action={`${BaseUrl}api/auth/profile-image`}
                    headers={{
                      Authorization: `Bearer ${token}`,
                    }}
                    onChange={handleProfileImageChange}
                  >
                    <Button
                      shape="circle"
                      icon={<CameraOutlined />}
                      size="small"
                      className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                    />
                  </Upload>
                </div>
              </div>

              <Title level={3} className="mt-4 mb-0">
                {getFullName()}
              </Title>
              <Text type="secondary" className="text-lg">
                {user?.email}
              </Text>

              {user?.subscription && (
                <div className="mt-4 bg-blue-50 px-4 py-2 rounded-full text-blue-600 font-medium">
                  {getSubscriptionDisplayText()}
                </div>
              )}
            </div>

            <Divider className="my-6" />

            <div className="space-y-4">
              {user?.subscription?.trialStart && (
                <div className="flex items-center">
                  <CalendarOutlined className="text-blue-500 mr-3 text-lg" />
                  <div>
                    <Text type="secondary" className="block">
                      Trial started
                    </Text>
                    <Text strong>
                      {new Date(
                        user.subscription.trialStart
                      ).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              )}

              {user?.subscription?.trialEnd && (
                <div className="flex items-center">
                  <CalendarOutlined className="text-blue-500 mr-3 text-lg" />
                  <div>
                    <Text type="secondary" className="block">
                      Trial ends
                    </Text>
                    <Text strong>
                      {new Date(
                        user.subscription.trialEnd
                      ).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              )}

              {user?.lastLogin && (
                <div className="flex items-center">
                  <ClockCircleOutlined className="text-blue-500 mr-3 text-lg" />
                  <div>
                    <Text type="secondary" className="block">
                      Last login
                    </Text>
                    <Text strong>
                      {new Date(user.lastLogin).toLocaleString()}
                    </Text>
                  </div>
                </div>
              )}

              {user?.role && (
                <div className="flex items-center">
                  <TeamOutlined className="text-blue-500 mr-3 text-lg" />
                  <div>
                    <Text type="secondary" className="block">
                      Role
                    </Text>
                    <Text strong className="capitalize">
                      {user.role}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <Tabs defaultActiveKey="personal" className="profile-tabs">
              <TabPane
                tab={
                  <span className="flex items-center">
                    <UserOutlined className="mr-2" />
                    Personal Information
                  </span>
                }
                key="personal"
              >
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                  className="max-w-2xl"
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="firstName"
                        label="First Name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your first name",
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined className="text-gray-400" />}
                          placeholder="First Name"
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="lastName"
                        label="Last Name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your last name",
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined className="text-gray-400" />}
                          placeholder="Last Name"
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your email",
                          },
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined className="text-gray-400" />}
                          placeholder="Email Address"
                          disabled
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item name="phoneNumber" label="Phone Number">
                        <Input
                          prefix={<PhoneOutlined className="text-gray-400" />}
                          placeholder="Phone Number"
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isUpdating}
                      icon={<SaveOutlined />}
                      size="large"
                      className="bg-blue-500 hover:bg-blue-600 border-blue-500 px-6"
                    >
                      Update Profile
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span className="flex items-center">
                    <LockOutlined className="mr-2" />
                    Change Password
                  </span>
                }
                key="password"
              >
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  className="max-w-2xl"
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[
                      {
                        required: true,
                        message: "Enter your current password",
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Current Password"
                      className="py-2"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                          {
                            required: true,
                            message: "Please enter a new password",
                          },
                          {
                            min: 8,
                            message: "Password must be at least 8 characters",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined className="text-gray-400" />}
                          placeholder="New Password"
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        rules={[
                          {
                            required: true,
                            message: "Please confirm your new password",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue("newPassword") === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("The two passwords do not match")
                              );
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined className="text-gray-400" />}
                          placeholder="Confirm New Password"
                          className="py-2"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isChangingPassword}
                      icon={<LockOutlined />}
                      size="large"
                      className="bg-blue-500 hover:bg-blue-600 border-blue-500 px-6"
                    >
                      Update Password
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
