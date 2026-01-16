const express = require('express');
const router = express.Router();
const { VoiceCommandLog } = require('../database');
const voiceCommands = require('../config/commands.json');
const languageTranslator = require('../language-translator');

// Process voice command
router.post('/process', async (req, res) => {
    try {
        const { transcript, language, userId } = req.body;
        
        if (!transcript) {
            return res.status(400).json({
                success: false,
                message: 'No transcript provided'
            });
        }

        // Translate to English if needed
        let processedTranscript = transcript;
        if (language !== 'en') {
            processedTranscript = await languageTranslator.translate(transcript, language, 'en');
        }

        // Process command
        const command = identifyCommand(processedTranscript);
        const response = await executeCommand(command, userId);

        // Log command
        const log = new VoiceCommandLog({
            user: userId,
            command: command?.type || 'unknown',
            transcript,
            language,
            success: !!command,
            response: response.message
        });
        await log.save();

        res.json({
            success: true,
            command,
            response,
            originalTranscript: transcript,
            processedTranscript
        });
    } catch (error) {
        console.error('Voice processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing voice command'
        });
    }
});

// Get command history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, page = 1 } = req.query;
        
        const commands = await VoiceCommandLog.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await VoiceCommandLog.countDocuments({ user: userId });
        
        res.json({
            success: true,
            commands,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching command history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching command history'
        });
    }
});

// Get available commands
router.get('/commands', (req, res) => {
    res.json({
        success: true,
        commands: voiceCommands
    });
});

function identifyCommand(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    for (const [category, commands] of Object.entries(voiceCommands)) {
        for (const command of commands) {
            for (const keyword of command.keywords) {
                if (lowerTranscript.includes(keyword)) {
                    return {
                        type: command.type,
                        category,
                        action: command.action,
                        parameters: extractParameters(transcript, command.parameters)
                    };
                }
            }
        }
    }
    
    return null;
}

function extractParameters(transcript, parameterPatterns) {
    const parameters = {};
    
    if (parameterPatterns) {
        for (const [param, patterns] of Object.entries(parameterPatterns)) {
            for (const pattern of patterns) {
                const match = transcript.match(new RegExp(pattern, 'i'));
                if (match) {
                    parameters[param] = match[1] || match[0];
                    break;
                }
            }
        }
    }
    
    return parameters;
}

async function executeCommand(command, userId) {
    if (!command) {
        return { message: 'Command not recognized. Please try again.' };
    }

    try {
        // Implement command execution logic
        switch (command.type) {
            case 'create_invoice':
                return { message: 'Opening invoice creation form...' };
            case 'view_report':
                return { message: 'Showing latest reports...' };
            case 'calculate_gst':
                return { message: 'Opening GST calculator...' };
            case 'search_invoice':
                return { message: 'Searching for invoices...' };
            case 'add_expense':
                return { message: 'Opening expense entry form...' };
            default:
                return { message: 'Executing command...' };
        }
    } catch (error) {
        console.error('Command execution error:', error);
        return { message: 'Error executing command. Please try again.' };
    }
}

module.exports = router;