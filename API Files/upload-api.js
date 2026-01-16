// upload-api.js - Document and Bulk Upload API Service
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.yourgstapp.com/v1';
const UPLOAD_BASE_URL = process.env.REACT_APP_UPLOAD_URL || 'https://uploads.yourgstapp.com';

class UploadAPIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // Longer timeout for uploads
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.uploadApi = axios.create({
      baseURL: UPLOAD_BASE_URL,
      timeout: 300000, // 5 minutes for large uploads
    });

    // Add auth interceptors
    const addAuthToken = (config) => {
      const token = localStorage.getItem('gst_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    this.api.interceptors.request.use(addAuthToken);
    this.uploadApi.interceptors.request.use(addAuthToken);
  }

  // Document Upload
  async uploadDocument(file, documentType, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await this.uploadApi.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // You can emit this progress if using event emitters
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk Invoice Upload
  async uploadBulkInvoices(file, gstin, period) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gstin', gstin);
      formData.append('period', period);

      const response = await this.uploadApi.post('/invoices/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Excel/CSV Upload for GST Returns
  async uploadReturnData(file, returnType, period, gstin) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('returnType', returnType);
      formData.append('period', period);
      formData.append('gstin', gstin);

      const response = await this.uploadApi.post('/returns/upload-data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GST Reconciliation Upload
  async uploadReconciliationFile(file, gstin, year, month) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gstin', gstin);
      formData.append('year', year);
      formData.append('month', month);

      const response = await this.uploadApi.post('/reconciliation/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Profile and KYC Document Upload
  async uploadKYCDocument(file, documentType, userId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('userId', userId);

      const response = await this.uploadApi.post('/kyc/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Signature Upload
  async uploadSignature(file, gstin) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gstin', gstin);

      const response = await this.uploadApi.post('/signature/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bank Statement Upload
  async uploadBankStatement(file, gstin, accountType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gstin', gstin);
      formData.append('accountType', accountType);

      const response = await this.uploadApi.post('/bank/statement-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Multi-file Upload
  async uploadMultipleFiles(files, uploadType, metadata) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      formData.append('uploadType', uploadType);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await this.uploadApi.post('/documents/multi-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload Status and Management
  async getUploadStatus(uploadId) {
    try {
      const response = await this.api.get(`/uploads/status/${uploadId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUploadHistory(filters = {}) {
    try {
      const response = await this.api.get('/uploads/history', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelUpload(uploadId) {
    try {
      const response = await this.api.delete(`/uploads/cancel/${uploadId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Template Downloads
  async downloadUploadTemplate(templateType) {
    try {
      const response = await this.api.get(`/uploads/template/${templateType}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Document Management
  async listDocuments(filters = {}) {
    try {
      const response = await this.api.get('/documents', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDocument(documentId) {
    try {
      const response = await this.api.get(`/documents/${documentId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteDocument(documentId) {
    try {
      const response = await this.api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateDocumentMetadata(documentId, metadata) {
    try {
      const response = await this.api.put(`/documents/${documentId}/metadata`, metadata);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File Validation
  async validateFile(file, validationType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validationType', validationType);

      const response = await this.uploadApi.post('/uploads/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Resume Upload (for large files)
  async resumeUpload(uploadId, chunkIndex) {
    try {
      const response = await this.api.post('/uploads/resume', {
        uploadId,
        chunkIndex,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    console.error('Upload API Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid file format or size');
        case 413:
          throw new Error('File size too large. Maximum size is 50MB');
        case 415:
          throw new Error('Unsupported file type');
        case 500:
          throw new Error('Upload failed. Please try again.');
        default:
          throw new Error(data.message || 'Upload failed');
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please try again.');
    } else {
      throw new Error(error.message || 'Upload failed');
    }
  }

  // Utility methods
  isValidFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  }

  isValidFileSize(file, maxSizeMB) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    return file.size <= maxSize;
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new UploadAPIService();