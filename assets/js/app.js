// GST AI Assistant - Main Application JavaScript

class GSTAIApp {
    constructor() {
        this.apiBaseUrl = window.config?.apiUrl || 'https://api.gst-ai-app.com';
        this.userToken = localStorage.getItem('gst_ai_token');
        this.currentUser = null;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.checkAuth();
        this.loadDashboardData();
        this.initChatbot();
        this.initCharts();
        this.setupServiceWorker();
    }

    // Theme Management
    setupTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        localStorage.setItem('darkMode', this.isDarkMode);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Authentication
    checkAuth() {
        if (!this.userToken && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
            return;
        }
        
        if (this.userToken) {
            this.fetchUserProfile();
        }
    }

    async fetchUserProfile() {
        try {
            const response = await this.apiRequest('/api/user/profile');
            this.currentUser = response.data;
            this.updateUIForUser();
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            this.logout();
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('gst_ai_token', data.token);
                this.userToken = data.token;
                window.location.href = 'dashboard.html';
            } else {
                this.showAlert(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    logout() {
        localStorage.removeItem('gst_ai_token');
        window.location.href = 'login.html';
    }

    // API Request Helper
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.userToken) {
            headers['Authorization'] = `Bearer ${this.userToken}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request error:', error);
            this.showAlert(error.message, 'error');
            throw error;
        }
    }

    // Dashboard Functions
    async loadDashboardData() {
        if (!window.location.pathname.includes('dashboard.html')) return;
        
        try {
            // Load multiple data points in parallel
            const [summary, filings, alerts, analytics] = await Promise.all([
                this.apiRequest('/api/dashboard/summary'),
                this.apiRequest('/api/gst/filings?limit=5'),
                this.apiRequest('/api/alerts/unread'),
                this.apiRequest('/api/analytics/overview')
            ]);
            
            this.updateDashboard(summary.data);
            this.updateRecentFilings(filings.data);
            this.updateAlerts(alerts.data);
            this.updateCharts(analytics.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboard(data) {
        // Update stats cards
        this.updateElementText('total-invoices', this.formatCurrency(data.totalInvoices));
        this.updateElementText('pending-filings', data.pendingFilings);
        this.updateElementText('compliance-score', `${data.complianceScore}%`);
        this.updateElementText('tax-liability', this.formatCurrency(data.taxLiability));
        
        // Update progress bars
        this.updateProgressBar('filing-progress', data.filingProgress);
        this.updateProgressBar('reconciliation-progress', data.reconciliationProgress);
    }

    updateRecentFilings(filings) {
        const tbody = document.getElementById('recent-filings-body');
        if (!tbody) return;
        
        tbody.innerHTML = filings.map(filing => `
            <tr>
                <td>${filing.period}</td>
                <td>${filing.type}</td>
                <td><span class="badge badge-${filing.status}">${filing.status}</span></td>
                <td>${this.formatDate(filing.dueDate)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="app.viewFiling('${filing.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Chatbot Functions
    initChatbot() {
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatForm || !chatInput || !chatMessages) return;
        
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message
            this.addChatMessage(message, 'user');
            chatInput.value = '';
            
            // Get AI response
            try {
                const response = await this.apiRequest('/api/ai/chat', {
                    method: 'POST',
                    body: JSON.stringify({ message })
                });
                
                this.addChatMessage(response.data.response, 'bot');
            } catch (error) {
                this.addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        });
    }

    addChatMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;
        messageDiv.textContent = text;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Chart Functions
    initCharts() {
        if (typeof Chart === 'undefined') {
            // Load Chart.js dynamically if needed
            this.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
            return;
        }
        
        this.taxChart = this.createChart('taxChart', 'line', {
            labels: [],
            datasets: [{
                label: 'Tax Liability',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)'
            }]
        });
        
        this.filingChart = this.createChart('filingChart', 'bar', {
            labels: [],
            datasets: [{
                label: 'Filings',
                data: [],
                backgroundColor: '#10b981'
            }]
        });
    }

    createChart(canvasId, type, data) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;
        
        return new Chart(ctx, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }

    updateCharts(analytics) {
        if (this.taxChart && analytics.taxTrend) {
            this.taxChart.data.labels = analytics.taxTrend.labels;
            this.taxChart.data.datasets[0].data = analytics.taxTrend.data;
            this.taxChart.update();
        }
        
        if (this.filingChart && analytics.filingHistory) {
            this.filingChart.data.labels = analytics.filingHistory.labels;
            this.filingChart.data.datasets[0].data = analytics.filingHistory.data;
            this.filingChart.update();
        }
    }

    // GST Operations
    async fileGSTR(gstin, period, returnType) {
        try {
            const response = await this.apiRequest('/api/gst/file', {
                method: 'POST',
                body: JSON.stringify({
                    gstin,
                    period,
                    returnType,
                    autoCalculate: true
                })
            });
            
            this.showAlert('GST return filed successfully!', 'success');
            return response.data;
        } catch (error) {
            this.showAlert('Failed to file GST return', 'error');
            throw error;
        }
    }

    async generateInvoice(invoiceData) {
        try {
            const response = await this.apiRequest('/api/invoices/create', {
                method: 'POST',
                body: JSON.stringify(invoiceData)
            });
            
            this.showAlert('Invoice generated successfully!', 'success');
            
            // Open invoice in new tab
            if (response.data.pdfUrl) {
                window.open(response.data.pdfUrl, '_blank');
            }
            
            return response.data;
        } catch (error) {
            this.showAlert('Failed to generate invoice', 'error');
            throw error;
        }
    }

    async reconcileTransactions(period) {
        try {
            this.showLoading();
            const response = await this.apiRequest('/api/reconcile', {
                method: 'POST',
                body: JSON.stringify({ period })
            });
            
            this.showAlert('Reconciliation completed!', 'success');
            this.showReconciliationReport(response.data);
            return response.data;
        } catch (error) {
            this.showAlert('Reconciliation failed', 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // File Upload & Document Processing
    async uploadDocument(file, type) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);
        
        try {
            const response = await this.apiRequest('/api/documents/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });
            
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    setupFileUpload(dropZoneId, inputId, onUpload) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);
        
        if (!dropZone || !fileInput) return;
        
        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropZone.classList.add('highlight');
        }
        
        function unhighlight() {
            dropZone.classList.remove('highlight');
        }
        
        // Handle file drop
        dropZone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }
        
        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
        
        function handleFiles(files) {
            if (files.length > 0) {
                onUpload(files[0]);
            }
        }
    }

    // Notifications & Alerts
    showAlert(message, type = 'info', duration = 5000) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${this.getAlertIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(alert);
        
        // Auto remove after duration
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, duration);
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showLoading(container = document.body) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = '<div class="loading"></div>';
        container.appendChild(loadingDiv);
    }

