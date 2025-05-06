import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  Alert,
  Typography,
  Breadcrumb,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import useCustomerStore from "../../Store/useCustomerStore";
//   import useCustomerStore from '../../Store/useCustomerStore';

const { Title, Text } = Typography;

const PrescriptionViewerPage = () => {
  const { customerId, prescriptionId } = useParams();
  const navigate = useNavigate();
  const { downloadPrescription, prescriptionData, loading, error } =
    useCustomerStore();
  const [fileType, setFileType] = useState("unknown");

  useEffect(() => {
    const loadPrescription = async () => {
      try {
        await downloadPrescription(customerId, prescriptionId);
      } catch (err) {
        // Error is handled in the store
      }
    };

    loadPrescription();
  }, [customerId, prescriptionId, downloadPrescription]);

  useEffect(() => {
    if (prescriptionData?.contentType) {
      if (prescriptionData.contentType.includes("pdf")) {
        setFileType("pdf");
      } else if (prescriptionData.contentType.includes("image")) {
        setFileType("image");
      } else {
        setFileType("other");
      }
    }
  }, [prescriptionData]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    if (prescriptionData?.url) {
      const a = document.createElement("a");
      a.href = prescriptionData.url;
      a.download = prescriptionData.filename || "prescription";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderPrescriptionContent = () => {
    if (!prescriptionData?.url) return null;

    switch (fileType) {
      case "pdf":
        return (
          <div className="w-full flex justify-center">
            <iframe
              src={prescriptionData.url}
              title="PDF Prescription"
              className="w-full h-screen max-h-[70vh]"
              style={{ border: "none" }}
            />
          </div>
        );
      case "image":
        return (
          <div className="w-full flex justify-center">
            <img
              src={prescriptionData.url}
              alt="Prescription"
              className="max-w-full object-contain max-h-[70vh]"
            />
          </div>
        );
      default:
        return (
          <div className="text-center p-8">
            <FileTextOutlined style={{ fontSize: "64px", color: "#1890ff" }} />
            <p className="mt-4">
              This file type cannot be previewed directly. Please download the
              file to view it.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <a onClick={handleGoBack}>Customers</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Prescription Viewer</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-md rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              className="mr-4"
            >
              Back to Customers
            </Button>
            <Title level={4} className="m-0">
              {prescriptionData?.filename || "Prescription Viewer"}
            </Title>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            disabled={!prescriptionData?.url}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Download
          </Button>
        </div>

        <Divider />

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Spin spinning={loading}>
          <div className="bg-gray-50 rounded-lg p-4">
            {renderPrescriptionContent()}
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default PrescriptionViewerPage;
