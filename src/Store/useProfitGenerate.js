import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./stores";

const API_URL = "http://localhost:5000";

const useProfitGenerateStore = create((set, get) => ({
  // State
  isLoading: false,
  error: null,
  report: null,
  exportLoading: false,
  exportError: null,

  // Reset state
  resetState: () =>
    set({
      isLoading: false,
      error: null,
      report: null,
      exportLoading: false,
      exportError: null,
    }),

  // Generate profit report
  generateProfitReport: async (reportParams) => {
    try {
      set({ isLoading: true, error: null });
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      // Create a new object instead of mutating the original
      const updatedParams = {
        ...reportParams,
        storeId: storeId,
      };

      console.log(updatedParams);

      const response = await axios.post(
        `${API_URL}/api/sales/reports/generateProfit`,
        updatedParams,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        set({ report: response.data.report, isLoading: false });
        return response.data.report;
      } else {
        throw new Error(response.data.message || "Failed to generate report");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while generating the report";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // Export profit report
  exportProfitReport: async (reportParams, format = "csv") => {
    try {
      set({ exportLoading: true, exportError: null });
      const token = useAuthStore.getState().token;
      const storeId = useAuthStore.getState().currentStore?.id;

      // Create a new object instead of mutating the original
      const updatedParams = {
        ...reportParams,
        storeId: storeId,
        format,
      };

      // Configure axios to return blob for file download
      const response = await axios.post(
        `${API_URL}/api/sales/reports/exportProfit`,
        updatedParams,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // Important for file downloads
        }
      );

      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      // Prepare file name
      const today = new Date().toISOString().split("T")[0];
      const reportType = reportParams.reportType || "profit";
      const fileName = `${reportType}_report_${today}.${format}`;

      // Set up and trigger download
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      set({ exportLoading: false });
      return true;
    } catch (error) {
      // Handle both API errors and blob creation errors
      let errorMessage = "An error occurred while exporting the report";

      if (error.response?.data) {
        // If it's a blob, we need to read it as text to get the error message
        if (error.response.data instanceof Blob) {
          try {
            const reader = new FileReader();

            // Create a promise to handle the asynchronous file reading
            const readBlobAsText = new Promise((resolve) => {
              reader.onload = () => resolve(reader.result);
              reader.readAsText(error.response.data);
            });

            // Wait for the blob to be read
            const blobText = await readBlobAsText;

            try {
              const errorData = JSON.parse(blobText);
              errorMessage = errorData.message || "Export failed";
            } catch (parseError) {
              errorMessage = "Failed to parse error response";
            }
          } catch (readError) {
            errorMessage = "Failed to read error response";
          }
        } else if (
          typeof error.response.data === "object" &&
          error.response.data.message
        ) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ exportError: errorMessage, exportLoading: false });
      return false;
    }
  },

  // Get report summary metrics
  getReportSummary: () => {
    const { report } = get();
    return report?.summary || null;
  },

  // Get report detailed data
  getReportDetails: () => {
    const { report } = get();
    return report?.detail || [];
  },

  // Check if report has product analytics
  hasProductAnalytics: () => {
    const { report } = get();
    return Boolean(
      report?.productAnalytics && report.productAnalytics.length > 0
    );
  },

  // Get product analytics from report
  getProductAnalytics: () => {
    const { report } = get();
    return report?.productAnalytics || [];
  },

  // Get date range information
  getDateRange: () => {
    const { report } = get();
    return report?.dateRange || { start: null, end: null, reportType: null };
  },
}));

export default useProfitGenerateStore;
