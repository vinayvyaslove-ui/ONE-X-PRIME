// Main JavaScript file for Voice Accounting System

// DOM Elements
const elements = {
    // Voice Controls
    voiceBtn: document.getElementById('voice-control-btn'),
    voiceIndicator: document.getElementById('voice-indicator'),
    voiceFeedback: document.getElementById('voice-feedback'),
    
    // Language Controls
    languageSelect: document.getElementById('language-select'),
    
    // Theme Controls
    themeToggle: document.getElementById('theme-toggle'),
    
    // User Controls
    logoutBtn: document.getElementById('logout-btn'),
    userName: document.getElementById('user-name'),
    
    // Navigation
    quickActionCards: document.querySelectorAll('.action-card'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    invoiceForm: document.getElementById('invoice-form'),
    expenseForm: document.getElementById('expense-form'),
    
    // Tables
    invoiceTable: document.getElementById('invoice-table'),
    expenseTable: document.getElementById('expense-table'),
    
    // Charts
    salesChart: document.getElementById('sales-chart'),
    expenseChart: document.getElementById('expense-chart'),
    
    // Modals
    modalOverlay: document.getElementById('modal-overlay'),
    modals: document.querySelectorAll('.modal'),
    
    // Search
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results')
};

// Application State
const state = {
    user: null,
    invoices: [],
    expenses: [],
    customers: [],
    products: [],
    isVoiceActive: false,
    currentLanguage: 'en',
    currentTheme: 'light',
    currentPage: 'dashboard'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadUserState();
    initializeEventListeners();
    initializeVoiceControls();
    loadDashboardData();
    updateUI();
}

// User State Management
function loadUserState() {
    const savedUser = localStorage.getItem('voiceAccountingUser');
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        updateUserDisplay();
    }
    
    if (savedTheme) {
        state.currentTheme = savedTheme;
        setTheme(savedTheme);
    }
    
    if (savedLanguage) {
        state.currentLanguage = savedLanguage;
        setLanguage(savedLanguage);
    }
}

function saveUserState() {
    if (state.user) {
        localStorage.setItem('voiceAccountingUser', JSON.stringify(state.user));
    }
    localStorage.setItem('theme', state.currentTheme);
    localStorage.setItem('language', state.currentLanguage);
}

function updateUserDisplay() {
    if (state.user && elements.userName) {
        elements.userName.textContent = state.user.name;
    }
}

// Event Listeners
function initializeEventListeners() {
    // Voice Control
    if (elements.voiceBtn) {
        elements.voiceBtn.addEventListener('click', toggleVoiceControl);
    }
    
    // Language Selector
    if (elements.languageSelect) {
        elements.languageSelect.value = state.currentLanguage;
        elements.languageSelect.addEventListener('change', function(e) {
            setLanguage(e.target.value);
        });
    }
    
    // Theme Toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    // Quick Actions
    elements.quickActionCards?.forEach(card => {
        card.addEventListener('click', handleQuickAction);
    });
    
    // Forms
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegister);
    }
    
    if (elements.invoiceForm) {
        elements.invoiceForm.addEventListener('submit', handleInvoiceSubmit);
    }
    
    if (elements.expenseForm) {
        elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
    
    // Search
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
    }
    
    // Modal Controls
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal') || 
            e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Responsive Navigation
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
}

// Voice Control Functions
function initializeVoiceControls() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Voice recognition supported');
    } else {
        console.warn('Voice recognition not supported in this browser');
        if (elements.voiceBtn) {
            elements.voiceBtn.disabled = true;
            elements.voiceBtn.title = 'Voice recognition not supported';
        }
    }
}

