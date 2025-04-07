import React, { useState } from "react";
import {
  Card,
  Radio,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Badge,
  List,
  Space,
  Checkbox,
} from "antd";
import {
  CheckCircleFilled,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const SubscriptionPage = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("pro");

  // Plan details with both monthly and annual pricing
  const plans = [
    {
      id: "basic",
      name: "Basic",
      icon: <ThunderboltOutlined />,
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        "Up to 10 projects",
        "5GB storage",
        "Basic analytics",
        "Email support",
        "Access to community forums",
      ],
      color: "bg-blue-50",
    },
    {
      id: "pro",
      name: "Pro",
      icon: <RocketOutlined />,
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      features: [
        "Up to 100 projects",
        "50GB storage",
        "Advanced analytics",
        "Priority email support",
        "API access",
        "Team collaboration (up to 5 users)",
        "Custom integrations",
      ],
      popular: true,
      color: "bg-purple-50",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      icon: <CrownOutlined />,
      monthlyPrice: 49.99,
      annualPrice: 499.99,
      features: [
        "Unlimited projects",
        "500GB storage",
        "Premium analytics and reporting",
        "24/7 dedicated support",
        "Advanced API access",
        "Unlimited team collaboration",
        "Custom integrations",
        "Service level agreement",
        "Dedicated account manager",
      ],
      color: "bg-green-50",
    },
  ];

  const handleBillingCycleChange = (e) => {
    setBillingCycle(e.target.value);
  };

  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
  };

  // Calculate savings for annual billing
  const calculateSavings = (monthly, annual) => {
    const monthlyCost = monthly * 12;
    const savings = (((monthlyCost - annual) / monthlyCost) * 100).toFixed(0);
    return savings;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Title level={1} className="text-4xl font-extrabold text-gray-900">
            Choose Your Subscription Plan
          </Title>
          <Text className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            Select the perfect plan for your needs and take your productivity to
            the next level.
          </Text>
        </div>

        <div className="text-center mb-8">
          <Radio.Group
            value={billingCycle}
            onChange={handleBillingCycleChange}
            buttonStyle="solid"
            className="bg-white p-1 rounded-lg shadow-sm border border-gray-200"
          >
            <Radio.Button value="monthly" className="px-6">
              Monthly
            </Radio.Button>
            <Radio.Button value="annual" className="px-6">
              Annual
              <Badge
                count="Save up to 20%"
                style={{ backgroundColor: "#52c41a", marginLeft: "8px" }}
              />
            </Radio.Button>
          </Radio.Group>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {plans.map((plan) => (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                hoverable
                className={`h-full border ${
                  selectedPlan === plan.id
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-gray-200"
                } rounded-lg ${plan.color}`}
                bodyStyle={{ padding: "24px" }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 mt-4 mr-4">
                    <Badge.Ribbon text="Popular" color="blue" />
                  </div>
                )}

                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        plan.id === "basic"
                          ? "bg-blue-100 text-blue-600"
                          : plan.id === "pro"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <Title level={3} className="mb-0 ml-2">
                      {plan.name}
                    </Title>
                  </div>

                  <div>
                    <div className="flex items-baseline mt-2">
                      <Title level={2} className="mb-0">
                        $
                        {billingCycle === "monthly"
                          ? plan.monthlyPrice
                          : plan.annualPrice}
                      </Title>
                      <Text className="ml-2 text-gray-500">
                        {billingCycle === "monthly" ? "/month" : "/year"}
                      </Text>
                    </div>

                    {billingCycle === "annual" && (
                      <Text type="success" className="block mt-1">
                        <DollarOutlined /> Save{" "}
                        {calculateSavings(plan.monthlyPrice, plan.annualPrice)}%
                      </Text>
                    )}
                  </div>

                  <Divider className="my-3" />

                  <List
                    dataSource={plan.features}
                    renderItem={(item) => (
                      <List.Item className="border-0 px-0 py-1">
                        <Space>
                          <CheckCircleFilled className="text-green-500" />
                          <Text>{item}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />

                  <Button
                    type={selectedPlan === plan.id ? "primary" : "default"}
                    size="large"
                    block
                    onClick={() => handlePlanSelection(plan.id)}
                    className={`mt-4 ${
                      selectedPlan === plan.id
                        ? ""
                        : "hover:border-blue-500 hover:text-blue-500"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <Title level={4}>Payment Details</Title>
          <Divider />

          <div className="mb-8">
            <Text className="text-lg font-medium">You've selected:</Text>
            <div className="mt-2 bg-gray-50 p-4 rounded-lg">
              <Space>
                <Text strong>
                  {plans.find((p) => p.id === selectedPlan)?.name} Plan
                </Text>
                <Divider type="vertical" />
                <Text>
                  {billingCycle === "monthly"
                    ? `$${
                        plans.find((p) => p.id === selectedPlan)?.monthlyPrice
                      }/month`
                    : `$${
                        plans.find((p) => p.id === selectedPlan)?.annualPrice
                      }/year`}
                </Text>
              </Space>
            </div>
          </div>

          <div className="mb-4">
            <Checkbox defaultChecked>
              I agree to the Terms and Conditions
            </Checkbox>
          </div>

          <Button type="primary" size="large" block className="h-12">
            Proceed to Payment
          </Button>

          <div className="mt-4 text-center text-gray-500">
            <Text>Your subscription will begin immediately after payment</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
