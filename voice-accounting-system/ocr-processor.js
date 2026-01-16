// OCR Processor for Voice Accounting System
// Handles document scanning, text extraction, and data parsing

class OCRProcessor {
    constructor() {
        this.tesseractWorker = null;
        this.isInitialized = false;
        this.supportedLanguages = ['eng', 'hin', 'tam', 'tel', 'ben'];
        this.currentLanguage = 'eng';
        
        // Invoice field patterns
        this.invoicePatterns = {
            invoiceNumber: /\b(?:invoice|inv|bill|challan)[\s\-#]*(\w+)\b/i,
            date: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
            amount: /\b(?:total|amount|amt|rs\.?|₹|INR)[\s:]*([\d,]+\.?\d*)\b/i,
            gstin: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/,
            gstAmount: /\b(?:gst|tax)[\s:]*([\d,]+\.?\d*)\b/i
        };
    }

    // Initialize Tesseract.js worker
    async initialize(language = 'eng') {
        if (this.isInitialized && this.currentLanguage === language) {
            return true;
        }

        try {
            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined') {
                console.warn('Tesseract.js not loaded. Loading from CDN...');
                await this.loadTesseract();
            }

            // Create or reinitialize worker
            if (this.tesseractWorker) {
                await this.tesseractWorker.terminate();
            }

            this.tesseractWorker = await Tesseract.createWorker({
                logger: (progress) => this.onProgress(progress)
            });

            // Load language data
            await this.tesseractWorker.loadLanguage(language);
            await this.tesseractWorker.initialize(language);
            
            this.currentLanguage = language;
            this.isInitialized = true;
            
            console.log(`OCR Processor initialized with language: ${language}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize OCR processor:', error);
            this.isInitialized = false;
            return false;
        }
    }

    // Load Tesseract from CDN if not available
    async loadTesseract() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Process image file
    async processImage(file, options = {}) {
        if (!this.isInitialized) {
            await this.initialize(options.language || 'eng');
        }

        try {
            const { data: { text, confidence, lines, words } } = await this.tesseractWorker.recognize(file);
            
            const result = {
                text,
                confidence,
                lines,
                words,
                extractedData: this.extractInvoiceData(text),
                rawText: text
            };

            // Post-process if requested
            if (options.postProcess) {
                result.processedData = this.postProcessExtractedData(result.extractedData);
            }

            return result;
        } catch (error) {
            console.error('Error processing image:', error);
            throw new Error('Failed to process image');
        }
    }

    // Process PDF file
    async processPDF(file, options = {}) {
        try {
            // Check if pdf-parse is available
            if (typeof window.pdfjsLib === 'undefined') {
                await this.loadPDFJS();
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            const numPages = pdf.numPages;
            const pageTexts = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
                pageTexts.push({
                    page: i,
                    text: pageText
                });
            }

            const result = {
                text: fullText,
                pages: pageTexts,
                extractedData: this.extractInvoiceData(fullText),
                rawText: fullText
            };

            if (options.postProcess) {
                result.processedData = this.postProcessExtractedData(result.extractedData);
            }

            return result;
        } catch (error) {
            console.error('Error processing PDF:', error);
            
            // Fallback to image-based OCR for PDFs
            console.log('Falling back to image-based OCR for PDF');
            return await this.processPDFAsImages(file, options);
        }
    }

    // Process PDF as images (fallback method)
    async processPDFAsImages(file, options = {}) {
        try {
            // Convert PDF to images using a canvas
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            const numPages = pdf.numPages;

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                
                // Create canvas for rendering
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Render page to canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Convert canvas to blob and process as image
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png', 1.0);
                });

                // Process the image
                const pageResult = await this.processImage(blob, options);
                fullText += pageResult.text + '\n';
            }

            const result = {
                text: fullText,
                extractedData: this.extractInvoiceData(fullText),
                rawText: fullText,
                method: 'image-conversion'
            };

            if (options.postProcess) {
                result.processedData = this.postProcessExtractedData(result.extractedData);
            }

            return result;
        } catch (error) {
            console.error('Error processing PDF as images:', error);
            throw new Error('Failed to process PDF document');
        }
    }

    // Load PDF.js library
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (window.pdfjsLib) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3/build/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3/build/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Extract invoice data from text
    extractInvoiceData(text) {
        const extracted = {
            invoiceNumber: null,
            date: null,
            totalAmount: null,
            gstin: null,
            gstAmount: null,
            subtotal: null,
            items: [],
            vendorInfo: {},
            customerInfo: {}
        };

        // Extract invoice number
        const invoiceMatch = text.match(this.invoicePatterns.invoiceNumber);
        if (invoiceMatch) {
            extracted.invoiceNumber = invoiceMatch[1];
        }

        // Extract date
        const dateMatch = text.match(this.invoicePatterns.date);
        if (dateMatch) {
            extracted.date = this.parseDate(dateMatch[1]);
        }

        // Extract total amount
        const amountMatch = text.match(this.invoicePatterns.amount);
        if (amountMatch) {
            extracted.totalAmount = this.parseAmount(amountMatch[1]);
        }

        // Extract GSTIN
        const gstinMatch = text.match(this.invoicePatterns.gstin);
        if (gstinMatch) {
            extracted.gstin = gstinMatch[0];
        }

        // Extract GST amount
        const gstAmountMatch = text.match(this.invoicePatterns.gstAmount);
        if (gstAmountMatch) {
            extracted.gstAmount = this.parseAmount(gstAmountMatch[1]);
        }

        // Extract vendor and customer info
        this.extractBusinessInfo(text, extracted);

        // Extract line items
        this.extractLineItems(text, extracted);

        return extracted;
    }

    // Extract business information
    extractBusinessInfo(text, extracted) {
        const lines = text.split('\n');
        
        // Look for vendor information (usually at top)
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            
            // Look for company names (usually in uppercase or title case)
            if (line.match(/^[A-Z&][A-Z\s&.,]+$/)) {
                if (!extracted.vendorInfo.name) {
                    extracted.vendorInfo.name = line;
                }
            }
            
            // Look for addresses
            if (line.match(/\b(?:street|road|lane|avenue|city|state|pincode|pin)\b/i)) {
                if (!extracted.vendorInfo.address) {
                    extracted.vendorInfo.address = line;
                }
            }
            
            // Look for contact info
            if (line.match(/\b(?:phone|mobile|tel|email|contact)\b/i)) {
                if (!extracted.vendorInfo.contact) {
                    extracted.vendorInfo.contact = line;
                }
            }
        }
        
        // Look for customer information (usually after "Bill To" or "Ship To")
        let customerSection = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            
            if (line.includes('bill to') || line.includes('ship to') || line.includes('customer')) {
                customerSection = true;
                continue;
            }
            
            if (customerSection) {
                if (line && !line.includes('invoice') && !line.includes('date') && !line.includes('amount')) {
                    if (!extracted.customerInfo.name && line.match(/^[A-Za-z\s&.,]+$/)) {
                        extracted.customerInfo.name = lines[i].trim();
                    } else if (!extracted.customerInfo.address) {
                        extracted.customerInfo.address = lines[i].trim();
                    }
                }
                
                // Stop after a few lines of customer info
                if (Object.keys(extracted.customerInfo).length >= 2) {
                    break;
                }
            }
        }
    }

    // Extract line items from invoice
    extractLineItems(text, extracted) {
        const lines = text.split('\n');
        let inItemsSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lowerLine = line.toLowerCase();
            
            // Detect start of items section
            if (lowerLine.includes('description') || 
                lowerLine.includes('item') || 
                lowerLine.includes('particulars') ||
                lowerLine.includes('qty') || 
                lowerLine.includes('quantity') ||
                lowerLine.includes('rate') || 
                lowerLine.includes('amount')) {
                inItemsSection = true;
                continue;
            }
            
            // Detect end of items section
            if (inItemsSection && (
                lowerLine.includes('subtotal') ||
                lowerLine.includes('total') ||
                lowerLine.includes('gst') ||
                lowerLine.includes('tax') ||
                lowerLine.includes('grand total'))) {
                break;
            }
            
            // Extract item information
            if (inItemsSection && line) {
                const item = this.parseLineItem(line);
                if (item) {
                    extracted.items.push(item);
                }
            }
        }
        
        // Calculate subtotal from items if not found
        if (extracted.items.length > 0 && !extracted.subtotal) {
            extracted.subtotal = extracted.items.reduce((sum, item) => sum + (item.total || 0), 0);
        }
    }

    // Parse a single line item
    parseLineItem(line) {
        // Try to match common item patterns
        // Pattern: Description Quantity UnitPrice Amount
        const patterns = [
            // Pattern with numbers at the end
            /^(.+?)\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d{1,2})?)$/,
            // Pattern with currency symbols
            /^(.+?)\s+(\d+)\s*[x×]\s*(\d+(?:\.\d{1,2})?)\s*[:=]\s*[₹$]?\s*(\d+(?:\.\d{1,2})?)/i,
            // Simple pattern with description and amount
            /^(.+?)\s+[₹$]?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)$/
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const item = {
                    description: match[1].trim(),
                    quantity: parseFloat(match[2]?.replace(/,/g, '')) || 1,
                    unitPrice: parseFloat(match[3]?.replace(/,/g, '')) || parseFloat(match[2]?.replace(/,/g, '')),
                    total: parseFloat(match[4]?.replace(/,/g, '')) || parseFloat(match[2]?.replace(/,/g, ''))
                };
                
                // Calculate missing values
                if (!item.unitPrice && item.quantity && item.total) {
                    item.unitPrice = item.total / item.quantity;
                }
                if (!item.total && item.quantity && item.unitPrice) {
                    item.total = item.quantity * item.unitPrice;
                }
                
                return item;
            }
        }
        
        return null;
    }

    // Post-process extracted data for better accuracy
    postProcessExtractedData(data) {
        const processed = { ...data };
        
        // Clean up invoice number
        if (processed.invoiceNumber) {
            processed.invoiceNumber = processed.invoiceNumber.replace(/[^\w\-]/g, '').toUpperCase();
        }
        
        // Validate and format date
        if (processed.date) {
            const parsedDate = new Date(processed.date);
            if (!isNaN(parsedDate.getTime())) {
                processed.date = parsedDate.toISOString().split('T')[0];
            } else {
                processed.date = null;
            }
        }
        
        // Calculate GST if not found but subtotal and total are available
        if (!processed.gstAmount && processed.subtotal && processed.totalAmount) {
            processed.gstAmount = processed.totalAmount - processed.subtotal;
        }
        
        // Calculate GST rate if possible
        if (processed.gstAmount && processed.subtotal && processed.subtotal > 0) {
            processed.gstRate = Math.round((processed.gstAmount / processed.subtotal) * 100);
            
            // Round to nearest standard GST rate
            const standardRates = [0, 5, 12, 18, 28];
            const closestRate = standardRates.reduce((prev, curr) => {
                return Math.abs(curr - processed.gstRate) < Math.abs(prev - processed.gstRate) ? curr : prev;
            });
            processed.gstRate = closestRate;
        }
        
        // Clean up business names
        if (processed.vendorInfo.name) {
            processed.vendorInfo.name = this.cleanBusinessName(processed.vendorInfo.name);
        }
        if (processed.customerInfo.name) {
            processed.customerInfo.name = this.cleanBusinessName(processed.customerInfo.name);
        }
        
        return processed;
    }

    // Clean business name
    cleanBusinessName(name) {
        return name
            .replace(/[^a-zA-Z0-9\s&.,\-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Parse date from various formats
    parseDate(dateStr) {
        const formats = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,  // DD/MM/YY
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let day, month, year;
                
                if (match[1].length === 4) {
                    // YYYY/MM/DD format
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                } else {
                    // DD/MM/YYYY or DD/MM/YY format
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    year = parseInt(match[3]);
                    
                    if (year < 100) {
                        year += 2000; // Convert YY to YYYY
                    }
                }
                
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        }
        
        return null;
    }

    // Parse amount from string
    parseAmount(amountStr) {
        if (!amountStr) return null;
        
        // Remove currency symbols and commas
        const cleanStr = amountStr.replace(/[₹$,]/g, '');
        
        // Try to parse as float
        const amount = parseFloat(cleanStr);
        return isNaN(amount) ? null : amount;
    }

    // Handle OCR progress updates
    onProgress(progress) {
        const event = new CustomEvent('ocr-progress', {
            detail: {
                status: progress.status,
                progress: progress.progress,
                message: this.getProgressMessage(progress.status)
            }
        });
        window.dispatchEvent(event);
    }

    // Get user-friendly progress message
    getProgressMessage(status) {
        const messages = {
            'loading tesseract core': 'Initializing OCR engine...',
            'initializing tesseract': 'Loading language data...',
            'loading language traineddata': 'Preparing text recognition...',
            'initializing api': 'Starting OCR process...',
            'recognizing text': 'Extracting text from document...'
        };
        
        return messages[status] || 'Processing document...';
    }

    // Process uploaded file (auto-detect type)
    async processFile(file, options = {}) {
        const fileType = file.type;
        
        // Show progress
        window.dispatchEvent(new CustomEvent('ocr-start', { detail: { fileName: file.name } }));
        
        try {
            let result;
            
            if (fileType === 'application/pdf') {
                result = await this.processPDF(file, options);
            } else if (fileType.startsWith('image/')) {
                result = await this.processImage(file, options);
            } else {
                throw new Error(`Unsupported file type: ${fileType}`);
            }
            
            window.dispatchEvent(new CustomEvent('ocr-complete', { 
                detail: { 
                    fileName: file.name,
                    result: result 
                }
            }));
            
            return result;
        } catch (error) {
            window.dispatchEvent(new CustomEvent('ocr-error', { 
                detail: { 
                    fileName: file.name,
                    error: error.message 
                }
            }));
            throw error;
        }
    }

    // Batch process multiple files
    async processFiles(files, options = {}) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processFile(file, options);
                results.push({
                    file: file.name,
                    success: true,
                    result: result
                });
            } catch (error) {
                results.push({
                    file: file.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Validate extracted invoice data
    validateInvoiceData(data) {
        const errors = [];
        
        if (!data.invoiceNumber) {
            errors.push('Invoice number not found');
        }
        
        if (!data.date) {
            errors.push('Invoice date not found');
        }
        
        if (!data.totalAmount) {
            errors.push('Total amount not found');
        }
        
        if (!data.vendorInfo.name) {
            errors.push('Vendor information not found');
        }
        
        if (data.items.length === 0) {
            errors.push('No line items found');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            score: this.calculateDataQualityScore(data)
        };
    }

    // Calculate data quality score (0-100)
    calculateDataQualityScore(data) {
        let score = 0;
        const weights = {
            invoiceNumber: 20,
            date: 15,
            totalAmount: 20,
            vendorInfo: 15,
            items: 20,
            gstin: 10
        };
        
        if (data.invoiceNumber) score += weights.invoiceNumber;
        if (data.date) score += weights.date;
        if (data.totalAmount) score += weights.totalAmount;
        if (data.vendorInfo.name) score += weights.vendorInfo;
        if (data.items.length > 0) score += weights.items;
        if (data.gstin) score += weights.gstin;
        
        return Math.min(100, score);
    }

    // Export data in various formats
    exportData(data, format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                return this.convertToCSV(data);
                
            case 'html':
                return this.convertToHTML(data);
                
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    // Convert extracted data to CSV
    convertToCSV(data) {
        const rows = [];
        
        // Header
        rows.push(['Field', 'Value']);
        
        // Basic info
        if (data.invoiceNumber) rows.push(['Invoice Number', data.invoiceNumber]);
        if (data.date) rows.push(['Date', data.date]);
        if (data.totalAmount) rows.push(['Total Amount', data.totalAmount]);
        if (data.gstin) rows.push(['GSTIN', data.gstin]);
        if (data.gstAmount) rows.push(['GST Amount', data.gstAmount]);
        if (data.subtotal) rows.push(['Subtotal', data.subtotal]);
        
        // Vendor info
        if (data.vendorInfo.name) rows.push(['Vendor Name', data.vendorInfo.name]);
        if (data.vendorInfo.address) rows.push(['Vendor Address', data.vendorInfo.address]);
        if (data.vendorInfo.contact) rows.push(['Vendor Contact', data.vendorInfo.contact]);
        
        // Customer info
        if (data.customerInfo.name) rows.push(['Customer Name', data.customerInfo.name]);
        if (data.customerInfo.address) rows.push(['Customer Address', data.customerInfo.address]);
        
        // Items header
        rows.push([]);
        rows.push(['Line Items']);
        rows.push(['Description', 'Quantity', 'Unit Price', 'Total']);
        
        // Items data
        data.items.forEach(item => {
            rows.push([
                item.description || '',
                item.quantity || '',
                item.unitPrice || '',
                item.total || ''
            ]);
        });
        
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    // Convert extracted data to HTML
    convertToHTML(data) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Extracted Invoice Data</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .invoice-data { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .label { font-weight: bold; color: #555; }
                </style>
            </head>
            <body>
                <div class="invoice-data">
                    <h2>Extracted Invoice Information</h2>
        `;
        
        // Basic Information
        html += `
            <div class="section">
                <h3>Basic Information</h3>
                <table>
                    <tr><td class="label">Invoice Number:</td><td>${data.invoiceNumber || 'Not found'}</td></tr>
                    <tr><td class="label">Date:</td><td>${data.date || 'Not found'}</td></tr>
                    <tr><td class="label">Total Amount:</td><td>${data.totalAmount ? '₹' + data.totalAmount.toFixed(2) : 'Not found'}</td></tr>
                    <tr><td class="label">GSTIN:</td><td>${data.gstin || 'Not found'}</td></tr>
                    <tr><td class="label">GST Amount:</td><td>${data.gstAmount ? '₹' + data.gstAmount.toFixed(2) : 'Not found'}</td></tr>
                    <tr><td class="label">Subtotal:</td><td>${data.subtotal ? '₹' + data.subtotal.toFixed(2) : 'Not found'}</td></tr>
                </table>
            </div>
        `;
        
        // Vendor Information
        if (data.vendorInfo.name || data.vendorInfo.address || data.vendorInfo.contact) {
            html += `
                <div class="section">
                    <h3>Vendor Information</h3>
                    <table>
                        ${data.vendorInfo.name ? `<tr><td class="label">Name:</td><td>${data.vendorInfo.name}</td></tr>` : ''}
                        ${data.vendorInfo.address ? `<tr><td class="label">Address:</td><td>${data.vendorInfo.address}</td></tr>` : ''}
                        ${data.vendorInfo.contact ? `<tr><td class="label">Contact:</td><td>${data.vendorInfo.contact}</td></tr>` : ''}
                    </table>
                </div>
            `;
        }
        
        // Customer Information
        if (data.customerInfo.name || data.customerInfo.address) {
            html += `
                <div class="section">
                    <h3>Customer Information</h3>
                    <table>
                        ${data.customerInfo.name ? `<tr><td class="label">Name:</td><td>${data.customerInfo.name}</td></tr>` : ''}
                        ${data.customerInfo.address ? `<tr><td class="label">Address:</td><td>${data.customerInfo.address}</td></tr>` : ''}
                    </table>
                </div>
            `;
        }
        
        // Line Items
        if (data.items.length > 0) {
            html += `
                <div class="section">
                    <h3>Line Items (${data.items.length} items)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.description || ''}</td>
                        <td>${item.quantity || ''}</td>
                        <td>${item.unitPrice ? '₹' + item.unitPrice.toFixed(2) : ''}</td>
                        <td>${item.total ? '₹' + item.total.toFixed(2) : ''}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        html += `
                </div>
            </body>
            </html>
        `;
        
        return html;
    }

    // Clean up resources
    async cleanup() {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
            this.tesseractWorker = null;
        }
        this.isInitialized = false;
    }

    // Get supported languages
    getSupportedLanguages() {
        return this.supportedLanguages.map(lang => ({
            code: lang,
            name: this.getLanguageName(lang)
        }));
    }

    // Get language name from code
    getLanguageName(code) {
        const languages = {
            'eng': 'English',
            'hin': 'Hindi',
            'tam': 'Tamil',
            'tel': 'Telugu',
            'ben': 'Bengali'
        };
        return languages[code] || code;
    }

    // Set language for OCR
    async setLanguage(language) {
        if (this.supportedLanguages.includes(language)) {
            await this.initialize(language);
            return true;
        }
        return false;
    }
}

// Create global instance
window.OCRProcessor = new OCRProcessor();

// Add event listeners for UI integration
document.addEventListener('DOMContentLoaded', function() {
    // File upload handler
    const uploadForm = document.getElementById('ocr-upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('ocr-file-input');
            const languageSelect = document.getElementById('ocr-language');
            const resultDiv = document.getElementById('ocr-result');
            const progressDiv = document.getElementById('ocr-progress');
            
            if (!fileInput.files.length) {
                alert('Please select a file to process');
                return;
            }
            
            const file = fileInput.files[0];
            const language = languageSelect?.value || 'eng';
            
            // Show progress
            if (progressDiv) {
                progressDiv.innerHTML = '<div class="progress">Processing...</div>';
                progressDiv.style.display = 'block';
            }
            
            // Setup progress listeners
            const onProgress = (e) => {
                if (progressDiv) {
                    progressDiv.innerHTML = `
                        <div class="progress">
                            <div class="progress-bar" style="width: ${e.detail.progress * 100}%"></div>
                            <div class="progress-text">${e.detail.message}</div>
                        </div>
                    `;
                }
            };
            
            const onComplete = (e) => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
                
                if (resultDiv) {
                    const data = e.detail.result.processedData || e.detail.result.extractedData;
                    const validation = window.OCRProcessor.validateInvoiceData(data);
                    
                    let resultHTML = `
                        <h3>OCR Results for ${e.detail.fileName}</h3>
                        <div class="data-quality ${validation.isValid ? 'valid' : 'warning'}">
                            Data Quality Score: ${validation.score}/100
                            ${validation.errors.length > 0 ? 
                                `<div class="errors">Issues found: ${validation.errors.join(', ')}</div>` : 
                                '<div class="success">All required fields found</div>'
                            }
                        </div>
                        <div class="extracted-data">
                            <h4>Extracted Information:</h4>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        </div>
                        <div class="actions">
                            <button onclick="window.OCRProcessor.exportAsJSON()" class="btn btn-primary">Export as JSON</button>
                            <button onclick="window.OCRProcessor.exportAsCSV()" class="btn btn-secondary">Export as CSV</button>
                            <button onclick="window.OCRProcessor.importToInvoice()" class="btn btn-success">Create Invoice</button>
                        </div>
                    `;
                    
                    resultDiv.innerHTML = resultHTML;
                    resultDiv.style.display = 'block';
                }
            };
            
            const onError = (e) => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
                
                alert(`Error processing file: ${e.detail.error}`);
            };
            
            // Add event listeners
            window.addEventListener('ocr-progress', onProgress);
            window.addEventListener('ocr-complete', onComplete);
            window.addEventListener('ocr-error', onError);
            
            try {
                await window.OCRProcessor.processFile(file, {
                    language: language,
                    postProcess: true
                });
            } finally {
                // Remove event listeners
                window.removeEventListener('ocr-progress', onProgress);
                window.removeEventListener('ocr-complete', onComplete);
                window.removeEventListener('ocr-error', onError);
            }
        });
    }
});

// Export helper methods
window.OCRProcessor.exportAsJSON = function() {
    const resultDiv = document.getElementById('ocr-result');
    if (!resultDiv) return;
    
    const pre = resultDiv.querySelector('pre');
    if (!pre) return;
    
    try {
        const data = JSON.parse(pre.textContent);
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice-data.json';
        a.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting JSON:', error);
    }
};

window.OCRProcessor.exportAsCSV = function() {
    const resultDiv = document.getElementById('ocr-result');
    if (!resultDiv) return;
    
    const pre = resultDiv.querySelector('pre');
    if (!pre) return;
    
    try {
        const data = JSON.parse(pre.textContent);
        const csv = window.OCRProcessor.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice-data.csv';
        a.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting CSV:', error);
    }
};

window.OCRProcessor.importToInvoice = function() {
    const resultDiv = document.getElementById('ocr-result');
    if (!resultDiv) return;
    
    const pre = resultDiv.querySelector('pre');
    if (!pre) return;
    
    try {
        const data = JSON.parse(pre.textContent);
        
        // Store data for invoice creation
        sessionStorage.setItem('ocrInvoiceData', JSON.stringify(data));
        
        // Navigate to invoice creation page
        window.location.href = 'invoice.html?fromOCR=true';
    } catch (error) {
        console.error('Error importing to invoice:', error);
        alert('Error importing data. Please check the extracted information.');
    }
};

// Add CSS for OCR interface
const ocrStyles = `
    .ocr-upload-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .ocr-file-input {
        margin: 1rem 0;
    }
    
    .ocr-language-select {
        width: 100%;
        padding: 0.5rem;
        margin: 1rem 0;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .ocr-progress {
        margin: 1rem 0;
        display: none;
    }
    
    .progress {
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        height: 30px;
        position: relative;
    }
    
    .progress-bar {
        background: #4CAF50;
        height: 100%;
        transition: width 0.3s ease;
    }
    
    .progress-text {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
    }
    
    .ocr-result {
        margin-top: 2rem;
        display: none;
    }
    
    .data-quality {
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
    }
    
    .data-quality.valid {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    
    .data-quality.warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
    }
    
    .extracted-data {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .extracted-data pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .actions button {
        flex: 1;
    }
    
    .dark-mode .ocr-upload-container {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    .dark-mode .extracted-data {
        background: #4a5568;
        border-color: #718096;
    }
    
    .dark-mode .ocr-language-select {
        background: #4a5568;
        color: #e2e8f0;
        border-color: #718096;
    }
`;

// Add styles to document
const ocrStyleSheet = document.createElement('style');
ocrStyleSheet.textContent = ocrStyles;
document.head.appendChild(ocrStyleSheet);

console.log('OCR Processor loaded successfully');