function toggleVoiceControl() {
    state.isVoiceActive = !state.isVoiceActive;
    
    if (state.isVoiceActive) {
        startVoiceRecognition();
        elements.voiceBtn?.classList.add('active');
        showNotification('Voice control activated', 'success');
    } else {
        stopVoiceRecognition();
        elements.voiceBtn?.classList.remove('active');
        showNotification('Voice control deactivated', 'info');
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showNotification('Voice recognition not supported', 'error');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getVoiceLanguageCode(state.currentLanguage);
    
    recognition.onstart = function() {
        console.log('Voice recognition started');
        showVoiceIndicator(true);
    };
    
    recognition.onresult = function(event) {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        
        processVoiceCommand(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        if (event.error === 'not-allowed') {
            showNotification('Microphone access denied', 'error');
            toggleVoiceControl();
        }
    };
    
    recognition.onend = function() {
        console.log('Voice recognition ended');
        showVoiceIndicator(false);
        if (state.isVoiceActive) {
            // Restart recognition
            setTimeout(() => recognition.start(), 100);
        }
    };
    
    window.voiceRecognition = recognition;
    recognition.start();
}

function stopVoiceRecognition() {
    if (window.voiceRecognition) {
        window.voiceRecognition.stop();
        window.voiceRecognition = null;
    }
    showVoiceIndicator(false);
}

function showVoiceIndicator(show) {
    if (elements.voiceIndicator) {
        elements.voiceIndicator.style.display = show ? 'flex' : 'none';
    }
}

function processVoiceCommand(transcript) {
    console.log('Voice command:', transcript);
    
    // Show feedback
    if (elements.voiceFeedback) {
        elements.voiceFeedback.textContent = transcript;
        elements.voiceFeedback.classList.add('show');
        setTimeout(() => {
            elements.voiceFeedback.classList.remove('show');
        }, 3000);
    }
    
    // Process command
    const command = identifyVoiceCommand(transcript.toLowerCase());
    if (command) {
        executeVoiceCommand(command, transcript);
    } else {
        // Try to understand as natural language
        interpretNaturalLanguage(transcript);
    }
}

function identifyVoiceCommand(transcript) {
    const commands = {
        'create_invoice': ['create invoice', 'new invoice', 'make invoice'],
        'view_invoices': ['show invoices', 'view invoices', 'list invoices'],
        'add_expense': ['add expense', 'record expense', 'log expense'],
        'view_reports': ['show reports', 'view reports', 'see reports'],
        'calculate_gst': ['calculate gst', 'gst calculation', 'compute gst'],
        'search_invoice': ['find invoice', 'search invoice', 'lookup invoice'],
        'go_to_dashboard': ['go to dashboard', 'show dashboard', 'dashboard'],
        'open_settings': ['open settings', 'show settings', 'settings'],
        'help': ['help', 'what can i do', 'commands']
    };
    
    for (const [command, keywords] of Object.entries(commands)) {
        for (const keyword of keywords) {
            if (transcript.includes(keyword)) {
                return { type: command, keyword: keyword };
            }
        }
    }
    
    return null;
}

function executeVoiceCommand(command, originalTranscript) {
    console.log('Executing command:', command.type);
    
    switch (command.type) {
        case 'create_invoice':
            navigateTo('invoice.html');
            break;
        case 'view_invoices':
            navigateTo('invoices.html');
            break;
        case 'add_expense':
            navigateTo('expense.html');
            break;
        case 'view_reports':
            navigateTo('reports.html');
            break;
        case 'calculate_gst':
            const amount = extractAmountFromTranscript(originalTranscript);
            if (amount) {
                calculateGST(amount);
            } else {
                showNotification('Please specify an amount for GST calculation', 'warning');
            }
            break;
        case 'search_invoice':
            const invoiceNumber = extractInvoiceNumber(originalTranscript);
            if (invoiceNumber) {
                searchInvoice(invoiceNumber);
            }
            break;
        case 'go_to_dashboard':
            navigateTo('dashboard.html');
            break;
        case 'open_settings':
            navigateTo('settings.html');
            break;
        case 'help':
            showVoiceCommandsHelp();
            break;
    }
}

function interpretNaturalLanguage(transcript) {
    // Extract amounts
    const amountMatch = transcript.match(/\d+(\.\d{1,2})?/);
    if (amountMatch) {
        const amount = parseFloat(amountMatch[0]);
        
        // Check if it's about GST
        if (transcript.includes('gst') || transcript.includes('tax')) {
            calculateGST(amount);
            return;
        }
        
        // Check if it's about invoice
        if (transcript.includes('invoice')) {
            showNotification(`Creating invoice for ₹${amount}`, 'info');
            // You could pre-fill invoice form with this amount
            return;
        }
    }
    
    // Default response
    speakResponse("I'm not sure about that. You can say 'help' to see what I can do.");
}

function extractAmountFromTranscript(transcript) {
    const match = transcript.match(/\d+(\.\d{1,2})?/);
    return match ? parseFloat(match[0]) : null;
}

function extractInvoiceNumber(transcript) {
    const match = transcript.match(/INV-\d+/i) || 
                  transcript.match(/invoice\s+(\w+)/i) ||
                  transcript.match(/\d+/);
    return match ? match[0] : null;
}

function getVoiceLanguageCode(language) {
    const languageMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN'
    };
    return languageMap[language] || 'en-IN';
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getVoiceLanguageCode(state.currentLanguage);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

function showVoiceCommandsHelp() {
    const commands = [
        "Create invoice - To create a new invoice",
        "View invoices - To see all invoices",
        "Add expense - To record an expense",
        "View reports - To see financial reports",
        "Calculate GST for [amount] - To calculate GST",
        "Search invoice [number] - To find an invoice",
        "Go to dashboard - To return to main screen",
        "Open settings - To change settings"
    ];
    
    const modalContent = `
        <div class="modal">
            <div class="modal-header">
                <h3>Available Voice Commands</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <ul class="voice-commands-list">
                    ${commands.map(cmd => `<li>${cmd}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary close-modal">Close</button>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

// Language and Theme Functions
function setLanguage(language) {
    state.currentLanguage = language;
    document.documentElement.lang = language;
    
    // Update language selector
    if (elements.languageSelect) {
        elements.languageSelect.value = language;
    }
    
    // Save preference
    saveUserState();
    
    // Update UI elements with translations
    updateTranslations();
    
    showNotification(`Language changed to ${getLanguageName(language)}`, 'success');
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'bn': 'Bengali'
    };
    return languages[code] || 'English';
}

function updateTranslations() {
    // This would typically load translation files
    // For now, we'll update a few key elements
    
    const translationMap = {
        'en': {
            'dashboard-title': 'Dashboard',
            'voice-control': 'Voice Control',
            'logout': 'Logout'
        },
        'hi': {
            'dashboard-title': 'डैशबोर्ड',
            'voice-control': 'वॉयस नियंत्रण',
            'logout': 'लॉग आउट'
        }
        // Add more translations as needed
    };
    
    const translations = translationMap[state.currentLanguage] || translationMap.en;
    
    // Update elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
}

function setTheme(theme) {
    state.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    
    // Update theme icon
    if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    saveUserState();
}

function toggleTheme() {
    const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    showNotification(`Theme changed to ${newTheme} mode`, 'success');
}

// Navigation Functions
function navigateTo(page) {
    if (window.location.pathname.endsWith(page)) {
        return; // Already on the page
    }
    
    showLoading();
    window.location.href = page;
}

function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loading);
}

