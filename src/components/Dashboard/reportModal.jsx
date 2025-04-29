// SalesReportModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Spin,
  message,
} from "antd";
import { DownloadOutlined, LineChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "../../Store/stores";
import useSaleStore from "../../Store/useSaleStore";

const { Option } = Select;
const { RangePicker } = DatePicker;

const SalesReportModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [useDateRange, setUseDateRange] = useState(false);
  const [reportType, setReportType] = useState("daily");

  // Get store data from Zustand
  const {
    fetchSalesReport,
    exportSalesReport,
    salesReport,
    loading,
    error,
    clearError,
  } = useSaleStore();

  // Access auth store for user data and store information
  const { currentStore, user, stores } = useAuthStore((state) => ({
    currentStore: state.currentStore,
    user: state.user,
    stores: state.stores || [],
  }));

  const isAdmin = user?.role === "admin";

  // Reset form when modal is opened - FIXED to prevent infinite loop
  useEffect(() => {
    if (visible) {
      form.resetFields(); // Use resetFields first
      form.setFieldsValue({
        reportType: "daily",
        storeId: currentStore?.id,
        includeItemDetails: false,
      });
      clearError();
    }
  }, [visible]); // Only depend on visible to prevent loops

  // Show error messages from the store
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error]); // Removed clearError from dependencies

  const handleSubmit = async (values) => {
    try {
      const payload = {
        reportType: values.reportType,
        includeItemDetails: values.includeItemDetails,
      };

      // Add store ID if selected
      if (values.storeId) {
        payload.storeId = values.storeId;
      }

      // Add date range if user opted to use custom dates
      if (useDateRange && values.dateRange) {
        payload.startDate = values.dateRange[0].format("YYYY-MM-DD");
        payload.endDate = values.dateRange[1].format("YYYY-MM-DD");
      }

      await fetchSalesReport(payload);
      message.success("Sales report generated successfully");
    } catch (err) {
      // Error will be handled by the useEffect above
    }
  };

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue();
      const payload = {
        reportType: values.reportType,
        includeItemDetails: true, // Always include details for exports
        format: "csv",
      };

      if (values.storeId) {
        payload.storeId = values.storeId;
      }

      if (useDateRange && values.dateRange) {
        payload.startDate = values.dateRange[0].format("YYYY-MM-DD");
        payload.endDate = values.dateRange[1].format("YYYY-MM-DD");
      }

      await exportSalesReport(payload);
      message.success("Report exported successfully");
    } catch (err) {
      // Error will be handled by the useEffect above
    }
  };

  const handleReportTypeChange = (value) => {
    setReportType(value);
  };

  return (
    <Modal
      title="Generate Sales Report"
      open={visible} // Using 'open' prop which is correct for Ant Design v4+
      onCancel={onCancel}
      width={700}
      footer={null}
      className="sales-report-modal"
    >
      <div className="p-4">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            reportType: "daily",
            storeId: currentStore?.id,
            includeItemDetails: false,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Report Type"
              name="reportType"
              rules={[{ required: true, message: "Please select report type" }]}
            >
              <Select onChange={handleReportTypeChange}>
                <Option value="daily">Daily Report</Option>
                <Option value="weekly">Weekly Report</Option>
                <Option value="monthly">Monthly Report</Option>
                <Option value="yearly">Yearly Report</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Store"
              name="storeId"
              rules={[{ required: !isAdmin, message: "Please select a store" }]}
            >
              <Select
                placeholder="Select store"
                disabled={!isAdmin && currentStore}
                allowClear={isAdmin}
              >
                {stores?.map((store) => (
                  <Option
                    key={store.id || store._id}
                    value={store.id || store._id}
                  >
                    {store.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Checkbox
              checked={useDateRange}
              onChange={(e) => setUseDateRange(e.target.checked)}
            >
              Use custom date range
            </Checkbox>
          </Form.Item>

          {useDateRange && (
            <Form.Item
              label="Date Range"
              name="dateRange"
              rules={[{ required: true, message: "Please select date range" }]}
            >
              <RangePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          )}

          <Form.Item name="includeItemDetails" valuePropName="checked">
            <Checkbox>Include detailed product analytics</Checkbox>
          </Form.Item>

          <div className="flex justify-end space-x-4 mt-6">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              icon={<LineChartOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              Generate Report
            </Button>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={loading}
              disabled={!salesReport}
            >
              Export CSV
            </Button>
          </div>
        </Form>

        {loading && (
          <div className="flex justify-center items-center mt-8">
            <Spin size="large" tip="Processing..." />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SalesReportModal;
