
## 12. Additional Important Files

### voice-commands.js
```javascript
// Voice Command Processing Module
class VoiceCommandProcessor {
    constructor() {
        this.commands = this.loadCommands();
        this.recognition = null;
        this.isListening = false;
        this.currentLanguage = 'en-IN';
    }

    loadCommands() {
        // Load commands from config or use defaults
        return {
            'createInvoice': ['create invoice', 'make invoice', 'new invoice'],
            'addExpense': ['add expense', 'record expense', 'log expense'],
            'viewReports': ['show reports', 'view reports', 'see reports'],
            'calculateGST': ['calculate gst', 'gst calculation', 'compute gst'],
            'searchInvoice': ['find invoice', 'search invoice', 'look for invoice'],
            'goToDashboard': ['go to dashboard', 'show dashboard', 'dashboard'],
            'help': ['help', 'what can i do', 'commands']
        };
    }

    initializeRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.configureRecognition();
            return true;
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            this.configureRecognition();
            return true;
        }
        return false;
    }

    configureRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart();
        };
        
        this.recognition.onresult = (event) => {
            this.processSpeechResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningEnd();
        };
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    processSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Process interim results for real-time feedback
        if (interimTranscript) {
            this.onInterimResult(interimTranscript);
        }
        
        // Process final results for commands
        if (finalTranscript) {
            const command = this.identifyCommand(finalTranscript);
            if (command) {
                this.executeCommand(command, finalTranscript);
            }
        }
    }

    identifyCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        
        for (const [command, phrases] of Object.entries(this.commands)) {
            for (const phrase of phrases) {
                if (lowerTranscript.includes(phrase)) {
                    return {
                        type: command,
                        phrase: phrase,
                        transcript: transcript
                    };
                }
            }
        }
        
        return null;
    }

    executeCommand(command, originalTranscript) {
        console.log('Executing command:', command.type);
        
        // Send command to server for processing
        this.sendCommandToServer(command, originalTranscript);
        
        // Execute client-side action
        switch (command.type) {
            case 'createInvoice':
                window.location.href = 'invoice.html';
                break;
            case 'addExpense':
                this.openExpenseModal();
                break;
            case 'viewReports':
                window.location.href = 'reports.html';
                break;
            case 'calculateGST':
                this.extractAmountAndCalculate(originalTranscript);
                break;
            case 'searchInvoice':
                this.extractInvoiceNumberAndSearch(originalTranscript);
                break;
            case 'goToDashboard':
                window.location.href = 'dashboard.html';
                break;
            case 'help':
                this.showHelpModal();
                break;
        }
        
        this.showCommandFeedback(command.type, originalTranscript);
    }

    extractAmountAndCalculate(transcript) {
        // Extract amount from transcript
        const amountMatch = transcript.match(/\d+(\.\d{1,2})?/);
        if (amountMatch) {
            const amount = parseFloat(amountMatch[0]);
            this.calculateGSTAmount(amount);
        } else {
            this.showMessage('Please specify an amount. For example: "Calculate GST for 1000 rupees"');
        }
    }

    extractInvoiceNumberAndSearch(transcript) {
        // Extract invoice number
        const invoiceMatch = transcript.match(/INV-\d+/i) || transcript.match(/invoice\s+(\w+)/i);
        if (invoiceMatch) {
            const invoiceNumber = invoiceMatch[0].replace('invoice ', '');
            this.searchInvoice(invoiceNumber);
        } else {
            this.showMessage('Please specify an invoice number. For example: "Search for invoice INV-001"');
        }
    }

    async sendCommandToServer(command, transcript) {
        try {
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript: transcript,
                    command: command.type,
                    language: this.currentLanguage.split('-')[0],
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending command to server:', error);
        }
    }

    showCommandFeedback(commandType, transcript) {
        const feedbackElement = document.getElementById('voice-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = `Command: ${transcript}`;
            feedbackElement.classList.add('active');
            
            setTimeout(() => {
                feedbackElement.classList.remove('active');
            }, 3000);
        }
    }

    showMessage(message) {
        // Create or use notification system
        const notification = document.createElement('div');
        notification.className = 'voice-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    onListeningStart() {
        console.log('Voice recognition started');
        document.body.classList.add('voice-active');
    }

    onListeningEnd() {
        console.log('Voice recognition stopped');
        document.body.classList.remove('voice-active');
    }

    onInterimResult(transcript) {
        // Update UI with interim results
        const interimElement = document.getElementById('interim-transcript');
        if (interimElement) {
            interimElement.textContent = transcript;
        }
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
            case 'no-speech':
                this.showMessage('No speech detected. Please try again.');
                break;
            case 'audio-capture':
                this.showMessage('No microphone found. Please check your microphone.');
                break;
            case 'not-allowed':
                this.showMessage('Microphone access denied. Please allow microphone access.');
                break;
            default:
                this.showMessage('Error with voice recognition. Please try again.');
        }
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        if (this.recognition) {
            this.recognition.lang = languageCode;
        }
    }

    // Public API
    start() {
        if (this.initializeRecognition()) {
            this.startListening();
            return true;
        }
        return false;
    }

    stop() {
        this.stopListening();
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceCommandProcessor;
} else {
    window.VoiceCommandProcessor = VoiceCommandProcessor;
}