function handleQuickAction(e) {
    e.preventDefault();
    const action = this.getAttribute('href') || this.dataset.action;
    
    if (action) {
        if (action.startsWith('http') || action.endsWith('.html')) {
            navigateTo(action);
        } else {
            executeQuickAction(action);
        }
    }
}

function executeQuickAction(action) {
    switch (action) {
        case 'create-invoice':
            navigateTo('invoice.html');
            break;
        case 'gst-calculator':
            openGSTCalculator();
            break;
        case 'view-reports':
            navigateTo('reports.html');
            break;
        case 'voice-commands':
            showVoiceCommandsHelp();
            break;
    }
}

// Form Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch('/api/accounting/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.user = data.user;
            saveUserState();
            showNotification('Login successful!', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigateTo('dashboard.html');
            }, 1000);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        businessName: formData.get('businessName'),
        phone: formData.get('phone')
    };
    
    try {
        const response = await fetch('/api/accounting/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Registration successful! Please login.', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                navigateTo('login.html');
            }, 1500);
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    if (!state.user) {
        showNotification('Please login first', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const invoiceData = {
        customer: {
            name: formData.get('customerName'),
            email: formData.get('customerEmail'),
            phone: formData.get('customerPhone'),
            address: formData.get('customerAddress'),
            gstNumber: formData.get('customerGST')
        },
        items: JSON.parse(formData.get('items') || '[]'),
        subtotal: parseFloat(formData.get('subtotal')),
        gstDetails: JSON.parse(formData.get('gstDetails') || '{}'),
        totalAmount: parseFloat(formData.get('totalAmount')),
        notes: formData.get('notes')
    };
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/accounting/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Invoice created successfully!', 'success');
            
            // Reset form
            e.target.reset();
            
            // Update invoice list
            if (window.updateInvoiceList) {
                window.updateInvoiceList();
            }
        } else {
            showNotification(data.message || 'Invoice creation failed', 'error');
        }
    } catch (error) {
        console.error('Invoice submission error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    if (!state.user) {
        showNotification('Please login first', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const expenseData = {
        category: formData.get('category'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        vendor: formData.get('vendor'),
        paymentMethod: formData.get('paymentMethod'),
        invoiceNumber: formData.get('invoiceNumber'),
        gstApplicable: formData.get('gstApplicable') === 'true',
        notes: formData.get('notes')
    };
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/accounting/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Expense recorded successfully!', 'success');
            
            // Reset form
            e.target.reset();
            
            // Update expense list
            if (window.updateExpenseList) {
                window.updateExpenseList();
            }
        } else {
            showNotification(data.message || 'Expense recording failed', 'error');
        }
    } catch (error) {
        console.error('Expense submission error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Data Loading Functions
async function loadDashboardData() {
    if (!state.user) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/accounting/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to demo data
        loadDemoData();
    }
}

function loadDemoData() {
    // Load demo data for demonstration purposes
    fetch('demo-data.json')
        .then(response => response.json())
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error loading demo data:', error);
        });
}

function updateDashboard(data) {
    // Update quick stats
    if (data.quickStats) {
        updateQuickStats(data.quickStats);
    }
    
    // Update recent activity
    if (data.recentActivity) {
        updateRecentActivity(data.recentActivity);
    }
    
    // Update charts
    if (data.charts) {
        updateCharts(data.charts);
    }
}

function updateQuickStats(stats) {
    // Update quick stat elements
    document.querySelectorAll('[data-stat]').forEach(element => {
        const statName = element.getAttribute('data-stat');
        if (stats[statName]) {
            element.textContent = formatCurrency(stats[statName]);
        }
    });
}

function updateRecentActivity(activities) {
    const container = document.querySelector('.activity-list');
    if (!container) return;
    
    const html = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <span class="activity-time">${formatTime(activity.time)}</span>
            </div>
            <div class="activity-amount ${activity.amount >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(activity.amount)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateCharts(chartData) {
    // Initialize or update charts
    if (elements.salesChart && chartData.sales) {
        renderSalesChart(chartData.sales);
    }
    
    if (elements.expenseChart && chartData.expenses) {
        renderExpenseChart(chartData.expenses);
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatTime(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

function getActivityIcon(type) {
    const icons = {
        'invoice': 'fa-file-invoice-dollar',
        'expense': 'fa-money-bill-wave',
        'payment': 'fa-credit-card',
        'gst': 'fa-calculator',
        'system': 'fa-cog'
    };
    return icons[type] || 'fa-circle';
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function openModal(content) {
    if (elements.modalOverlay) {
        elements.modalOverlay.innerHTML = content;
        elements.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.remove('active');
        elements.modalOverlay.innerHTML = '';
        document.body.style.overflow = '';
    }
}

function logout() {
    state.user = null;
    localStorage.removeItem('voiceAccountingUser');
    localStorage.removeItem('authToken');
    showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        navigateTo('index.html');
    }, 1000);
}

// Search Functionality
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        if (elements.searchResults) {
            elements.searchResults.innerHTML = '';
            elements.searchResults.classList.remove('active');
        }
        return;
    }
    
    // Perform search
    const results = performSearch(query);
    
    // Display results
    if (elements.searchResults) {
        if (results.length > 0) {
            elements.searchResults.innerHTML = results.map(result => `
                <div class="search-result-item" data-id="${result.id}" data-type="${result.type}">
                    <div class="search-result-icon">
                        <i class="fas ${result.icon}"></i>
                    </div>
                    <div class="search-result-content">
                        <h4>${result.title}</h4>
                        <p>${result.description}</p>
                    </div>
                    <div class="search-result-action">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `).join('');
            
            elements.searchResults.classList.add('active');
            
            // Add click listeners
            elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const type = item.dataset.type;
                    const id = item.dataset.id;
                    navigateToSearchResult(type, id);
                });
            });
        } else {
            elements.searchResults.innerHTML = '<div class="no-results">No results found</div>';
            elements.searchResults.classList.add('active');
        }
    }
}

