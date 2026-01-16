// Voice Accounting System - Frontend Application
class VoiceAccountingApp {
  constructor() {
    this.config = {
      voiceEnabled: true,
      currentLanguage: 'hi',
      businessType: 'retail',
      gstRegistered: true,
      theme: 'light',
      currency: '₹',
      decimalPlaces: 2,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      autoSave: true,
      notifications: true,
      soundEffects: true,
      voiceFeedback: true
    };
    
    this.modules = {};
    this.data = {};
    this.ui = {};
    this.socket = null;
    
    this.initialize();
  }

  async initialize() {
    console.log('🎤 Initializing Voice Accounting System...');
    
    // Load configuration
    await this.loadConfig();
    
    // Initialize modules
    await this.initializeModules();
    
    // Setup UI
    await this.setupUI();
    
    // Connect to server
    await this.connectToServer();
    
    // Load data
    await this.loadData();
    
    // Start voice assistant
    await this.startVoiceAssistant();
    
    console.log('✅ Voice Accounting System ready!');
    
    // Show welcome message
    this.showWelcome();
  }

  async loadConfig() {
    try {
      // Try to load saved config from localStorage
      const savedConfig = localStorage.getItem('voiceAccountingConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      
      // Set language
      document.documentElement.lang = this.config.currentLanguage;
      
      // Set theme
      document.body.classList.toggle('dark-theme', this.config.theme === 'dark');
      
      console.log('📝 Configuration loaded');
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  async initializeModules() {
    // Initialize all modules
    this.modules = {
      voice: new VoiceModule(this),
      accounting: new AccountingModule(this),
      gst: new GSTModule(this),
      inventory: new InventoryModule(this),
      reports: new ReportsModule(this),
      database: new DatabaseModule(this),
      ocr: new OCRModule(this),
      translator: new TranslatorModule(this)
    };
    
    // Initialize each module
    for (const [name, module] of Object.entries(this.modules)) {
      if (module.initialize) {
        await module.initialize();
        console.log(`✅ ${name} module initialized`);
      }
    }
  }

  async setupUI() {
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup voice controls
    this.setupVoiceControls();
    
    // Setup language selector
    this.setupLanguageSelector();
    
    // Setup theme toggle
    this.setupThemeToggle();
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup quick actions
    this.setupQuickActions();
    
    console.log('🎨 UI setup complete');
  }

  setupEventListeners() {
    // Voice control buttons
    document.getElementById('start-voice')?.addEventListener('click', () => this.startVoice());
    document.getElementById('stop-voice')?.addEventListener('click', () => this.stopVoice());
    
    // Language selector
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      langSelect.value = this.config.currentLanguage;
      langSelect.addEventListener('change', (e) => {
        this.changeLanguage(e.target.value);
      });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = this.config.theme === 'dark';
      themeToggle.addEventListener('change', (e) => {
        this.toggleTheme(e.target.checked ? 'dark' : 'light');
      });
    }
    
    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });
    
    // Form submissions
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(form);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
    
    // Window events
    window.addEventListener('beforeunload', () => {
      this.saveData();
    });
    
    console.log('🎯 Event listeners setup');
  }

  setupVoiceControls() {
    if (!this.config.voiceEnabled) return;
    
    // Voice feedback element
    this.voiceFeedback = document.getElementById('voice-feedback');
    this.commandResult = document.getElementById('command-result');
    
    // Voice commands help
    this.setupVoiceCommandsHelp();
    
    console.log('🎤 Voice controls setup');
  }

