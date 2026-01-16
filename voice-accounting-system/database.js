const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    businessName: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    preferredLanguage: {
        type: String,
        default: 'en'
    },
    voiceCommandsEnabled: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true },
        autoSave: { type: Boolean, default: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        name: String,
        email: String,
        phone: String,
        address: String,
        gstNumber: String
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number,
        gstRate: Number,
        gstAmount: Number,
        totalAmount: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    gstDetails: {
        cgst: Number,
        sgst: Number,
        igst: Number,
        totalGst: Number
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    paymentTerms: String,
    dueDate: Date,
    paymentDate: Date,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// GST Transaction Schema
const gstTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sale', 'purchase', 'expense'],
        required: true
    },
    invoiceNumber: String,
    partyName: String,
    gstNumber: String,
    amount: Number,
    gstRate: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    totalGst: Number,
    totalAmount: Number,
    date: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    notes: String,
    attachments: [String]
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['office', 'travel', 'utilities', 'salaries', 'marketing', 'other'],
        required: true
    },
    description: String,
    amount: Number,
    gstApplicable: Boolean,
    gstAmount: Number,
    totalAmount: Number,
    date: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank', 'credit_card', 'online'],
        default: 'bank'
    },
    vendor: String,
    invoiceNumber: String,
    attachments: [String],
    notes: String
});

// Report Schema
const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sales', 'expenses', 'gst', 'profit_loss', 'cash_flow'],
        required: true
    },
    period: {
        startDate: Date,
        endDate: Date
    },
    data: mongoose.Schema.Types.Mixed,
    generatedAt: {
        type: Date,
        default: Date.now
    },
    format: {
        type: String,
        enum: ['pdf', 'excel', 'html'],
        default: 'html'
    }
});

// Voice Command Log Schema
const voiceCommandLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    command: String,
    transcript: String,
    language: String,
    success: Boolean,
    response: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create models
const User = mongoose.model('User', userSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const GSTTransaction = mongoose.model('GSTTransaction', gstTransactionSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Report = mongoose.model('Report', reportSchema);
const VoiceCommandLog = mongoose.model('VoiceCommandLog', voiceCommandLogSchema);

module.exports = {
    User,
    Invoice,
    GSTTransaction,
    Expense,
    Report,
    VoiceCommandLog,
    mongoose
};