function performSearch(query) {
    // This would typically search through the database
    // For now, return mock results
    return [
        {
            id: 'INV-2023-001',
            type: 'invoice',
            icon: 'fa-file-invoice-dollar',
            title: 'Invoice INV-2023-001',
            description: 'Tech Solutions Pvt Ltd - ₹442,500'
        },
        {
            id: 'EXP-2023-001',
            type: 'expense',
            icon: 'fa-money-bill-wave',
            title: 'Office Rent',
            description: 'Property Management Ltd - ₹59,000'
        }
        // Add more results as needed
    ].filter(result => 
        result.title.toLowerCase().includes(query) || 
        result.description.toLowerCase().includes(query)
    );
}

function navigateToSearchResult(type, id) {
    switch (type) {
        case 'invoice':
            navigateTo(`invoice-details.html?id=${id}`);
            break;
        case 'expense':
            navigateTo(`expense-details.html?id=${id}`);
            break;
        case 'customer':
            navigateTo(`customer-details.html?id=${id}`);
            break;
        default:
            showNotification('Cannot navigate to this result', 'warning');
    }
    
    if (elements.searchResults) {
        elements.searchResults.classList.remove('active');
    }
    if (elements.searchInput) {
        elements.searchInput.value = '';
    }
}

// GST Calculator
function calculateGST(amount) {
    const gstRate = 18; // Default rate
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;
    
    const message = `
        <strong>GST Calculation:</strong><br>
        Amount: ${formatCurrency(amount)}<br>
        GST (${gstRate}%): ${formatCurrency(gstAmount)}<br>
        <strong>Total: ${formatCurrency(totalAmount)}</strong>
    `;
    
    showNotification(message, 'info');
    
    // Speak the result
    speakResponse(`For ${amount} rupees, GST is ${gstAmount} rupees. Total is ${totalAmount} rupees.`);
}

