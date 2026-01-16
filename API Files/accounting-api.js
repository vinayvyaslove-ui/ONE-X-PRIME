const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Invoice, Expense } = require('../database');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// User registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, businessName, phone } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Create new user
        const user = new User({
            name,
            email,
            password,
            businessName,
            phone,
            createdAt: new Date()
        });
        
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                preferredLanguage: user.preferredLanguage
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const updates = req.body;
        
        // Remove sensitive fields
        delete updates.password;
        delete updates._id;
        
        Object.keys(updates).forEach(key => {
            req.user[key] = updates[key];
        });
        
        await req.user.save();
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: req.user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Invoice management routes
router.post('/invoices', authenticate, async (req, res) => {
    try {
        const invoiceData = req.body;
        invoiceData.user = req.user._id;
        
        // Generate invoice number
        const lastInvoice = await Invoice.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });
        
        let invoiceNumber = 'INV-00001';
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
            invoiceNumber = `INV-${(lastNumber + 1).toString().padStart(5, '0')}`;
        }
        
        invoiceData.invoiceNumber = invoiceNumber;
        
        const invoice = new Invoice(invoiceData);
        await invoice.save();
        
        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice
        });
    } catch (error) {
        console.error('Invoice creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating invoice'
        });
    }
});

router.get('/invoices', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        
        const query = { user: req.user._id };
        
        if (status) {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } }
            ];
        }
        
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Invoice.countDocuments(query);
        
        res.json({
            success: true,
            invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Invoices fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoices'
        });
    }
});

module.exports = router;