  setupVoiceCommandsHelp() {
    const commands = {
      hi: [
        { command: 'बिक्री दर्ज करो', description: 'नई बिक्री रिकॉर्ड करें' },
        { command: 'खर्च लिखो', description: 'नया खर्च रिकॉर्ड करें' },
        { command: 'बैलेंस बताओ', description: 'वर्तमान बैलेंस देखें' },
        { command: 'लाभ दिखाओ', description: 'लाभ/हानि रिपोर्ट देखें' },
        { command: 'जीएसटी कैलकुलेट करो', description: 'जीएसटी गणना करें' },
        { command: 'बिल बनाओ', description: 'नया बिल बनाएं' },
        { command: 'स्टॉक चेक करो', description: 'स्टॉक जानकारी देखें' },
        { command: 'ग्राहक जोड़ो', description: 'नया ग्राहक जोड़ें' }
      ],
      en: [
        { command: 'Record sale', description: 'Record a new sale' },
        { command: 'Record expense', description: 'Record a new expense' },
        { command: 'Show balance', description: 'View current balance' },
        { command: 'Show profit', description: 'View profit/loss report' },
        { command: 'Calculate GST', description: 'Calculate GST' },
        { command: 'Create invoice', description: 'Create new invoice' },
        { command: 'Check stock', description: 'View stock information' },
        { command: 'Add customer', description: 'Add new customer' }
      ]
    };
    
    const langCommands = commands[this.config.currentLanguage] || commands.hi;
    const helpElement = document.getElementById('voice-commands-help');
    
    if (helpElement) {
      helpElement.innerHTML = langCommands.map(cmd => `
        <div class="voice-command-item">
          <strong>${cmd.command}</strong>
          <span>${cmd.description}</span>
        </div>
      `).join('');
    }
  }

