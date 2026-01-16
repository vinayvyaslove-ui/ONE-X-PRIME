// gst-api.js - GST Filing and Management API Service
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.yourgstapp.com/v1';

class GSTAPIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for adding auth token
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

    // Add response interceptor for handling errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token expiration
          localStorage.removeItem('gst_access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // GST Registration APIs
  async registerGST(data) {
    try {
      const response = await this.api.post('/gst/registration', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getGSTRegistrationStatus(gstin) {
    try {
      const response = await this.api.get(`/gst/registration/status/${gstin}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GST Return Filing APIs
  async fileGSTR1(returnData) {
    try {
      const response = await this.api.post('/returns/gstr1', returnData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async fileGSTR3B(returnData) {
    try {
      const response = await this.api.post('/returns/gstr3b', returnData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async fileGSTR9(annualData) {
    try {
      const response = await this.api.post('/returns/gstr9', annualData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Draft and Save APIs
  async saveDraftReturn(returnType, period, data) {
    try {
      const response = await this.api.post('/returns/draft', {
        returnType,
        period,
        data,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDraftReturns() {
    try {
      const response = await this.api.get('/returns/drafts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Payment and Liability APIs
  async calculateLiability(period, gstin) {
    try {
      const response = await this.api.get(
        `/liability/calculate?period=${period}&gstin=${gstin}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async initiatePayment(paymentData) {
    try {
      const response = await this.api.post('/payments/initiate', paymentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await this.api.get(`/payments/status/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GSTIN Management
  async getGSTINDetails(gstin) {
    try {
      const response = await this.api.get(`/gstin/${gstin}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addGSTIN(gstinData) {
    try {
      const response = await this.api.post('/gstin/add', gstinData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listGSTINs() {
    try {
      const response = await this.api.get('/gstin/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Return Status and History
  async getReturnStatus(returnId) {
    try {
      const response = await this.api.get(`/returns/status/${returnId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getReturnHistory(filters = {}) {
    try {
      const response = await this.api.get('/returns/history', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // E-way Bill Integration
  async generateEWayBill(ewayData) {
    try {
      const response = await this.api.post('/eway/generate', ewayData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEWayBills(filters) {
    try {
      const response = await this.api.get('/eway/list', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  async validateGSTIN(gstin) {
    try {
      const response = await this.api.get(`/gstin/validate/${gstin}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getReturnPeriods(gstin) {
    try {
      const response = await this.api.get(`/returns/periods?gstin=${gstin}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    console.error('GST API Error:', error);
    
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid request data');
        case 401:
          throw new Error('Session expired. Please login again.');
        case 403:
          throw new Error('You do not have permission to perform this action');
        case 404:
          throw new Error('Requested resource not found');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new GSTAPIService();