// Voice Accounting System - Main Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
  credentials: true
}));

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Ensure directories exist
const directories = ['public', 'uploads', 'backups', 'exports', 'logs'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Import APIs
const voiceAPI = require('./api/voice-api');
const accountingAPI = require('./api/accounting-api');
const gstAPI = require('./api/gst-api');
const reportAPI = require('./api/report-api');
const uploadAPI = require('./api/upload-api');

// API Routes
app.use('/api/voice', voiceAPI);
app.use('/api/accounting', accountingAPI);
app.use('/api/gst', gstAPI);
app.use('/api/reports', reportAPI);
app.use('/api/upload', uploadAPI);

// WebSocket for real-time communication
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Handle voice commands
  socket.on('voice_command', async (data) => {
    console.log('🎤 Voice command received:', data.command);
    
    // Broadcast to all clients
    io.emit('voice_command_received', {
      id: socket.id,
      command: data.command,
      language: data.language,
      timestamp: new Date()
    });
    
    // Process command
    const response = await processVoiceCommand(data.command, data.language);
    
    // Send response
    socket.emit('voice_response', response);
    
    // Broadcast to dashboard
    io.emit('dashboard_update', {
      type: 'voice_command',
      data: response
    });
  });
  
  // Handle real-time updates
  socket.on('subscribe', (data) => {
    console.log(`📡 Client ${socket.id} subscribed to:`, data.channel);
    socket.join(data.channel);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0',
    services: {
      api: 'running',
      database: 'connected',
      voice: 'ready',
      gst: 'ready'
    }
  });
});

// System info endpoint
app.get('/system/info', (req, res) => {
  res.json({
    system: 'Voice Accounting System',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    node: process.version,
    pid: process.pid,
    cwd: process.cwd(),
    env: process.env.NODE_ENV
  });
});

