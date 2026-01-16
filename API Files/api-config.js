// Example usage in your React components
import GSTAPI from './services/gst-api';
import ReportAPI from './services/report-api';
import UploadAPI from './services/upload-api';

// Example 1: File GST Return
async function fileGSTR1() {
  try {
    const returnData = {
      gstin: '27ABCDE1234F1Z5',
      period: '012024',
      invoices: [...],
      summary: {...},
    };
    
    const result = await GSTAPI.fileGSTR1(returnData);
    console.log('Return filed successfully:', result);
  } catch (error) {
    console.error('Filing failed:', error.message);
  }
}

// Example 2: Generate Report
async function generateSalesReport() {
  try {
    const filters = {
      gstin: '27ABCDE1234F1Z5',
      fromDate: '2024-01-01',
      toDate: '2024-03-31',
    };
    
    const report = await ReportAPI.getSalesReport(filters);
    console.log('Sales report:', report);
  } catch (error) {
    console.error('Report generation failed:', error.message);
  }
}

// Example 3: Upload Document
async function uploadInvoiceFile(file) {
  try {
    // Validate file before upload
    if (!UploadAPI.isValidFileSize(file, 50)) {
      throw new Error('File size exceeds 50MB limit');
    }
    
    const result = await UploadAPI.uploadDocument(
      file,
      'INVOICE',
      {
        gstin: '27ABCDE1234F1Z5',
        period: '012024',
        invoiceType: 'B2B',
      }
    );
    
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}