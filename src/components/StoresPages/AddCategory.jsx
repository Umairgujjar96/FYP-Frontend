import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Spin } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../Store/stores";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AddCategory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/category/categories",
        {
          name: values.name,
          description: values.description,
        },
        {
          headers: {
            "Content-Type": "application/json",
            // Include authorization if needed
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success("Category created successfully!");
        form.resetFields();
        // Navigate to categories list
        navigate("/categories");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to create category";
      message.error(errorMsg);
      console.error("Error creating category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="shadow-md rounded-lg" bordered={false}>
        <div className="mb-6">
          <Title level={2} className="text-primary font-semibold">
            Add New Category
          </Title>
          <Text className="text-gray-500">
            Create a new category for your store products
          </Text>
        </div>

        <Spin spinning={loading} tip="Creating category...">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="Category Name"
              rules={[
                {
                  required: true,
                  message: "Please enter the category name",
                },
                {
                  max: 50,
                  message: "Category name cannot exceed 50 characters",
                },
              ]}
            >
              <Input placeholder="Enter category name" className="py-2" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                {
                  max: 500,
                  message: "Description cannot exceed 500 characters",
                },
              ]}
            >
              <TextArea
                placeholder="Enter category description (optional)"
                rows={4}
                className="py-2"
              />
            </Form.Item>

            <div className="flex mt-6 gap-4">
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-600 hover:bg-blue-700"
                size="large"
              >
                Create Category
              </Button>
              <Button
                onClick={() => navigate("/categories")}
                size="large"
                className="hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default AddCategory;
