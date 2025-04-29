// useReportStore.js
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000";

export const useReportStore = create((set, get) => ({
  salesReport: null,
  isLoading: false,
  error: null,

  // Fetch sales report
  fetchSalesReport: async (reportParams) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axios.post(
        `${API_URL}/reports/sales`,
        reportParams,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        set({
          salesReport: response.data.report,
          isLoading: false,
        });
        return response.data.report;
      } else {
        throw new Error(response.data.message || "Failed to generate report");
      }
    } catch (error) {
      set({
        error: error.message || "An error occurred while fetching the report",
        isLoading: false,
      });
      throw error;
    }
  },

  // Export sales report as CSV
  exportSalesReport: async (reportParams) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axios.post(
        `${API_URL}/reports/export`,
        reportParams,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob", // Important for handling file download
        }
      );

      // Create file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      // Generate filename based on report type and date
      const reportType =
        reportParams.reportType.charAt(0).toUpperCase() +
        reportParams.reportType.slice(1);
      const date = new Date().toISOString().split("T")[0];
      const filename = `${reportType}_Sales_Report_${date}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.message || "An error occurred while exporting the report",
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear report data
  clearReport: () => {
    set({ salesReport: null });
  },
}));

// Combined store selector hook for easier usage in components
export const useStoreSelector = (selector) => {
  // This is just a placeholder implementation
  // In a real application, you would combine your various store slices
  const reportState = useReportStore(selector);

  // Mock data for stores and auth that would come from other store slices
  const mockData = {
    stores: {
      stores: [
        { _id: "1", name: "Main Store" },
        { _id: "2", name: "Downtown Branch" },
        { _id: "3", name: "Mall Outlet" },
      ],
    },
    auth: {
      user: { id: "123", role: "admin" },
    },
  };

  return { ...reportState, ...mockData };
};
