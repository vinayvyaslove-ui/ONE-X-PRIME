// report-api.js - Report Generation and Analytics API Service
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.yourgstapp.com/v1';

class ReportAPIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('gst_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // GST Return Reports
  async getGSTR1Summary(period, gstin) {
    try {
      const response = await this.api.get('/reports/gstr1/summary', {
        params: { period, gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getGSTR3BSummary(period, gstin) {
    try {
      const response = await this.api.get('/reports/gstr3b/summary', {
        params: { period, gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getGSTR9Summary(financialYear, gstin) {
    try {
      const response = await this.api.get('/reports/gstr9/summary', {
        params: { financialYear, gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sales and Purchase Reports
  async getSalesReport(filters) {
    try {
      const response = await this.api.get('/reports/sales', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPurchaseReport(filters) {
    try {
      const response = await this.api.get('/reports/purchase', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInputTaxCreditReport(filters) {
    try {
      const response = await this.api.get('/reports/itc', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Tax Liability Reports
  async getTaxLiabilityReport(filters) {
    try {
      const response = await this.api.get('/reports/tax-liability', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTaxPaymentReport(filters) {
    try {
      const response = await this.api.get('/reports/tax-payments', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analytics and Dashboard Reports
  async getDashboardSummary(gstin) {
    try {
      const response = await this.api.get('/reports/dashboard', {
        params: { gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMonthlyTrends(gstin, year) {
    try {
      const response = await this.api.get('/reports/monthly-trends', {
        params: { gstin, year },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getYearlyComparison(gstin, years) {
    try {
      const response = await this.api.get('/reports/yearly-comparison', {
        params: { gstin, years: years.join(',') },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Compliance Reports
  async getComplianceReport(gstin) {
    try {
      const response = await this.api.get('/reports/compliance', {
        params: { gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPendingReturnsReport(gstin) {
    try {
      const response = await this.api.get('/reports/pending-returns', {
        params: { gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLateFilingReport(gstin) {
    try {
      const response = await this.api.get('/reports/late-filing', {
        params: { gstin },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export Reports
  async exportReport(reportType, format, filters) {
    try {
      const response = await this.api.post('/reports/export', {
        reportType,
        format,
        filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getExportStatus(exportId) {
    try {
      const response = await this.api.get(`/reports/export/status/${exportId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Custom Report Generation
  async createCustomReport(reportConfig) {
    try {
      const response = await this.api.post('/reports/custom', reportConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCustomReports() {
    try {
      const response = await this.api.get('/reports/custom/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PDF Generation
  async generatePDF(reportData, template) {
    try {
      const response = await this.api.post('/reports/generate-pdf', {
        data: reportData,
        template,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async downloadReport(reportId) {
    try {
      const response = await this.api.get(`/reports/download/${reportId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GST Analytics
  async getGSTAnalytics(analyticsType, filters) {
    try {
      const response = await this.api.get(`/reports/analytics/${analyticsType}`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    console.error('Report API Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid report parameters');
        case 404:
          throw new Error('Report not found');
        case 500:
          throw new Error('Failed to generate report. Please try again.');
        default:
          throw new Error(data.message || 'Report generation failed');
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to generate report');
    }
  }
}

export default new ReportAPIService();