    hideLoading(container = document.body) {
        const loadingOverlay = container.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    updateProgressBar(id, percentage) {
        const bar = document.getElementById(id);
        if (bar) {
            bar.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // File GST button
        const fileGstBtn = document.getElementById('fileGstBtn');
        if (fileGstBtn) {
            fileGstBtn.addEventListener('click', () => this.openFileGSTModal());
        }
        
        // Generate invoice button
        const genInvoiceBtn = document.getElementById('genInvoiceBtn');
        if (genInvoiceBtn) {
            genInvoiceBtn.addEventListener('click', () => this.openInvoiceModal());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + / to focus chat
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                const chatInput = document.getElementById('chatInput');
                if (chatInput) chatInput.focus();
            }
            
            // Esc to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }

    // Service Worker
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    showUpdateNotification() {
        if (confirm('A new version is available. Update now?')) {
            window.location.reload();
        }
    }

    // Modal Management
    openFileGSTModal() {
        const modal = document.getElementById('fileGSTModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    openInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Dynamic Script Loading
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Update UI based on user role
    updateUIForUser() {
        if (!this.currentUser) return;
        
        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome, ${this.currentUser.name}`;
        }
        
        // Show/hide features based on permissions
        const { permissions } = this.currentUser;
        
        // Example: Hide admin features for non-admins
        if (!permissions.includes('admin')) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GSTAIApp();
});

// Global utility functions
window.formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

window.formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GSTAIApp };
}