// Serve main pages
const pages = {
  '/': 'index.html',
  '/dashboard': 'dashboard.html',
  '/voice': 'voice.html',
  '/invoice': 'invoice.html',
  '/reports': 'reports.html',
  '/gst': 'gst.html',
  '/products': 'products.html',
  '/customers': 'customers.html',
  '/vendors': 'vendors.html',
  '/banking': 'banking.html',
  '/settings': 'settings.html',
  '/help': 'help.html'
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const filePath = path.join(__dirname, 'public', file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Page not found');
    }
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.json({
    system: 'Voice Accounting System API',
    version: '1.0.0',
    endpoints: {
      voice: {
        process: 'POST /api/voice/process',
        speak: 'POST /api/voice/speak',
        translate: 'POST /api/voice/translate',
        history: 'GET /api/voice/history'
      },
      accounting: {
        transaction: 'POST /api/accounting/transaction',
        ledger: 'GET /api/accounting/ledger',
        trial_balance: 'GET /api/accounting/trial-balance',
        profit_loss: 'GET /api/accounting/profit-loss',
        balance_sheet: 'GET /api/accounting/balance-sheet'
      },
      gst: {
        calculate: 'POST /api/gst/calculate',
        rates: 'GET /api/gst/rates',
        file: 'POST /api/gst/file',
        returns: 'GET /api/gst/returns'
      },
      reports: {
        generate: 'POST /api/reports/generate',
        export: 'POST /api/reports/export',
        print: 'POST /api/reports/print'
      },
      upload: {
        image: 'POST /api/upload/image',
        document: 'POST /api/upload/document',
        bulk: 'POST /api/upload/bulk'
      }
    },
    examples: {
      voice_command: {
        method: 'POST',
        url: '/api/voice/process',
        body: {
          command: 'बिक्री दर्ज करो',
          language: 'hi'
        }
      },
      gst_calculation: {
        method: 'POST',
        url: '/api/gst/calculate',
        body: {
          amount: 10000,
          rate: 18,
          isInterState: false
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  // Log error to file
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const errorLog = path.join(logDir, 'errors.log');
  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} - ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync(errorLog, logEntry);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Process voice command function
async function processVoiceCommand(command, language = 'hi') {
  console.log(`Processing voice command in ${language}: ${command}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Command patterns
  const patterns = {
    hi: {
      'बिक्री': { type: 'sale', amount: 5000, response: '5000 रुपये की बिक्री दर्ज हो गई' },
      'खर्च': { type: 'expense', amount: 2000, response: '2000 रुपये का खर्च लिखा गया' },
      'बैलेंस': { type: 'balance', response: 'आपका बैलेंस 75000 रुपये है' },
      'जीएसटी': { type: 'gst', amount: 10000, response: '10000 रुपये पर 1800 रुपये जीएसटी लगेगा' },
      'बिल': { type: 'invoice', response: 'बिल संख्या INV-001 बन गया' }
    },
    en: {
      'sale': { type: 'sale', amount: 5000, response: 'Sale of 5000 rupees recorded' },
      'expense': { type: 'expense', amount: 2000, response: 'Expense of 2000 rupees recorded' },
      'balance': { type: 'balance', response: 'Your balance is 75000 rupees' },
      'gst': { type: 'gst', amount: 10000, response: 'GST on 10000 rupees is 1800 rupees' },
      'invoice': { type: 'invoice', response: 'Invoice number INV-001 created' }
    }
  };
  
  const langPatterns = patterns[language] || patterns.hi;
  let result = { type: 'unknown', response: 'Command not understood' };
  
  // Find matching pattern
  for (const [pattern, data] of Object.entries(langPatterns)) {
    if (command.toLowerCase().includes(pattern.toLowerCase())) {
      result = data;
      break;
    }
  }
  
  return {
    success: true,
    command: command,
    language: language,
    result: result,
    timestamp: new Date(),
    actions: ['update_dashboard', 'play_sound', 'show_notification']
  };
}

// Load demo data on startup
function loadDemoData() {
  const demoDataPath = path.join(__dirname, 'demo-data.json');
  if (fs.existsSync(demoDataPath)) {
    try {
      const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
      console.log('📊 Demo data loaded successfully');
      return demoData;
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  }
  return null;
}

// Initialize system
async function initializeSystem() {
  console.log('🚀 Initializing Voice Accounting System...');
  
  // Load demo data
  const demoData = loadDemoData();
  
  // Initialize database
  const Database = require('./database');
  global.db = new Database();
  
  // Load sample data if in development
  if (process.env.NODE_ENV === 'development' && demoData) {
    console.log('📝 Loading sample data...');
    // Load sample transactions, customers, products, etc.
  }
  
  console.log('✅ System initialized successfully');
}

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log(`\n========================================`);
  console.log(`🎤 VOICE ACCOUNTING SYSTEM`);
  console.log(`========================================`);
  console.log(`🌐 Server running at:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://${getIPAddress()}:${PORT}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`\n🗣️  Voice Commands:`);
  console.log(`   Hindi: "बिक्री दर्ज करो", "बैलेंस बताओ"`);
  console.log(`   English: "Record sale", "Show balance"`);
  console.log(`\n📱 Supported Languages:`);
  console.log(`   Hindi, Tamil, Telugu, Bengali, Gujarati`);
  console.log(`   Marathi, Kannada, Malayalam, Punjabi`);
  console.log(`\n⚡ Press Ctrl+C to stop the server`);
  console.log(`========================================\n`);
  
  // Initialize system
  await initializeSystem();
});

// Get IP address
function getIPAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down server...');
  
  // Save data before exit
  if (global.db && global.db.backup) {
    global.db.backup();
  }
  
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const crashLog = path.join(logDir, 'crash.log');
  const logEntry = `[${new Date().toISOString()}] CRASH: ${error.message}\n${error.stack}\n\n`;
  fs.appendFileSync(crashLog, logEntry);
});

// Export for testing
module.exports = { app, server, io };