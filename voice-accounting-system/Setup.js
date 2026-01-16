const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database models
const { User, Invoice, GSTTransaction } = require('./database');

// Sample data
const sampleData = require('./demo-data.json');

async function setupDatabase() {
    console.log('Setting up database...');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-accounting', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await User.deleteMany({});
        await Invoice.deleteMany({});
        await GSTTransaction.deleteMany({});
        console.log('Cleared existing data');
        
        // Create admin user
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@voiceaccounting.com',
            password: hashedPassword,
            businessName: 'Voice Accounting Solutions',
            phone: '+91 9876543210',
            gstNumber: '29ABCDE1234F1Z5',
            address: {
                street: '123 Tech Park',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
                country: 'India'
            },
            role: 'admin',
            voiceCommandsEnabled: true,
            preferredLanguage: 'en',
            settings: {
                theme: 'light',
                notifications: true,
                autoSave: true
            }
        });
        
        await adminUser.save();
        console.log('Admin user created:');
        console.log(`Email: admin@voiceaccounting.com`);
        console.log(`Password: ${adminPassword}`);
        
        // Create demo user
        const demoPassword = 'demo123';
        const demoHashedPassword = await bcrypt.hash(demoPassword, 10);
        
        const demoUser = new User({
            name: 'Demo User',
            email: 'demo@voiceaccounting.com',
            password: demoHashedPassword,
            businessName: 'Demo Business',
            phone: '+91 9876543211',
            gstNumber: '27ABCDE1234F1Z6',
            address: {
                street: '456 Demo Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India'
            },
            role: 'user',
            voiceCommandsEnabled: true,
            preferredLanguage: 'en',
            settings: {
                theme: 'dark',
                notifications: true,
                autoSave: false
            }
        });
        
        await demoUser.save();
        console.log('\nDemo user created:');
        console.log(`Email: demo@voiceaccounting.com`);
        console.log(`Password: ${demoPassword}`);
        
        // Create sample invoices for demo user
        console.log('\nCreating sample invoices...');
        for (const invoiceData of sampleData.invoices) {
            const invoice = new Invoice({
                ...invoiceData,
                user: demoUser._id
            });
            await invoice.save();
        }
        console.log('Sample invoices created');
        
        // Create sample GST transactions
        console.log('Creating sample GST transactions...');
        for (const transactionData of sampleData.gstTransactions) {
            const transaction = new GSTTransaction({
                ...transactionData,
                user: demoUser._id
            });
            await transaction.save();
        }
        console.log('Sample GST transactions created');
        
        // Create configuration files if they don't exist
        console.log('\nCreating configuration files...');
        
        const configDir = path.join(__dirname, 'config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        // GST Rates
        const gstRates = {
            "rates": [
                {
                    "category": "Goods",
                    "items": [
                        { "name": "Food Items", "rate": 0, "description": "Essential food items" },
                        { "name": "Books", "rate": 0, "description": "Printed books" },
                        { "name": "Mobile Phones", "rate": 18, "description": "Mobile phones and accessories" },
                        { "name": "Electronics", "rate": 18, "description": "Electronic goods" },
                        { "name": "Clothing", "rate": 5, "description": "Clothing below ₹1000" },
                        { "name": "Luxury Items", "rate": 28, "description": "Luxury goods" }
                    ]
                },
                {
                    "category": "Services",
                    "items": [
                        { "name": "Restaurant Services", "rate": 5, "description": "Non-AC restaurants" },
                        { "name": "Hotel Services", "rate": 12, "description": "Hotel rooms below ₹7500" },
                        { "name": "IT Services", "rate": 18, "description": "Software and IT services" },
                        { "name": "Consultancy", "rate": 18, "description": "Professional services" },
                        { "name": "Telecom", "rate": 18, "description": "Telecommunication services" },
                        { "name": "Financial Services", "rate": 18, "description": "Banking and financial services" }
                    ]
                }
            ],
            "calculationMethods": {
                "cgst_sgst": {
                    "name": "CGST + SGST",
                    "description": "For intra-state transactions",
                    "split": [9, 9]
                },
                "igst": {
                    "name": "IGST",
                    "description": "For inter-state transactions",
                    "split": [18]
                }
            }
        };
        
        fs.writeFileSync(
            path.join(configDir, 'gst-rates.json'),
            JSON.stringify(gstRates, null, 2)
        );
        
        // Voice Commands
        const voiceCommands = {
            "accounting": [
                {
                    "type": "create_invoice",
                    "keywords": ["create invoice", "new invoice", "make invoice", "generate invoice"],
                    "action": "createInvoice",
                    "description": "Create a new invoice"
                },
                {
                    "type": "view_invoices",
                    "keywords": ["show invoices", "view invoices", "list invoices", "get invoices"],
                    "action": "viewInvoices",
                    "description": "View all invoices"
                },
                {
                    "type": "add_expense",
                    "keywords": ["add expense", "record expense", "log expense", "enter expense"],
                    "action": "addExpense",
                    "description": "Add a new expense"
                }
            ],
            "reports": [
                {
                    "type": "view_report",
                    "keywords": ["show report", "view report", "generate report", "get report"],
                    "action": "viewReport",
                    "description": "View financial reports"
                },
                {
                    "type": "gst_report",
                    "keywords": ["gst report", "gst filing", "gst summary", "tax report"],
                    "action": "gstReport",
                    "description": "View GST report"
                },
                {
                    "type": "profit_loss",
                    "keywords": ["profit loss", "income statement", "financial statement", "p&l"],
                    "action": "profitLoss",
                    "description": "View profit and loss statement"
                }
            ],
            "calculations": [
                {
                    "type": "calculate_gst",
                    "keywords": ["calculate gst", "gst calculation", "compute gst", "find gst"],
                    "action": "calculateGST",
                    "description": "Calculate GST amount",
                    "parameters": {
                        "amount": ["\\d+", "rupees \\d+", "amount \\d+"]
                    }
                },
                {
                    "type": "convert_currency",
                    "keywords": ["convert currency", "exchange rate", "currency conversion"],
                    "action": "convertCurrency",
                    "description": "Convert between currencies"
                }
            ],
            "navigation": [
                {
                    "type": "go_to_dashboard",
                    "keywords": ["dashboard", "main screen", "home", "go home"],
                    "action": "goToDashboard",
                    "description": "Go to dashboard"
                },
                {
                    "type": "open_settings",
                    "keywords": ["settings", "preferences", "configuration", "setup"],
                    "action": "openSettings",
                    "description": "Open settings"
                },
                {
                    "type": "help",
                    "keywords": ["help", "what can you do", "commands", "tutorial"],
                    "action": "showHelp",
                    "description": "Show help and available commands"
                }
            ]
        };
        
        fs.writeFileSync(
            path.join(configDir, 'commands.json'),
            JSON.stringify(voiceCommands, null, 2)
        );
        
        // Languages
        const languages = {
            "en": {
                "name": "English",
                "nativeName": "English",
                "code": "en",
                "direction": "ltr"
            },
            "hi": {
                "name": "Hindi",
                "nativeName": "हिन्दी",
                "code": "hi",
                "direction": "ltr"
            },
            "ta": {
                "name": "Tamil",
                "nativeName": "தமிழ்",
                "code": "ta",
                "direction": "ltr"
            },
            "te": {
                "name": "Telugu",
                "nativeName": "తెలుగు",
                "code": "te",
                "direction": "ltr"
            },
            "bn": {
                "name": "Bengali",
                "nativeName": "বাংলা",
                "code": "bn",
                "direction": "ltr"
            }
        };
        
        fs.writeFileSync(
            path.join(configDir, 'languages.json'),
            JSON.stringify(languages, null, 2)
        );
        
        console.log('Configuration files created');
        console.log('\nSetup completed successfully!');
        console.log('\nYou can now:');
        console.log('1. Start the application: npm start');
        console.log('2. Login with admin credentials');
        console.log('3. Explore the demo data');
        
        process.exit(0);
        
    } catch (error) {
        console.error('Setup error:', error);
        process.exit(1);
    }
}

setupDatabase();