function openGSTCalculator() {
    const modalContent = `
        <div class="modal">
            <div class="modal-header">
                <h3>GST Calculator</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="gst-calculator">
                    <div class="form-group">
                        <label for="gst-amount">Amount (₹)</label>
                        <input type="number" id="gst-amount" placeholder="Enter amount" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="gst-rate">GST Rate (%)</label>
                        <select id="gst-rate">
                            <option value="0">0% - Exempt</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Calculation Method</label>
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="gst-method" value="cgst_sgst" checked>
                                CGST + SGST
                            </label>
                            <label>
                                <input type="radio" name="gst-method" value="igst">
                                IGST
                            </label>
                        </div>
                    </div>
                    <button id="calculate-gst-btn" class="btn btn-primary">Calculate GST</button>
                    
                    <div id="gst-result" class="gst-result" style="display: none;">
                        <h4>Result</h4>
                        <div class="result-item">
                            <span>Original Amount:</span>
                            <span id="original-amount">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>GST Amount:</span>
                            <span id="gst-amount-result">₹0.00</span>
                        </div>
                        <div class="result-item">
                            <span>Total Amount:</span>
                            <span id="total-amount">₹0.00</span>
                        </div>
                        <div id="gst-breakdown"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal(modalContent);
    
    // Add event listener for calculation
    document.getElementById('calculate-gst-btn').addEventListener('click', performGSTCalculation);
}

function performGSTCalculation() {
    const amountInput = document.getElementById('gst-amount');
    const rateSelect = document.getElementById('gst-rate');
    const methodInput = document.querySelector('input[name="gst-method"]:checked');
    
    if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
        showNotification('Please enter a valid amount', 'warning');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const rate = parseFloat(rateSelect.value);
    const method = methodInput.value;
    
    const gstAmount = (amount * rate) / 100;
    const totalAmount = amount + gstAmount;
    
    // Update result display
    document.getElementById('original-amount').textContent = formatCurrency(amount);
    document.getElementById('gst-amount-result').textContent = formatCurrency(gstAmount);
    document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
    
    // Update breakdown based on method
    let breakdownHTML = '';
    if (method === 'cgst_sgst') {
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;
        breakdownHTML = `
            <div class="result-subitem">
                <span>CGST (${rate/2}%):</span>
                <span>${formatCurrency(cgst)}</span>
            </div>
            <div class="result-subitem">
                <span>SGST (${rate/2}%):</span>
                <span>${formatCurrency(sgst)}</span>
            </div>
        `;
    } else {
        breakdownHTML = `
            <div class="result-subitem">
                <span>IGST (${rate}%):</span>
                <span>${formatCurrency(gstAmount)}</span>
            </div>
        `;
    }
    
    document.getElementById('gst-breakdown').innerHTML = breakdownHTML;
    document.getElementById('gst-result').style.display = 'block';
}

// Invoice Search
function searchInvoice(invoiceNumber) {
    // This would typically search the database
    // For now, show a notification
    showNotification(`Searching for invoice: ${invoiceNumber}`, 'info');
    
    // Simulate search
    setTimeout(() => {
        const found = Math.random() > 0.3; // 70% chance of finding
        if (found) {
            const amount = Math.floor(Math.random() * 100000) + 10000;
            showNotification(`Found invoice ${invoiceNumber} - Amount: ${formatCurrency(amount)}`, 'success');
        } else {
            showNotification(`Invoice ${invoiceNumber} not found`, 'warning');
        }
    }, 1000);
}

// Initialize charts (if Chart.js is available)
function renderSalesChart(data) {
    if (!window.Chart || !elements.salesChart) return;
    
    const ctx = elements.salesChart.getContext('2d');
    
    // Destroy existing chart if it exists
    if (elements.salesChart.chart) {
        elements.salesChart.chart.destroy();
    }
    
    elements.salesChart.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales',
                data: data.values || [100000, 120000, 150000, 180000, 200000, 220000],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function renderExpenseChart(data) {
    if (!window.Chart || !elements.expenseChart) return;
    
    const ctx = elements.expenseChart.getContext('2d');
    
    // Destroy existing chart if it exists
    if (elements.expenseChart.chart) {
        elements.expenseChart.chart.destroy();
    }
    
    elements.expenseChart.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels || ['Office', 'Travel', 'Utilities', 'Marketing', 'Salaries'],
            datasets: [{
                data: data.values || [25000, 15000, 10000, 20000, 50000],
                backgroundColor: [
                    '#4361ee',
                    '#3a0ca3',
                    '#7209b7',
                    '#f72585',
                    '#4cc9f0'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update UI based on state
function updateUI() {
    // Update voice button
    if (elements.voiceBtn) {
        if (state.isVoiceActive) {
            elements.voiceBtn.classList.add('active');
            elements.voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Stop Voice</span>';
        } else {
            elements.voiceBtn.classList.remove('active');
            elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Voice Control</span>';
        }
    }
    
    // Update theme
    setTheme(state.currentTheme);
    
    // Update language
    if (elements.languageSelect) {
        elements.languageSelect.value = state.currentLanguage;
    }
}

// Add CSS for notifications, modals, etc.
const additionalStyles = `
    /* Notifications */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        z-index: 10000;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #4CAF50;
    }
    
    .notification-error {
        border-left: 4px solid #f44336;
    }
    
    .notification-warning {
        border-left: 4px solid #ff9800;
    }
    
    .notification-info {
        border-left: 4px solid #2196F3;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Loading Overlay */
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #4361ee;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }
    
    .modal-overlay.active {
        display: flex;
    }
    
    .modal {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #333;
    }
    
    .close-modal {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }
    
    /* Search Results */
    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-height: 400px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
    }
    
    .search-results.active {
        display: block;
    }
    
    .search-result-item {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .search-result-item:hover {
        background: #f8f9fa;
    }
    
    .search-result-icon {
        width: 40px;
        height: 40px;
        background: #f0f2ff;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4361ee;
    }
    
    .search-result-content {
        flex: 1;
    }
    
    .search-result-content h4 {
        margin: 0 0 0.25rem 0;
        color: #333;
    }
    
    .search-result-content p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .search-result-action {
        color: #666;
    }
    
    .no-results {
        padding: 2rem;
        text-align: center;
        color: #666;
    }
    
    /* Activity List */
    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        background: #f0f2ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4361ee;
    }
    
    .activity-content {
        flex: 1;
    }
    
    .activity-text {
        margin: 0 0 0.25rem 0;
        color: #333;
    }
    
    .activity-time {
        color: #666;
        font-size: 0.85rem;
    }
    
    .activity-amount {
        font-weight: 600;
    }
    
    .activity-amount.positive {
        color: #4CAF50;
    }
    
    .activity-amount.negative {
        color: #f44336;
    }
    
    /* GST Calculator */
    .gst-calculator {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .gst-result {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    
    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
    }
    
    .result-item:last-child {
        border-bottom: none;
        font-weight: bold;
        font-size: 1.1rem;
    }
    
    .result-subitem {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 1rem;
        color: #666;
        font-size: 0.9rem;
    }
    
    /* Voice Commands List */
    .voice-commands-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .voice-commands-list li {
        padding: 0.75rem 0;
        border-bottom: 1px solid #eee;
        color: #333;
    }
    
    .voice-commands-list li:last-child {
        border-bottom: none;
    }
    
    /* Dark Theme Adjustments */
    [data-theme="dark"] .notification {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .modal {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .modal-header {
        border-bottom-color: #4a5568;
    }
    
    [data-theme="dark"] .modal-footer {
        border-top-color: #4a5568;
    }
    
    [data-theme="dark"] .search-results {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .search-result-item:hover {
        background: #4a5568;
    }
    
    [data-theme="dark"] .activity-item {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .gst-result {
        background: #4a5568;
        color: #e2e8f0;
    }
    
    [data-theme="dark"] .result-item {
        border-bottom-color: #718096;
    }
    
    [data-theme="dark"] .voice-commands-list li {
        border-bottom-color: #4a5568;
        color: #e2e8f0;
    }
    
    /* Responsive Adjustments */
    @media (max-width: 768px) {
        .notification {
            left: 1rem;
            right: 1rem;
            max-width: none;
        }
        
        .modal {
            margin: 1rem;
        }
        
        .activity-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .activity-amount {
            align-self: flex-end;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Make functions available globally for other scripts
window.VoiceAccounting = {
    navigateTo,
    showNotification,
    calculateGST,
    openGSTCalculator,
    toggleVoiceControl,
    setLanguage,
    toggleTheme,
    logout
};