  setupLanguageSelector() {
    const languages = {
      hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
      en: { name: 'English', native: 'English', flag: '🇺🇸' },
      ta: { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
      te: { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
      bn: { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
      gu: { name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
      mr: { name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
      kn: { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
      ml: { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
      pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
    };
    
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      langSelect.innerHTML = Object.entries(languages).map(([code, lang]) => `
        <option value="${code}">
          ${lang.flag} ${lang.native} (${lang.name})
        </option>
      `).join('');
      langSelect.value = this.config.currentLanguage;
    }
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = this.config.theme === 'dark';
      
      // Update theme
      if (this.config.theme === 'dark') {
        document.body.classList.add('dark-theme');
      }
    }
  }

  setupNavigation() {
    // Handle navigation links
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('href');
        this.navigateTo(page);
      });
    });
    
    // Handle back button
    window.addEventListener('popstate', () => {
      this.loadPage(window.location.pathname);
    });
  }

  setupQuickActions() {
    const actions = [
      { id: 'quick-sale', icon: '💰', label: 'Quick Sale', action: 'quick_sale' },
      { id: 'quick-expense', icon: '💸', label: 'Quick Expense', action: 'quick_expense' },
      { id: 'check-balance', icon: '📊', label: 'Check Balance', action: 'check_balance' },
      { id: 'create-invoice', icon: '🧾', label: 'Create Invoice', action: 'create_invoice' },
      { id: 'calculate-gst', icon: '📋', label: 'Calculate GST', action: 'calculate_gst' },
      { id: 'view-reports', icon: '📈', label: 'View Reports', action: 'view_reports' }
    ];
    
    const quickActionsContainer = document.getElementById('quick-actions');
    if (quickActionsContainer) {
      quickActionsContainer.innerHTML = actions.map(action => `
        <button class="quick-action" data-action="${action.action}">
          <span class="action-icon">${action.icon}</span>
          <span class="action-label">${action.label}</span>
        </button>
      `).join('');
    }
  }

  async connectToServer() {
    try {
      // Connect via WebSocket
      this.socket = io();
      
      this.socket.on('connect', () => {
        console.log('🔌 Connected to server');
        this.showNotification('Connected to server', 'success');
      });
      
      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        this.showNotification('Disconnected from server', 'error');
      });
      
      this.socket.on('voice_response', (data) => {
        this.handleVoiceResponse(data);
      });
      
      this.socket.on('dashboard_update', (data) => {
        this.updateDashboard(data);
      });
      
      // Subscribe to updates
      this.socket.emit('subscribe', { channel: 'dashboard' });
      this.socket.emit('subscribe', { channel: 'notifications' });
      
    } catch (error) {
      console.error('Error connecting to server:', error);
      this.showNotification('Cannot connect to server', 'error');
    }
  }

  async loadData() {
    try {
      // Load data from server
      const responses = await Promise.all([
        this.apiCall('GET', '/api/accounting/balance'),
        this.apiCall('GET', '/api/accounting/recent-transactions'),
        this.apiCall('GET', '/api/gst/summary'),
        this.apiCall('GET', '/api/reports/overview')
      ]);
      
      this.data = {
        balance: responses[0],
        transactions: responses[1],
        gst: responses[2],
        reports: responses[3]
      };
      
      // Update UI with data
      this.updateUI();
      
      console.log('📊 Data loaded successfully');
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Load sample data for demo
      this.loadSampleData();
    }
  }

  loadSampleData() {
    this.data = {
      balance: {
        cash: 50000,
        bank: 250000,
        receivables: 75000,
        payables: 45000,
        total: 330000
      },
      transactions: [
        { id: 1, date: '2024-01-15', type: 'sale', amount: 15000, customer: 'Ram Singh' },
        { id: 2, date: '2024-01-14', type: 'expense', amount: 5000, category: 'Rent' },
        { id: 3, date: '2024-01-13', type: 'sale', amount: 8000, customer: 'Shyam Kumar' },
        { id: 4, date: '2024-01-12', type: 'purchase', amount: 12000, vendor: 'Wholesale Mart' }
      ],
      gst: {
        liability: 18000,
        itc: 9000,
        netPayable: 9000,
        dueDate: '2024-01-20'
      },
      reports: {
        salesThisMonth: 125000,
        expensesThisMonth: 45000,
        profitThisMonth: 80000,
        growth: 15.5
      }
    };
    
    this.updateUI();
    console.log('📝 Sample data loaded for demo');
  }

  updateUI() {
    // Update balance display
    this.updateBalanceDisplay();
    
    // Update transactions table
    this.updateTransactionsTable();
    
    // Update GST summary
    this.updateGSTSummary();
    
    // Update reports
    this.updateReports();
    
    // Update dashboard widgets
    this.updateDashboardWidgets();
  }

  updateBalanceDisplay() {
    const balanceElements = {
      'cash-balance': this.data.balance?.cash || 0,
      'bank-balance': this.data.balance?.bank || 0,
      'total-balance': this.data.balance?.total || 0,
      'receivables': this.data.balance?.receivables || 0,
      'payables': this.data.balance?.payables || 0
    };
    
    Object.entries(balanceElements).forEach(([id, amount]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.formatCurrency(amount);
      }
    });
  }

  updateTransactionsTable() {
    const table = document.getElementById('transactions-table');
    if (!table || !this.data.transactions) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = this.data.transactions.map(txn => `
      <tr>
        <td>${this.formatDate(txn.date)}</td>
        <td><span class="txn-type ${txn.type}">${txn.type}</span></td>
        <td>${txn.customer || txn.vendor || txn.category || 'N/A'}</td>
        <td class="${txn.type === 'sale' ? 'positive' : 'negative'}">
          ${this.formatCurrency(txn.amount)}
        </td>
        <td>
          <button class="btn-view" data-id="${txn.id}">View</button>
        </td>
      </tr>
    `).join('');
  }

  updateGSTSummary() {
    const gstElements = {
      'gst-liability': this.data.gst?.liability || 0,
      'gst-itc': this.data.gst?.itc || 0,
      'gst-payable': this.data.gst?.netPayable || 0,
      'gst-due-date': this.data.gst?.dueDate ? this.formatDate(this.data.gst.dueDate) : 'N/A'
    };
    
    Object.entries(gstElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (id.includes('date')) {
          element.textContent = value;
        } else {
          element.textContent = this.formatCurrency(value);
        }
      }
    });
  }

  updateReports() {
    const reportElements = {
      'sales-amount': this.data.reports?.salesThisMonth || 0,
      'expenses-amount': this.data.reports?.expensesThisMonth || 0,
      'profit-amount': this.data.reports?.profitThisMonth || 0,
      'growth-percentage': this.data.reports?.growth || 0
    };
    
    Object.entries(reportElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (id.includes('percentage')) {
          element.textContent = `${value}%`;
          element.className = value >= 0 ? 'positive' : 'negative';
        } else {
          element.textContent = this.formatCurrency(value);
        }
      }
    });
  }

  updateDashboardWidgets() {
    // Update charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
      this.updateCharts();
    }
    
    // Update recent activity
    this.updateRecentActivity();
    
    // Update alerts
    this.updateAlerts();
  }

  updateCharts() {
    // Sales chart
    const salesCtx = document.getElementById('sales-chart');
    if (salesCtx) {
      const salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Sales',
            data: [65000, 59000, 80000, 81000, 56000, 125000],
            borderColor: '#4CAF50',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
    
    // Expense chart
    const expenseCtx = document.getElementById('expense-chart');
    if (expenseCtx) {
      const expenseChart = new Chart(expenseCtx, {
        type: 'pie',
        data: {
          labels: ['Rent', 'Salary', 'Utilities', 'Marketing', 'Other'],
          datasets: [{
            data: [30000, 45000, 15000, 20000, 10000],
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  updateRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;
    
    const activities = [
      { time: '2 min ago', action: 'New sale recorded', amount: '₹5,000', icon: '💰' },
      { time: '15 min ago', action: 'Expense added', amount: '₹2,000', icon: '💸' },
      { time: '1 hour ago', action: 'Invoice created', amount: '₹8,500', icon: '🧾' },
      { time: '2 hours ago', action: 'Payment received', amount: '₹15,000', icon: '💳' },
      { time: '5 hours ago', action: 'GST calculated', amount: '₹1,800', icon: '📋' }
    ];
    
    activityContainer.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <span class="activity-icon">${activity.icon}</span>
        <div class="activity-details">
          <div class="activity-action">${activity.action}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
        <div class="activity-amount">${activity.amount}</div>
      </div>
    `).join('');
  }

  updateAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alerts = [
      { type: 'warning', message: 'GST filing due in 3 days', action: 'File Now' },
      { type: 'info', message: 'Low stock for 5 products', action: 'Check Stock' },
      { type: 'success', message: '2 payments received today', action: 'View' },
      { type: 'error', message: 'Bank reconciliation pending', action: 'Reconcile' }
    ];
    
    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="alert alert-${alert.type}">
        <div class="alert-message">${alert.message}</div>
        <button class="alert-action">${alert.action}</button>
      </div>
    `).join('');
  }

  async startVoiceAssistant() {
    if (!this.config.voiceEnabled) return;
    
    try {
      // Initialize voice recognition
      await this.modules.voice.initialize();
      
      // Speak welcome message
      this.speakWelcome();
      
      console.log('👂 Voice assistant started');
      
    } catch (error) {
      console.error('Error starting voice assistant:', error);
      this.showNotification('Voice assistant not available', 'warning');
    }
  }

  speakWelcome() {
    const welcomeMessages = {
      hi: 'नमस्ते! वॉइस अकाउंटिंग सिस्टम में आपका स्वागत है। आप आवाज से हिसाब किताब कर सकते हैं।',
      en: 'Welcome to Voice Accounting System! You can do accounting with your voice.',
      ta: 'வாய்ஸ் அக்கவுண்டிங் சிஸ்டத்திற்கு வரவேற்கிறோம்! நீங்கள் குரல் மூலம் கணக்கியலை செய்யலாம்.',
      te: 'వాయిస్ అకౌంటింగ్ సిస్టమ్కు స్వాగతం! మీరు మీ వాయిస్తో అకౌంటింగ్ చేయవచ్చు.'
    };
    
    const message = welcomeMessages[this.config.currentLanguage] || welcomeMessages.en;
    
    if (this.config.voiceFeedback) {
      this.speak(message);
    }
    
    this.showNotification(message, 'info');
  }

  showWelcome() {
    const welcomeHtml = `
      <div class="welcome-modal">
        <div class="welcome-content">
          <h1>🎤 Voice Accounting System</h1>
          <p class="welcome-subtitle">Complete Accounting Solution for Indian Businesses</p>
          
          <div class="welcome-features">
            <div class="feature">
              <span class="feature-icon">🗣️</span>
              <h3>Voice Commands</h3>
              <p>Speak in Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi</p>
            </div>
            
            <div class="feature">
              <span class="feature-icon">📊</span>
              <h3>Complete Accounting</h3>
              <p>Double-entry system with GST calculation and compliance</p>
            </div>
            
            <div class="feature">
              <span class="feature-icon">📱</span>
              <h3>Mobile Friendly</h3>
              <p>Works on all devices - mobile, tablet, desktop</p>
            </div>
            
            <div class="feature">
              <span class="feature-icon">🔒</span>
              <h3>Secure & Private</h3>
              <p>Your data stays on your device, no cloud required</p>
            </div>
          </div>
          
          <div class="welcome-actions">
            <button class="btn-primary" id="start-demo">🚀 Start Demo</button>
            <button class="btn-secondary" id="skip-demo">Skip to Dashboard</button>
          </div>
          
          <div class="welcome-tips">
            <p><strong>Tip:</strong> Say "बिक्री दर्ज करो" or "Record sale" to start</p>
            <p><strong>Tip:</strong> Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> for voice commands</p>
          </div>
        </div>
      </div>
    `;
    
    // Only show welcome on first visit
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      document.body.insertAdjacentHTML('beforeend', welcomeHtml);
      
      document.getElementById('start-demo')?.addEventListener('click', () => {
        this.startDemo();
        this.closeWelcome();
      });
      
      document.getElementById('skip-demo')?.addEventListener('click', () => {
        this.closeWelcome();
      });
      
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }

  closeWelcome() {
    const welcomeModal = document.querySelector('.welcome-modal');
    if (welcomeModal) {
      welcomeModal.remove();
    }
  }

  startDemo() {
    this.showNotification('Starting demo mode...', 'info');
    
    // Load demo data
    this.loadSampleData();
    
    // Start voice demo
    this.startVoiceDemo();
  }

  startVoiceDemo() {
    if (!this.config.voiceEnabled) return;
    
    const demoCommands = [
      { delay: 1000, command: 'बिक्री दर्ज करो', language: 'hi' },
      { delay: 3000, command: 'बैलेंस बताओ', language: 'hi' },
      { delay: 5000, command: 'जीएसटी कैलकुलेट करो', language: 'hi' },
      { delay: 7000, command: 'Record sale', language: 'en' }
    ];
    
    demoCommands.forEach(({ delay, command, language }) => {
      setTimeout(() => {
        this.processVoiceCommand(command, language);
      }, delay);
    });
  }

  async startVoice() {
    if (!this.modules.voice) return;
    
    try {
      await this.modules.voice.startListening();
      this.showVoiceFeedback('Listening...', 'listening');
      this.showNotification('Voice recording started', 'info');
      
    } catch (error) {
      console.error('Error starting voice:', error);
      this.showNotification('Cannot start voice recording', 'error');
    }
  }

  stopVoice() {
    if (!this.modules.voice) return;
    
    this.modules.voice.stopListening();
    this.showVoiceFeedback('Ready', 'ready');
    this.showNotification('Voice recording stopped', 'info');
  }

  async processVoiceCommand(command, language = null) {
    const lang = language || this.config.currentLanguage;
    
    console.log(`🎤 Processing voice command (${lang}): ${command}`);
    
    // Show command feedback
    this.showVoiceFeedback(command, 'processing');
    
    try {
      // Send to server via WebSocket
      if (this.socket?.connected) {
        this.socket.emit('voice_command', {
          command: command,
          language: lang,
          timestamp: new Date()
        });
      } else {
        // Fallback to API call
        const response = await this.apiCall('POST', '/api/voice/process', {
          command: command,
          language: lang
        });
        
        this.handleVoiceResponse(response);
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      this.showVoiceFeedback('Error processing command', 'error');
      this.showNotification('Command failed', 'error');
    }
  }

  handleVoiceResponse(response) {
    console.log('Voice response:', response);
    
    // Show result
    this.showVoiceFeedback(response.result?.response || 'Command executed', 'success');
    
    // Play sound if enabled
    if (this.config.soundEffects) {
      this.playSound('success');
    }
    
    // Update data if needed
    if (response.result?.type === 'sale' || response.result?.type === 'expense') {
      this.loadData(); // Reload data
    }
    
    // Show notification
    this.showNotification(response.result?.response || 'Command completed', 'success');
  }

  showVoiceFeedback(text, status) {
    if (!this.voiceFeedback) return;
    
    this.voiceFeedback.textContent = text;
    this.voiceFeedback.className = `voice-feedback voice-${status}`;
    
    // Auto-hide after 5 seconds
    if (status === 'success') {
      setTimeout(() => {
        this.voiceFeedback.textContent = 'Say something...';
        this.voiceFeedback.className = 'voice-feedback voice-ready';
      }, 5000);
    }
  }

  handleQuickAction(action) {
    const actions = {
      quick_sale: () => this.openQuickSale(),
      quick_expense: () => this.openQuickExpense(),
      check_balance: () => this.showBalance(),
      create_invoice: () => this.createInvoice(),
      calculate_gst: () => this.calculateGST(),
      view_reports: () => this.viewReports()
    };
    
    if (actions[action]) {
      actions[action]();
    }
  }

  openQuickSale() {
    const amount = prompt('Enter sale amount:');
    if (amount && !isNaN(amount)) {
      this.processVoiceCommand(`${amount} रुपये की बिक्री दर्ज करो`, 'hi');
    }
  }

  openQuickExpense() {
    const amount = prompt('Enter expense amount:');
    if (amount && !isNaN(amount)) {
      this.processVoiceCommand(`${amount} रुपये का खर्च लिखो`, 'hi');
    }
  }

  showBalance() {
    this.processVoiceCommand('बैलेंस बताओ', 'hi');
  }

  createInvoice() {
    this.navigateTo('/invoice');
  }

  calculateGST() {
    const amount = prompt('Enter amount for GST calculation:');
    if (amount && !isNaN(amount)) {
      this.processVoiceCommand(`${amount} रुपये पर जीएसटी कैलकुलेट करो`, 'hi');
    }
  }

  viewReports() {
    this.navigateTo('/reports');
  }

  async handleFormSubmit(form) {
    const formId = form.id;
    const formData = new FormData(form);
    
    console.log(`Submitting form: ${formId}`);
    
    try {
      let response;
      
      switch (formId) {
        case 'sale-form':
          response = await this.submitSale(formData);
          break;
        case 'expense-form':
          response = await this.submitExpense(formData);
          break;
        case 'invoice-form':
          response = await this.submitInvoice(formData);
          break;
        case 'gst-form':
          response = await this.submitGST(formData);
          break;
        default:
          response = { success: false, error: 'Unknown form' };
      }
      
      if (response.success) {
        this.showNotification('Form submitted successfully', 'success');
        form.reset();
        
        // Reload data
        this.loadData();
      } else {
        this.showNotification(response.error || 'Form submission failed', 'error');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showNotification('Form submission failed', 'error');
    }
  }

  async submitSale(formData) {
    const saleData = {
      amount: parseFloat(formData.get('amount')),
      customer: formData.get('customer'),
      description: formData.get('description'),
      date: formData.get('date') || new Date().toISOString().split('T')[0]
    };
    
    return await this.apiCall('POST', '/api/accounting/transaction', {
      type: 'sale',
      ...saleData
    });
  }

  async submitExpense(formData) {
    const expenseData = {
      amount: parseFloat(formData.get('amount')),
      category: formData.get('category'),
      description: formData.get('description'),
      date: formData.get('date') || new Date().toISOString().split('T')[0]
    };
    
    return await this.apiCall('POST', '/api/accounting/transaction', {
      type: 'expense',
      ...expenseData
    });
  }

  async submitInvoice(formData) {
    const invoiceData = {
      customer: formData.get('customer'),
      items: JSON.parse(formData.get('items') || '[]'),
      discount: parseFloat(formData.get('discount') || 0),
      tax: parseFloat(formData.get('tax') || 0)
    };
    
    return await this.apiCall('POST', '/api/accounting/invoice', invoiceData);
  }

  async submitGST(formData) {
    const gstData = {
      period: formData.get('period'),
      sales: parseFloat(formData.get('sales') || 0),
      purchases: parseFloat(formData.get('purchases') || 0),
      itc: parseFloat(formData.get('itc') || 0)
    };
    
    return await this.apiCall('POST', '/api/gst/file', gstData);
  }

  handleKeyboardShortcut(event) {
    // Ctrl + Space for voice
    if (event.ctrlKey && event.code === 'Space') {
      event.preventDefault();
      this.startVoice();
    }
    
    // Escape to stop voice
    if (event.code === 'Escape') {
      this.stopVoice();
    }
    
    // Ctrl + S to save
    if (event.ctrlKey && event.code === 'KeyS') {
      event.preventDefault();
      this.saveData();
    }
    
    // Ctrl + L to change language
    if (event.ctrlKey && event.code === 'KeyL') {
      event.preventDefault();
      this.cycleLanguage();
    }
  }

  cycleLanguage() {
    const languages = ['hi', 'en', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'pa'];
    const currentIndex = languages.indexOf(this.config.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.changeLanguage(languages[nextIndex]);
  }

  async changeLanguage(language) {
    this.config.currentLanguage = language;
    document.documentElement.lang = language;
    
    // Save config
    this.saveConfig();
    
    // Update UI texts
    this.updateLanguageTexts();
    
    // Speak confirmation
    if (this.config.voiceFeedback) {
      const messages = {
        hi: 'भाषा हिन्दी में बदल गई',
        en: 'Language changed to English',
        ta: 'மொழி தமிழாக மாற்றப்பட்டது',
        te: 'భాష తెలుగుగా మార్చబడింది',
        bn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে',
        gu: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ',
        mr: 'भाषा मराठीमध्ये बदलली',
        kn: 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿತು',
        ml: 'ഭാഷ മലയാളമായി മാറ്റി',
        pa: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲ ਗਈ'
      };
      
      this.speak(messages[language] || 'Language changed');
    }
    
    this.showNotification(`Language changed to ${language}`, 'info');
  }

  updateLanguageTexts() {
    // This would update all text elements based on language
    // For now, just update the voice commands help
    this.setupVoiceCommandsHelp();
  }

  toggleTheme(theme = null) {
    this.config.theme = theme || (this.config.theme === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', this.config.theme === 'dark');
    
    // Save config
    this.saveConfig();
    
    this.showNotification(`Theme changed to ${this.config.theme}`, 'info');
  }

  navigateTo(page) {
    // Update URL without reload
    history.pushState(null, '', page);
    
    // Load page content
    this.loadPage(page);
  }

  async loadPage(page) {
    try {
      // Show loading
      this.showLoading();
      
      // Fetch page
      const response = await fetch(page);
      const html = await response.text();
      
      // Parse and insert content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = doc.querySelector('main') || doc.body;
      
      // Update main content
      const main = document.querySelector('main');
      if (main) {
        main.innerHTML = content.innerHTML;
      } else {
        document.body.innerHTML = content.innerHTML;
      }
      
      // Re-initialize UI for new page
      this.setupUI();
      
      // Hide loading
      this.hideLoading();
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.showNotification('Error loading page', 'error');
    }
  }

  showLoading() {
    const loadingHtml = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
  }

  hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  async apiCall(method, url, data = null) {
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  speak(text) {
    if (!this.config.voiceFeedback || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = `${this.config.currentLanguage}-IN`;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    speechSynthesis.speak(utterance);
  }

  playSound(type) {
    if (!this.config.soundEffects) return;
    
    const audio = new Audio();
    
    switch (type) {
      case 'success':
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='; // Simple beep
        break;
      case 'error':
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        break;
      case 'notification':
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        break;
    }
    
    audio.play().catch(console.error);
  }

  showNotification(message, type = 'info') {
    if (!this.config.notifications) return;
    
    const notificationHtml = `
      <div class="notification notification-${type}">
        <div class="notification-content">
          <span class="notification-icon">${this.getNotificationIcon(type)}</span>
          <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    const notification = document.createElement('div');
    notification.innerHTML = notificationHtml;
    document.body.appendChild(notification.firstElementChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.firstElementChild?.remove();
    }, 5000);
    
    // Close button
    notification.firstElementChild?.querySelector('.notification-close')?.addEventListener('click', () => {
      notification.firstElementChild?.remove();
    });
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return icons[type] || 'ℹ️';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: this.config.decimalPlaces,
      maximumFractionDigits: this.config.decimalPlaces
    }).format(amount);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  saveConfig() {
    try {
      localStorage.setItem('voiceAccountingConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  saveData() {
    try {
      // Save current state
      const state = {
        config: this.config,
        data: this.data,
        timestamp: new Date()
      };
      
      localStorage.setItem('voiceAccountingState', JSON.stringify(state));
      console.log('💾 Data saved');
      
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  loadSavedData() {
    try {
      const saved = localStorage.getItem('voiceAccountingState');
      if (saved) {
        const state = JSON.parse(saved);
        this.config = { ...this.config, ...state.config };
        this.data = state.data;
        console.log('📂 Saved data loaded');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }
}

// Voice Module
class VoiceModule {
  constructor(app) {
    this.app = app;
    this.recognition = null;
    this.isListening = false;
  }

  async initialize() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = `${this.app.config.currentLanguage}-IN`;
    
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      if (event.results[0].isFinal) {
        this.app.processVoiceCommand(transcript);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.app.showNotification('Voice recognition error', 'error');
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.app.showVoiceFeedback('Ready', 'ready');
    };
    
    return true;
  }

  startListening() {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      throw error;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.VoiceAccounting = new VoiceAccountingApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceAccountingApp, VoiceModule };
}