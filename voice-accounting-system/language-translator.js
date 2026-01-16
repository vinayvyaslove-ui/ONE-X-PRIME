/**
 * Language Translator Module for Voice Accounting System
 * Supports multiple Indian languages with fallback translations
 */

class LanguageTranslator {
    constructor() {
        this.currentLanguage = 'en';
        this.supportedLanguages = ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'pa'];
        this.translations = this.loadTranslations();
        this.apiEndpoints = {
            google: 'https://translation.googleapis.com/language/translate/v2',
            mymemory: 'https://api.mymemory.translated.net/get'
        };
        this.useLocalTranslation = true; // Use local translations by default
        this.apiKey = null; // API key for online translation services
        this.cache = new Map(); // Cache for translations
        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.initializeLocalStorage();
    }

    loadUserPreferences() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        this.setLanguage(savedLang);
    }

    initializeLocalStorage() {
        // Initialize translation cache in localStorage if not exists
        if (!localStorage.getItem('translationCache')) {
            localStorage.setItem('translationCache', JSON.stringify({}));
        }
        
        // Load cached translations
        try {
            const cached = JSON.parse(localStorage.getItem('translationCache'));
            Object.entries(cached).forEach(([key, value]) => {
                this.cache.set(key, value);
            });
        } catch (e) {
            console.warn('Failed to load translation cache');
        }
    }

    loadTranslations() {
        // Comprehensive translations for accounting system
        return {
            // English (Base Language)
            'en': {
                // Common UI Elements
                'app_title': 'Voice Accounting System',
                'dashboard': 'Dashboard',
                'invoices': 'Invoices',
                'expenses': 'Expenses',
                'reports': 'Reports',
                'gst_tools': 'GST Tools',
                'settings': 'Settings',
                'profile': 'Profile',
                'logout': 'Logout',
                'login': 'Login',
                'register': 'Register',
                
                // Voice Commands
                'voice_create_invoice': 'Create Invoice',
                'voice_add_expense': 'Add Expense',
                'voice_view_reports': 'View Reports',
                'voice_calculate_gst': 'Calculate GST',
                'voice_search_invoice': 'Search Invoice',
                'voice_help': 'Help',
                
                // Invoice Management
                'invoice_number': 'Invoice Number',
                'invoice_date': 'Invoice Date',
                'due_date': 'Due Date',
                'customer_name': 'Customer Name',
                'customer_gst': 'Customer GSTIN',
                'item_description': 'Description',
                'quantity': 'Quantity',
                'unit_price': 'Unit Price',
                'amount': 'Amount',
                'subtotal': 'Subtotal',
                'gst': 'GST',
                'total_amount': 'Total Amount',
                'save_invoice': 'Save Invoice',
                'print_invoice': 'Print Invoice',
                'send_invoice': 'Send Invoice',
                
                // GST Terms
                'gst_calculator': 'GST Calculator',
                'cgst': 'CGST',
                'sgst': 'SGST',
                'igst': 'IGST',
                'gst_rate': 'GST Rate',
                'taxable_amount': 'Taxable Amount',
                'gst_amount': 'GST Amount',
                'calculate': 'Calculate',
                'reset': 'Reset',
                
                // Reports
                'sales_report': 'Sales Report',
                'expense_report': 'Expense Report',
                'gst_report': 'GST Report',
                'profit_loss': 'Profit & Loss',
                'cash_flow': 'Cash Flow',
                'period': 'Period',
                'from_date': 'From Date',
                'to_date': 'To Date',
                'generate_report': 'Generate Report',
                'export_pdf': 'Export PDF',
                'export_excel': 'Export Excel',
                
                // Messages
                'success': 'Success',
                'error': 'Error',
                'warning': 'Warning',
                'info': 'Information',
                'loading': 'Loading...',
                'saving': 'Saving...',
                'processing': 'Processing...',
                
                // Form Labels
                'name': 'Name',
                'email': 'Email',
                'phone': 'Phone',
                'address': 'Address',
                'business_name': 'Business Name',
                'gst_number': 'GST Number',
                'password': 'Password',
                'confirm_password': 'Confirm Password',
                'submit': 'Submit',
                'cancel': 'Cancel',
                'edit': 'Edit',
                'delete': 'Delete',
                'view': 'View',
                
                // Categories
                'category': 'Category',
                'office': 'Office',
                'travel': 'Travel',
                'utilities': 'Utilities',
                'salaries': 'Salaries',
                'marketing': 'Marketing',
                'other': 'Other',
                
                // Status
                'draft': 'Draft',
                'sent': 'Sent',
                'paid': 'Paid',
                'overdue': 'Overdue',
                'cancelled': 'Cancelled',
                
                // Months
                'january': 'January',
                'february': 'February',
                'march': 'March',
                'april': 'April',
                'may': 'May',
                'june': 'June',
                'july': 'July',
                'august': 'August',
                'september': 'September',
                'october': 'October',
                'november': 'November',
                'december': 'December',
                
                // Days
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                'saturday': 'Saturday',
                'sunday': 'Sunday',
                
                // Voice Feedback
                'listening': 'Listening...',
                'speak_now': 'Speak now',
                'command_received': 'Command received',
                'processing_command': 'Processing command',
                'command_executed': 'Command executed',
                'try_again': 'Please try again',
                
                // Numbers (for voice)
                'zero': 'zero',
                'one': 'one',
                'two': 'two',
                'three': 'three',
                'four': 'four',
                'five': 'five',
                'six': 'six',
                'seven': 'seven',
                'eight': 'eight',
                'nine': 'nine',
                'ten': 'ten',
                'hundred': 'hundred',
                'thousand': 'thousand',
                'lakh': 'lakh',
                'crore': 'crore'
            },
            
            // Hindi (हिन्दी)
            'hi': {
                'app_title': 'वॉयस अकाउंटिंग सिस्टम',
                'dashboard': 'डैशबोर्ड',
                'invoices': 'इनवॉइस',
                'expenses': 'खर्चे',
                'reports': 'रिपोर्ट्स',
                'gst_tools': 'जीएसटी टूल्स',
                'settings': 'सेटिंग्स',
                'profile': 'प्रोफाइल',
                'logout': 'लॉग आउट',
                'login': 'लॉगिन',
                'register': 'रजिस्टर',
                
                'voice_create_invoice': 'इनवॉइस बनाएं',
                'voice_add_expense': 'खर्च जोड़ें',
                'voice_view_reports': 'रिपोर्ट देखें',
                'voice_calculate_gst': 'जीएसटी कैलकुलेट करें',
                'voice_search_invoice': 'इनवॉइस खोजें',
                'voice_help': 'मदद',
                
                'invoice_number': 'इनवॉइस नंबर',
                'invoice_date': 'इनवॉइस तारीख',
                'due_date': 'नियत तारीख',
                'customer_name': 'ग्राहक का नाम',
                'customer_gst': 'ग्राहक जीएसटीआईएन',
                'item_description': 'विवरण',
                'quantity': 'मात्रा',
                'unit_price': 'इकाई मूल्य',
                'amount': 'रकम',
                'subtotal': 'उप-योग',
                'gst': 'जीएसटी',
                'total_amount': 'कुल रकम',
                'save_invoice': 'इनवॉइस सहेजें',
                'print_invoice': 'इनवॉइस प्रिंट करें',
                'send_invoice': 'इनवॉइस भेजें',
                
                'gst_calculator': 'जीएसटी कैलकुलेटर',
                'cgst': 'सीजीएसटी',
                'sgst': 'एसजीएसटी',
                'igst': 'आईजीएसटी',
                'gst_rate': 'जीएसटी दर',
                'taxable_amount': 'कर योग्य राशि',
                'gst_amount': 'जीएसटी राशि',
                'calculate': 'गणना करें',
                'reset': 'रीसेट',
                
                'sales_report': 'बिक्री रिपोर्ट',
                'expense_report': 'खर्च रिपोर्ट',
                'gst_report': 'जीएसटी रिपोर्ट',
                'profit_loss': 'लाभ और हानि',
                'cash_flow': 'नकदी प्रवाह',
                'period': 'अवधि',
                'from_date': 'तारीख से',
                'to_date': 'तारीख तक',
                'generate_report': 'रिपोर्ट बनाएं',
                'export_pdf': 'पीडीएफ निर्यात करें',
                'export_excel': 'एक्सेल निर्यात करें',
                
                'success': 'सफल',
                'error': 'त्रुटि',
                'warning': 'चेतावनी',
                'info': 'सूचना',
                'loading': 'लोड हो रहा है...',
                'saving': 'सहेजा जा रहा है...',
                'processing': 'प्रसंस्करण...',
                
                'name': 'नाम',
                'email': 'ईमेल',
                'phone': 'फोन',
                'address': 'पता',
                'business_name': 'व्यवसाय का नाम',
                'gst_number': 'जीएसटी नंबर',
                'password': 'पासवर्ड',
                'confirm_password': 'पासवर्ड की पुष्टि करें',
                'submit': 'जमा करें',
                'cancel': 'रद्द करें',
                'edit': 'संपादित करें',
                'delete': 'हटाएं',
                'view': 'देखें',
                
                'category': 'श्रेणी',
                'office': 'कार्यालय',
                'travel': 'यात्रा',
                'utilities': 'उपयोगिताएं',
                'salaries': 'वेतन',
                'marketing': 'विपणन',
                'other': 'अन्य',
                
                'draft': 'ड्राफ्ट',
                'sent': 'भेजा गया',
                'paid': 'भुगतान किया गया',
                'overdue': 'अतिदेय',
                'cancelled': 'रद्द',
                
                'january': 'जनवरी',
                'february': 'फरवरी',
                'march': 'मार्च',
                'april': 'अप्रैल',
                'may': 'मई',
                'june': 'जून',
                'july': 'जुलाई',
                'august': 'अगस्त',
                'september': 'सितंबर',
                'october': 'अक्टूबर',
                'november': 'नवंबर',
                'december': 'दिसंबर',
                
                'monday': 'सोमवार',
                'tuesday': 'मंगलवार',
                'wednesday': 'बुधवार',
                'thursday': 'गुरुवार',
                'friday': 'शुक्रवार',
                'saturday': 'शनिवार',
                'sunday': 'रविवार',
                
                'listening': 'सुन रहा हूँ...',
                'speak_now': 'अब बोलें',
                'command_received': 'आदेश प्राप्त',
                'processing_command': 'आदेश प्रसंस्करण',
                'command_executed': 'आदेश निष्पादित',
                'try_again': 'कृपया फिर कोशिश करें',
                
                'zero': 'शून्य',
                'one': 'एक',
                'two': 'दो',
                'three': 'तीन',
                'four': 'चार',
                'five': 'पाँच',
                'six': 'छह',
                'seven': 'सात',
                'eight': 'आठ',
                'nine': 'नौ',
                'ten': 'दस',
                'hundred': 'सौ',
                'thousand': 'हज़ार',
                'lakh': 'लाख',
                'crore': 'करोड़'
            },
            
            // Tamil (தமிழ்)
            'ta': {
                'app_title': 'குரல் கணக்கு முறை',
                'dashboard': 'டாஷ்போர்டு',
                'invoices': 'விலைப்பட்டியல்',
                'expenses': 'செலவுகள்',
                'reports': 'அறிக்கைகள்',
                'gst_tools': 'ஜிஎஸ்டி கருவிகள்',
                'settings': 'அமைப்புகள்',
                'profile': 'சுயவிவரம்',
                'logout': 'வெளியேறு',
                'login': 'உள்நுழைய',
                'register': 'பதிவு செய்ய',
                
                'voice_create_invoice': 'விலைப்பட்டியல் உருவாக்கு',
                'voice_add_expense': 'செலவு சேர்க்க',
                'voice_view_reports': 'அறிக்கைகள் காண்க',
                'voice_calculate_gst': 'ஜிஎஸ்டி கணக்கிடு',
                'voice_search_invoice': 'விலைப்பட்டியல் தேடு',
                'voice_help': 'உதவி',
                
                'invoice_number': 'விலைப்பட்டியல் எண்',
                'invoice_date': 'விலைப்பட்டியல் தேதி',
                'due_date': 'கெடு தேதி',
                'customer_name': 'வாடிக்கையாளர் பெயர்',
                'customer_gst': 'வாடிக்கையாளர் ஜிஎஸ்டிஐஎன்',
                'item_description': 'விவரம்',
                'quantity': 'அளவு',
                'unit_price': 'அலகு விலை',
                'amount': 'தொகை',
                'subtotal': 'உபதொகை',
                'gst': 'ஜிஎஸ்டி',
                'total_amount': 'மொத்த தொகை',
                'save_invoice': 'விலைப்பட்டியல் சேமிக்க',
                'print_invoice': 'விலைப்பட்டியல் அச்சிடு',
                'send_invoice': 'விலைப்பட்டியல் அனுப்பு',
                
                'gst_calculator': 'ஜிஎஸ்டி கணிப்பான்',
                'cgst': 'சிஜிஎஸ்டி',
                'sgst': 'எஸ்ஜிஎஸ்டி',
                'igst': 'ஐஜிஎஸ்டி',
                'gst_rate': 'ஜிஎஸ்டி விகிதம்',
                'taxable_amount': 'வரி விதிக்கக்கூடிய தொகை',
                'gst_amount': 'ஜிஎஸ்டி தொகை',
                'calculate': 'கணக்கிடு',
                'reset': 'மீட்டமை',
                
                'sales_report': 'விற்பனை அறிக்கை',
                'expense_report': 'செலவு அறிக்கை',
                'gst_report': 'ஜிஎஸ்டி அறிக்கை',
                'profit_loss': 'லாபம் மற்றும் நட்டம்',
                'cash_flow': 'பணப்பாய்வு',
                'period': 'காலம்',
                'from_date': 'தேதியிலிருந்து',
                'to_date': 'தேதி வரை',
                'generate_report': 'அறிக்கை உருவாக்கு',
                'export_pdf': 'பி.டி.எஃப் ஏற்றுமதி',
                'export_excel': 'எக்செல் ஏற்றுமதி',
                
                'success': 'வெற்றி',
                'error': 'பிழை',
                'warning': 'எச்சரிக்கை',
                'info': 'தகவல்',
                'loading': 'ஏற்றுகிறது...',
                'saving': 'சேமிக்கிறது...',
                'processing': 'செயலாக்கம்...',
                
                'name': 'பெயர்',
                'email': 'மின்னஞ்சல்',
                'phone': 'தொலைபேசி',
                'address': 'முகவரி',
                'business_name': 'வணிகப் பெயர்',
                'gst_number': 'ஜிஎஸ்டி எண்',
                'password': 'கடவுச்சொல்',
                'confirm_password': 'கடவுச்சொல் உறுதிப்படுத்து',
                'submit': 'சமர்ப்பிக்க',
                'cancel': 'ரத்து',
                'edit': 'திருத்து',
                'delete': 'நீக்கு',
                'view': 'காண்க',
                
                'category': 'வகை',
                'office': 'அலுவலகம்',
                'travel': 'பயணம்',
                'utilities': 'பயன்பாடுகள்',
                'salaries': 'சம்பளம்',
                'marketing': 'விற்பனை',
                'other': 'மற்றவை',
                
                'draft': 'வரைவு',
                'sent': 'அனுப்பப்பட்டது',
                'paid': 'செலுத்தப்பட்டது',
                'overdue': 'கெடு தாண்டியது',
                'cancelled': 'ரத்து செய்யப்பட்டது',
                
                'january': 'ஜனவரி',
                'february': 'பிப்ரவரி',
                'march': 'மார்ச்',
                'april': 'ஏப்ரல்',
                'may': 'மே',
                'june': 'ஜூன்',
                'july': 'ஜூலை',
                'august': 'ஆகஸ்ட்',
                'september': 'செப்டம்பர்',
                'october': 'அக்டோபர்',
                'november': 'நவம்பர்',
                'december': 'டிசம்பர்',
                
                'monday': 'திங்கள்',
                'tuesday': 'செவ்வாய்',
                'wednesday': 'புதன்',
                'thursday': 'வியாழன்',
                'friday': 'வெள்ளி',
                'saturday': 'சனி',
                'sunday': 'ஞாயிறு',
                
                'listening': 'கேட்கிறது...',
                'speak_now': 'இப்போது பேசுங்கள்',
                'command_received': 'கட்டளை பெறப்பட்டது',
                'processing_command': 'கட்டளை செயலாக்கம்',
                'command_executed': 'கட்டளை செயல்படுத்தப்பட்டது',
                'try_again': 'மீண்டும் முயற்சிக்கவும்',
                
                'zero': 'பூஜ்யம்',
                'one': 'ஒன்று',
                'two': 'இரண்டு',
                'three': 'மூன்று',
                'four': 'நான்கு',
                'five': 'ஐந்து',
                'six': 'ஆறு',
                'seven': 'ஏழு',
                'eight': 'எட்டு',
                'nine': 'ஒன்பது',
                'ten': 'பத்து',
                'hundred': 'நூறு',
                'thousand': 'ஆயிரம்',
                'lakh': 'லட்சம்',
                'crore': 'கோடி'
            },
            
            // Telugu (తెలుగు)
            'te': {
                'app_title': 'వాయిస్ అకౌంటింగ్ సిస్టమ్',
                'dashboard': 'డాష్బోర్డ్',
                'invoices': 'ఇన్వాయిస్లు',
                'expenses': 'ఖర్చులు',
                'reports': 'రిపోర్ట్లు',
                'gst_tools': 'జీఎస్టీ టూల్స్',
                'settings': 'సెట్టింగ్లు',
                'profile': 'ప్రొఫైల్',
                'logout': 'లాగ్అవుట్',
                'login': 'లాగిన్',
                'register': 'నమోదు చేసుకోండి',
                
                'voice_create_invoice': 'ఇన్వాయిస్ సృష్టించండి',
                'voice_add_expense': 'ఖర్చు జోడించండి',
                'voice_view_reports': 'రిపోర్ట్లు వీక్షించండి',
                'voice_calculate_gst': 'జీఎస్టీ లెక్కించండి',
                'voice_search_invoice': 'ఇన్వాయిస్ శోధించండి',
                'voice_help': 'సహాయం',
                
                'invoice_number': 'ఇన్వాయిస్ నంబర్',
                'invoice_date': 'ఇన్వాయిస్ తేదీ',
                'due_date': 'డ్యూ తేదీ',
                'customer_name': 'కస్టమర్ పేరు',
                'customer_gst': 'కస్టమర్ జీఎస్టీఐఎన్',
                'item_description': 'వివరణ',
                'quantity': 'పరిమాణం',
                'unit_price': 'యూనిట్ ధర',
                'amount': 'మొత్తం',
                'subtotal': 'సబ్టోటల్',
                'gst': 'జీఎస్టీ',
                'total_amount': 'మొత్తం మొత్తం',
                'save_invoice': 'ఇన్వాయిస్ సేవ్ చేయండి',
                'print_invoice': 'ఇన్వాయిస్ ప్రింట్ చేయండి',
                'send_invoice': 'ఇన్వాయిస్ పంపండి',
                
                'gst_calculator': 'జీఎస్టీ కాలిక్యులేటర్',
                'cgst': 'సీజీఎస్టీ',
                'sgst': 'ఎస్జీఎస్టీ',
                'igst': 'ఐజీఎస్టీ',
                'gst_rate': 'జీఎస్టీ రేట్',
                'taxable_amount': 'పన్ను మొత్తం',
                'gst_amount': 'జీఎస్టీ మొత్తం',
                'calculate': 'లెక్కించండి',
                'reset': 'రీసెట్',
                
                'sales_report': 'సేల్స్ రిపోర్ట్',
                'expense_report': 'ఖర్చు రిపోర్ట్',
                'gst_report': 'జీఎస్టీ రిపోర్ట్',
                'profit_loss': 'లాభం మరియు నష్టం',
                'cash_flow': 'క్యాష్ ఫ్లో',
                'period': 'కాలం',
                'from_date': 'తేదీ నుండి',
                'to_date': 'తేదీ వరకు',
                'generate_report': 'రిపోర్ట్ జెనరేట్ చేయండి',
                'export_pdf': 'పీడీఎఫ్ ఎగుమతి',
                'export_excel': 'ఎక్సెల్ ఎగుమతి',
                
                'success': 'విజయం',
                'error': 'లోపం',
                'warning': 'హెచ్చరిక',
                'info': 'సమాచారం',
                'loading': 'లోడ్ అవుతోంది...',
                'saving': 'సేవ్ అవుతోంది...',
                'processing': 'ప్రాసెసింగ్...',
                
                'name': 'పేరు',
                'email': 'ఇమెయిల్',
                'phone': 'ఫోన్',
                'address': 'చిరునామా',
                'business_name': 'వ్యాపారం పేరు',
                'gst_number': 'జీఎస్టీ నంబర్',
                'password': 'పాస్వర్డ్',
                'confirm_password': 'పాస్వర్డ్ నిర్ధారించండి',
                'submit': 'సమర్పించండి',
                'cancel': 'రద్దు',
                'edit': 'సవరించండి',
                'delete': 'తొలగించండి',
                'view': 'చూడండి',
                
                'category': 'వర్గం',
                'office': 'ఆఫీస్',
                'travel': 'ప్రయాణం',
                'utilities': 'యుటిలిటీలు',
                'salaries': 'సాలరీలు',
                'marketing': 'మార్కెటింగ్',
                'other': 'ఇతర',
                
                'draft': 'డ్రాఫ్ట్',
                'sent': 'పంపబడింది',
                'paid': 'చెల్లించబడింది',
                'overdue': 'డ్యూ మీరిన',
                'cancelled': 'రద్దు చేయబడింది',
                
                'january': 'జనవరి',
                'february': 'ఫిబ్రవరి',
                'march': 'మార్చి',
                'april': 'ఏప్రిల్',
                'may': 'మే',
                'june': 'జూన్',
                'july': 'జూలై',
                'august': 'ఆగస్టు',
                'september': 'సెప్టెంబర్',
                'october': 'అక్టోబర్',
                'november': 'నవంబర్',
                'december': 'డిసెంబర్',
                
                'monday': 'సోమవారం',
                'tuesday': 'మంగళవారం',
                'wednesday': 'బుధవారం',
                'thursday': 'గురువారం',
                'friday': 'శుక్రవారం',
                'saturday': 'శనివారం',
                'sunday': 'ఆదివారం',
                
                'listening': 'వినడం...',
                'speak_now': 'ఇప్పుడు మాట్లాడండి',
                'command_received': 'కమాండ్ అందింది',
                'processing_command': 'కమాండ్ ప్రాసెసింగ్',
                'command_executed': 'కమాండ్ అమలు చేయబడింది',
                'try_again': 'మళ్లీ ప్రయత్నించండి',
                
                'zero': 'సున్నా',
                'one': 'ఒకటి',
                'two': 'రెండు',
                'three': 'మూడు',
                'four': 'నాలుగు',
                'five': 'ఐదు',
                'six': 'ఆరు',
                'seven': 'ఏడు',
                'eight': 'ఎనిమిది',
                'nine': 'తొమ్మిది',
                'ten': 'పది',
                'hundred': 'వంద',
                'thousand': 'వెయ్యి',
                'lakh': 'లక్ష',
                'crore': 'కోటి'
            },
            
            // Bengali (বাংলা)
            'bn': {
                'app_title': 'ভয়েস অ্যাকাউন্টিং সিস্টেম',
                'dashboard': 'ড্যাশবোর্ড',
                'invoices': 'ইনভয়েস',
                'expenses': 'খরচ',
                'reports': 'রিপোর্ট',
                'gst_tools': 'জিএসটি টুলস',
                'settings': 'সেটিংস',
                'profile': 'প্রোফাইল',
                'logout': 'লগ আউট',
                'login': 'লগইন',
                'register': 'রেজিস্টার',
                
                'voice_create_invoice': 'ইনভয়েস তৈরি করুন',
                'voice_add_expense': 'খরচ যোগ করুন',
                'voice_view_reports': 'রিপোর্ট দেখুন',
                'voice_calculate_gst': 'জিএসটি গণনা করুন',
                'voice_search_invoice': 'ইনভয়েস অনুসন্ধান করুন',
                'voice_help': 'সাহায্য',
                
                'invoice_number': 'ইনভয়েস নম্বর',
                'invoice_date': 'ইনভয়েস তারিখ',
                'due_date': 'পরিশোধের তারিখ',
                'customer_name': 'গ্রাহকের নাম',
                'customer_gst': 'গ্রাহক জিএসটিআইএন',
                'item_description': 'বিবরণ',
                'quantity': 'পরিমাণ',
                'unit_price': 'ইউনিট মূল্য',
                'amount': 'পরিমাণ',
                'subtotal': 'উপ-মোট',
                'gst': 'জিএসটি',
                'total_amount': 'মোট পরিমাণ',
                'save_invoice': 'ইনভয়েস সংরক্ষণ করুন',
                'print_invoice': 'ইনভয়েস প্রিন্ট করুন',
                'send_invoice': 'ইনভয়েস পাঠান',
                
                'gst_calculator': 'জিএসটি ক্যালকুলেটর',
                'cgst': 'সিজিএসটি',
                'sgst': 'এসজিএসটি',
                'igst': 'আইজিএসটি',
                'gst_rate': 'জিএসটি হার',
                'taxable_amount': 'করযোগ্য পরিমাণ',
                'gst_amount': 'জিএসটি পরিমাণ',
                'calculate': 'গণনা করুন',
                'reset': 'রিসেট',
                
                'sales_report': 'বিক্রয় রিপোর্ট',
                'expense_report': 'ব্যয় রিপোর্ট',
                'gst_report': 'জিএসটি রিপোর্ট',
                'profit_loss': 'লাভ এবং ক্ষতি',
                'cash_flow': 'নগদ প্রবাহ',
                'period': 'সময়কাল',
                'from_date': 'তারিখ থেকে',
                'to_date': 'তারিখ পর্যন্ত',
                'generate_report': 'রিপোর্ট তৈরি করুন',
                'export_pdf': 'পিডিএফ রপ্তানি',
                'export_excel': 'এক্সেল রপ্তানি',
                
                'success': 'সফলতা',
                'error': 'ত্রুটি',
                'warning': 'সতর্কতা',
                'info': 'তথ্য',
                'loading': 'লোড হচ্ছে...',
                'saving': 'সংরক্ষণ হচ্ছে...',
                'processing': 'প্রক্রিয়াকরণ...',
                
                'name': 'নাম',
                'email': 'ইমেল',
                'phone': 'ফোন',
                'address': 'ঠিকানা',
                'business_name': 'ব্যবসার নাম',
                'gst_number': 'জিএসটি নম্বর',
                'password': 'পাসওয়ার্ড',
                'confirm_password': 'পাসওয়ার্ড নিশ্চিত করুন',
                'submit': 'জমা দিন',
                'cancel': 'বাতিল',
                'edit': 'সম্পাদনা',
                'delete': 'মুছুন',
                'view': 'দেখুন',
                
                'category': 'বিভাগ',
                'office': 'অফিস',
                'travel': 'ভ্রমণ',
                'utilities': 'ইউটিলিটি',
                'salaries': 'বেতন',
                'marketing': 'বিপণন',
                'other': 'অন্যান্য',
                
                'draft': 'খসড়া',
                'sent': 'প্রেরিত',
                'paid': 'পরিশোধিত',
                'overdue': 'বকেয়া',
                'cancelled': 'বাতিল',
                
                'january': 'জানুয়ারি',
                'february': 'ফেব্রুয়ারি',
                'march': 'মার্চ',
                'april': 'এপ্রিল',
                'may': 'মে',
                'june': 'জুন',
                'july': 'জুলাই',
                'august': 'আগস্ট',
                'september': 'সেপ্টেম্বর',
                'october': 'অক্টোবর',
                'november': 'নভেম্বর',
                'december': 'ডিসেম্বর',
                
                'monday': 'সোমবার',
                'tuesday': 'মঙ্গলবার',
                'wednesday': 'বুধবার',
                'thursday': 'বৃহস্পতিবার',
                'friday': 'শুক্রবার',
                'saturday': 'শনিবার',
                'sunday': 'রবিবার',
                
                'listening': 'শুনছি...',
                'speak_now': 'এখন কথা বলুন',
                'command_received': 'কমান্ড প্রাপ্ত',
                'processing_command': 'কমান্ড প্রসেসিং',
                'command_executed': 'কমান্ড এক্সিকিউটেড',
                'try_again': 'আবার চেষ্টা করুন',
                
                'zero': 'শূন্য',
                'one': 'এক',
                'two': 'দুই',
                'three': 'তিন',
                'four': 'চার',
                'five': 'পাঁচ',
                'six': 'ছয়',
                'seven': 'সাত',
                'eight': 'আট',
                'nine': 'নয়',
                'ten': 'দশ',
                'hundred': 'শত',
                'thousand': 'হাজার',
                'lakh': 'লক্ষ',
                'crore': 'কোটি'
            }
        };
    }

    setLanguage(language) {
        if (this.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
            localStorage.setItem('preferredLanguage', language);
            
            // Update HTML lang attribute
            document.documentElement.lang = language;
            
            // Dispatch language change event
            this.dispatchLanguageChangeEvent();
            
            // Update all translatable elements
            this.updatePageTranslations();
            
            return true;
        }
        return false;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages.map(lang => ({
            code: lang,
            name: this.getLanguageName(lang)
        }));
    }

    getLanguageName(code) {
        const languageNames = {
            'en': 'English',
            'hi': 'हिन्दी',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'bn': 'বাংলা',
            'gu': 'ગુજરાતી',
            'mr': 'मराठी',
            'kn': 'ಕನ್ನಡ',
            'ml': 'മലയാളം',
            'pa': 'ਪੰਜਾਬੀ'
        };
        return languageNames[code] || code;
    }

    translate(key, params = {}) {
        // Check if translation exists for current language
        if (this.translations[this.currentLanguage] && 
            this.translations[this.currentLanguage][key]) {
            let translation = this.translations[this.currentLanguage][key];
            
            // Replace parameters in translation
            Object.keys(params).forEach(param => {
                translation = translation.replace(`{{${param}}}`, params[param]);
            });
            
            return translation;
        }
        
        // Fallback to English
        if (this.translations['en'] && this.translations['en'][key]) {
            let translation = this.translations['en'][key];
            
            // Replace parameters in translation
            Object.keys(params).forEach(param => {
                translation = translation.replace(`{{${param}}}`, params[param]);
            });
            
            return translation;
        }
        
        // Return the key itself if no translation found
        return key;
    }

    async translateText(text, targetLang, sourceLang = 'auto') {
        // Check cache first
        const cacheKey = `${sourceLang}_${targetLang}_${text}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Check localStorage cache
        const storedCache = JSON.parse(localStorage.getItem('translationCache') || '{}');
        if (storedCache[cacheKey]) {
            this.cache.set(cacheKey, storedCache[cacheKey]);
            return storedCache[cacheKey];
        }
        
        // Use local translations for known keys
        if (this.isKnownPhrase(text)) {
            const translated = this.translateKnownPhrase(text, targetLang);
            if (translated !== text) {
                this.saveToCache(cacheKey, translated);
                return translated;
            }
        }
        
        // Try online translation if enabled and API key available
        if (!this.useLocalTranslation && this.apiKey) {
            try {
                const onlineTranslation = await this.translateOnline(text, targetLang, sourceLang);
                this.saveToCache(cacheKey, onlineTranslation);
                return onlineTranslation;
            } catch (error) {
                console.warn('Online translation failed, using local fallback:', error);
            }
        }
        
        // Fallback: Return original text
        this.saveToCache(cacheKey, text);
        return text;
    }

    isKnownPhrase(text) {
        // Check if this is a known translation key
        const englishTranslations = this.translations['en'];
        return Object.values(englishTranslations).includes(text) || 
               Object.keys(englishTranslations).some(key => englishTranslations[key] === text);
    }

    translateKnownPhrase(text, targetLang) {
        // Find the key for this text in English
        const englishTranslations = this.translations['en'];
        let key = null;
        
        for (const [k, value] of Object.entries(englishTranslations)) {
            if (value === text) {
                key = k;
                break;
            }
        }
        
        // If found, return translation in target language
        if (key && this.translations[targetLang] && this.translations[targetLang][key]) {
            return this.translations[targetLang][key];
        }
        
        return text;
    }

    async translateOnline(text, targetLang, sourceLang = 'auto') {
        if (!this.apiKey) {
            throw new Error('Translation API key not configured');
        }

        try {
            // Try Google Translate API first
            const response = await fetch(`${this.apiEndpoints.google}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    source: sourceLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data.translations[0].translatedText;
        } catch (error) {
            console.error('Google Translate failed:', error);
            
            // Fallback to MyMemory Translation API
            try {
                const response = await fetch(
                    `${this.apiEndpoints.mymemory}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
                );
                
                if (!response.ok) {
                    throw new Error(`MyMemory API error: ${response.status}`);
                }
                
                const data = await response.json();
                return data.responseData.translatedText;
            } catch (memoryError) {
                console.error('MyMemory Translation failed:', memoryError);
                throw new Error('All online translation services failed');
            }
        }
    }

    saveToCache(key, value) {
        this.cache.set(key, value);
        
        // Save to localStorage
        const storedCache = JSON.parse(localStorage.getItem('translationCache') || '{}');
        storedCache[key] = value;
        localStorage.setItem('translationCache', JSON.stringify(storedCache));
    }

    clearCache() {
        this.cache.clear();
        localStorage.removeItem('translationCache');
        localStorage.setItem('translationCache', JSON.stringify({}));
    }

    updatePageTranslations() {
        // Update all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const params = {};
            
            // Extract parameters from data attributes
            element.getAttributeNames().forEach(attr => {
                if (attr.startsWith('data-param-')) {
                    const paramName = attr.replace('data-param-', '');
                    params[paramName] = element.getAttribute(attr);
                }
            });
            
            const translation = this.translate(key, params);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.hasAttribute('title')) {
                element.title = translation;
            } else if (element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', translation);
            } else {
                element.textContent = translation;
            }
        });
        
        // Update page title if it has data-translate attribute
        const title = document.querySelector('title[data-translate]');
        if (title) {
            const key = title.getAttribute('data-translate');
            document.title = this.translate(key);
        }
    }

    dispatchLanguageChangeEvent() {
        const event = new CustomEvent('languageChanged', {
            detail: {
                language: this.currentLanguage,
                languageName: this.getLanguageName(this.currentLanguage)
            }
        });
        window.dispatchEvent(event);
    }

    // Voice-specific translation methods
    translateVoiceCommand(command) {
        const voiceCommands = {
            'create invoice': {
                'en': 'create invoice',
                'hi': 'इनवॉइस बनाएं',
                'ta': 'விலைப்பட்டியல் உருவாக்கு',
                'te': 'ఇన్వాయిస్ సృష్టించండి',
                'bn': 'ইনভয়েস তৈরি করুন'
            },
            'add expense': {
                'en': 'add expense',
                'hi': 'खर्च जोड़ें',
                'ta': 'செலவு சேர்க்க',
                'te': 'ఖర్చు జోడించండి',
                'bn': 'খরচ যোগ করুন'
            },
            'view reports': {
                'en': 'view reports',
                'hi': 'रिपोर्ट देखें',
                'ta': 'அறிக்கைகள் காண்க',
                'te': 'రిపోర్ట్లు వీక్షించండి',
                'bn': 'রিপোর্ট দেখুন'
            },
            'calculate gst': {
                'en': 'calculate gst',
                'hi': 'जीएसटी कैलकुलेट करें',
                'ta': 'ஜிஎஸ்டி கணக்கிடு',
                'te': 'జీఎస్టీ లెక్కించండి',
                'bn': 'জিএসটি গণনা করুন'
            },
            'search invoice': {
                'en': 'search invoice',
                'hi': 'इनवॉइस खोजें',
                'ta': 'விலைப்பட்டியல் தேடு',
                'te': 'ఇన్వాయిస్ శోధించండి',
                'bn': 'ইনভয়েস অনুসন্ধান করুন'
            },
            'help': {
                'en': 'help',
                'hi': 'मदद',
                'ta': 'உதவி',
                'te': 'సహాయం',
                'bn': 'সাহায্য'
            }
        };

        const lowerCommand = command.toLowerCase().trim();
        
        // Find matching command
        for (const [key, translations] of Object.entries(voiceCommands)) {
            if (lowerCommand.includes(key)) {
                return translations[this.currentLanguage] || translations['en'];
            }
        }
        
        return command;
    }

    translateNumberToWords(number, language = null) {
        const lang = language || this.currentLanguage;
        
        if (lang === 'hi') {
            return this.numberToHindiWords(number);
        } else if (lang === 'ta') {
            return this.numberToTamilWords(number);
        } else if (lang === 'te') {
            return this.numberToTeluguWords(number);
        } else if (lang === 'bn') {
            return this.numberToBengaliWords(number);
        } else {
            return this.numberToEnglishWords(number);
        }
    }

    numberToEnglishWords(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
                      'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        
        if (num === 0) return 'zero';
        
        let words = '';
        
        // Handle crores
        if (num >= 10000000) {
            words += this.numberToEnglishWords(Math.floor(num / 10000000)) + ' crore ';
            num %= 10000000;
        }
        
        // Handle lakhs
        if (num >= 100000) {
            words += this.numberToEnglishWords(Math.floor(num / 100000)) + ' lakh ';
            num %= 100000;
        }
        
        // Handle thousands
        if (num >= 1000) {
            words += this.numberToEnglishWords(Math.floor(num / 1000)) + ' thousand ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (num >= 100) {
            words += this.numberToEnglishWords(Math.floor(num / 100)) + ' hundred ';
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (words !== '') words += 'and ';
            
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                words += teens[num - 10];
            } else {
                words += tens[Math.floor(num / 10)];
                if (num % 10 > 0) {
                    words += ' ' + ones[num % 10];
                }
            }
        }
        
        return words.trim();
    }

    numberToHindiWords(num) {
        const ones = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'];
        const teens = ['दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 
                      'सत्रह', 'अट्ठारह', 'उन्नीस'];
        const tens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];
        
        if (num === 0) return 'शून्य';
        
        let words = '';
        
        // Handle crores
        if (num >= 10000000) {
            words += this.numberToHindiWords(Math.floor(num / 10000000)) + ' करोड़ ';
            num %= 10000000;
        }
        
        // Handle lakhs
        if (num >= 100000) {
            words += this.numberToHindiWords(Math.floor(num / 100000)) + ' लाख ';
            num %= 100000;
        }
        
        // Handle thousands
        if (num >= 1000) {
            words += this.numberToHindiWords(Math.floor(num / 1000)) + ' हज़ार ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (num >= 100) {
            words += this.numberToHindiWords(Math.floor(num / 100)) + ' सौ ';
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                words += teens[num - 10];
            } else {
                words += tens[Math.floor(num / 10)];
                if (num % 10 > 0) {
                    words += ' ' + ones[num % 10];
                }
            }
        }
        
        return words.trim();
    }

    numberToTamilWords(num) {
        const ones = ['', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது'];
        const tens = ['', 'பத்து', 'இருபது', 'முப்பது', 'நாற்பது', 'ஐம்பது', 'அறுபது', 'எழுபது', 'எண்பது', 'தொண்ணூறு'];
        
        if (num === 0) return 'பூஜ்யம்';
        
        let words = '';
        
        // Handle crores
        if (num >= 10000000) {
            words += this.numberToTamilWords(Math.floor(num / 10000000)) + ' கோடி ';
            num %= 10000000;
        }
        
        // Handle lakhs
        if (num >= 100000) {
            words += this.numberToTamilWords(Math.floor(num / 100000)) + ' இலட்சம் ';
            num %= 100000;
        }
        
        // Handle thousands
        if (num >= 1000) {
            words += this.numberToTamilWords(Math.floor(num / 1000)) + ' ஆயிரம் ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (num >= 100) {
            const hundreds = Math.floor(num / 100);
            if (hundreds === 1) {
                words += 'நூறு ';
            } else {
                words += ones[hundreds] + ' நூறு ';
            }
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                // Special handling for 11-19
                const special = ['பத்து', 'பதினொன்று', 'பன்னிரண்டு', 'பதிமூன்று', 
                               'பதினான்கு', 'பதினைந்து', 'பதினாறு', 'பதினேழு', 
                               'பதினெட்டு', 'பத்தொன்பது'];
                words += special[num - 10];
            } else {
                const ten = Math.floor(num / 10);
                const one = num % 10;
                words += tens[ten];
                if (one > 0) {
                    words += ' ' + ones[one];
                }
            }
        }
        
        return words.trim();
    }

    numberToTeluguWords(num) {
        const ones = ['', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది'];
        const tens = ['', 'పది', 'ఇరవై', 'ముప్పై', 'నలభై', 'యాభై', 'అరవై', 'డెబ్బై', 'ఎనభై', 'తొంభై'];
        
        if (num === 0) return 'సున్నా';
        
        let words = '';
        
        // Handle crores
        if (num >= 10000000) {
            words += this.numberToTeluguWords(Math.floor(num / 10000000)) + ' కోటి ';
            num %= 10000000;
        }
        
        // Handle lakhs
        if (num >= 100000) {
            words += this.numberToTeluguWords(Math.floor(num / 100000)) + ' లక్ష ';
            num %= 100000;
        }
        
        // Handle thousands
        if (num >= 1000) {
            words += this.numberToTeluguWords(Math.floor(num / 1000)) + ' వేయి ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (num >= 100) {
            const hundreds = Math.floor(num / 100);
            if (hundreds === 1) {
                words += 'వంద ';
            } else {
                words += ones[hundreds] + ' వందల ';
            }
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                // Special handling for 11-19
                const special = ['పది', 'పదకొండు', 'పన్నెండు', 'పదమూడు', 
                               'పద్నాలుగు', 'పదిహేను', 'పదహారు', 'పదిహేడు', 
                               'పద్దెనిమిది', 'పందొమ్మిది'];
                words += special[num - 10];
            } else {
                const ten = Math.floor(num / 10);
                const one = num % 10;
                words += tens[ten];
                if (one > 0) {
                    words += ' ' + ones[one];
                }
            }
        }
        
        return words.trim();
    }

    numberToBengaliWords(num) {
        const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
        const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
        
        if (num === 0) return 'শূন্য';
        
        let words = '';
        
        // Handle crores
        if (num >= 10000000) {
            words += this.numberToBengaliWords(Math.floor(num / 10000000)) + ' কোটি ';
            num %= 10000000;
        }
        
        // Handle lakhs
        if (num >= 100000) {
            words += this.numberToBengaliWords(Math.floor(num / 100000)) + ' লক্ষ ';
            num %= 100000;
        }
        
        // Handle thousands
        if (num >= 1000) {
            words += this.numberToBengaliWords(Math.floor(num / 1000)) + ' হাজার ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (num >= 100) {
            const hundreds = Math.floor(num / 100);
            if (hundreds === 1) {
                words += 'একশ ';
            } else {
                words += ones[hundreds] + 'শ ';
            }
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                // Special handling for 11-19
                const special = ['দশ', 'এগারো', 'বারো', 'তেরো', 
                               'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 
                               'আঠারো', 'উনিশ'];
                words += special[num - 10];
            } else {
                const ten = Math.floor(num / 10);
                const one = num % 10;
                words += tens[ten];
                if (one > 0) {
                    words += ' ' + ones[one];
                }
            }
        }
        
        return words.trim();
    }

    // Format currency based on language
    formatCurrency(amount, language = null) {
        const lang = language || this.currentLanguage;
        const formattedAmount = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
        
        // Add language-specific currency labels
        if (lang === 'hi') {
            return `₹${amount.toLocaleString('en-IN')} (रुपए)`;
        } else if (lang === 'ta') {
            return `₹${amount.toLocaleString('en-IN')} (ரூபாய்)`;
        } else if (lang === 'te') {
            return `₹${amount.toLocaleString('en-IN')} (రూపాయలు)`;
        } else if (lang === 'bn') {
            return `₹${amount.toLocaleString('en-IN')} (টাকা)`;
        }
        
        return formattedAmount;
    }

    // Translate date to local format
    formatDate(date, language = null) {
        const lang = language || this.currentLanguage;
        const d = new Date(date);
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        // Set locale based on language
        let locale = 'en-IN';
        if (lang === 'hi') locale = 'hi-IN';
        else if (lang === 'ta') locale = 'ta-IN';
        else if (lang === 'te') locale = 'te-IN';
        else if (lang === 'bn') locale = 'bn-IN';
        
        return d.toLocaleDateString(locale, options);
    }

    // Initialize language selector dropdown
    initializeLanguageSelector(selector = '#language-select') {
        const selectElement = document.querySelector(selector);
        if (!selectElement) return;
        
        // Clear existing options
        selectElement.innerHTML = '';
        
        // Add supported languages
        this.getSupportedLanguages().forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.name} (${lang.code})`;
            if (lang.code === this.currentLanguage) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
        
        // Add change event listener
        selectElement.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
    }

    // Enable online translation with API key
    enableOnlineTranslation(apiKey) {
        this.apiKey = apiKey;
        this.useLocalTranslation = false;
        localStorage.setItem('translationApiKey', apiKey);
        localStorage.setItem('useOnlineTranslation', 'true');
    }

    // Disable online translation
    disableOnlineTranslation() {
        this.useLocalTranslation = true;
        localStorage.setItem('useOnlineTranslation', 'false');
    }

    // Load translation settings from localStorage
    loadTranslationSettings() {
        const apiKey = localStorage.getItem('translationApiKey');
        const useOnline = localStorage.getItem('useOnlineTranslation') === 'true';
        
        if (apiKey) {
            this.apiKey = apiKey;
        }
        
        this.useLocalTranslation = !useOnline;
    }

    // Export translations for debugging
    exportTranslations() {
        return {
            currentLanguage: this.currentLanguage,
            supportedLanguages: this.getSupportedLanguages(),
            translations: this.translations,
            cacheSize: this.cache.size
        };
    }

    // Import translations (for adding new languages)
    importTranslations(languageCode, translations) {
        if (!this.supportedLanguages.includes(languageCode)) {
            this.supportedLanguages.push(languageCode);
        }
        
        this.translations[languageCode] = {
            ...this.translations['en'], // Start with English as base
            ...translations // Override with provided translations
        };
        
        // Save to localStorage for persistence
        this.saveTranslationsToStorage();
    }

    saveTranslationsToStorage() {
        try {
            localStorage.setItem('customTranslations', JSON.stringify(this.translations));
        } catch (error) {
            console.error('Failed to save translations to storage:', error);
        }
    }

    loadCustomTranslations() {
        try {
            const custom = localStorage.getItem('customTranslations');
            if (custom) {
                const parsed = JSON.parse(custom);
                Object.assign(this.translations, parsed);
                
                // Update supported languages
                Object.keys(parsed).forEach(lang => {
                    if (!this.supportedLanguages.includes(lang)) {
                        this.supportedLanguages.push(lang);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load custom translations:', error);
        }
    }

    // Get translation statistics
    getTranslationStats() {
        const stats = {};
        
        Object.keys(this.translations).forEach(lang => {
            stats[lang] = {
                name: this.getLanguageName(lang),
                count: Object.keys(this.translations[lang]).length,
                completeness: Math.round((Object.keys(this.translations[lang]).length / 
                    Object.keys(this.translations['en']).length) * 100)
            };
        });
        
        return stats;
    }

    // Voice synthesis in different languages
    speak(text, language = null) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return false;
        }
        
        const lang = language || this.currentLanguage;
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language for speech
        const langCode = this.getSpeechLangCode(lang);
        utterance.lang = langCode;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Speak the text
        speechSynthesis.speak(utterance);
        
        return true;
    }

    getSpeechLangCode(language) {
        const langMap = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'bn': 'bn-IN',
            'gu': 'gu-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'pa': 'pa-IN'
        };
        
        return langMap[language] || 'en-IN';
    }

    // Stop speech synthesis
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }

    // Check if language is RTL
    isRTL(language = null) {
        const lang = language || this.currentLanguage;
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(lang);
    }

    // Get text direction for language
    getTextDirection(language = null) {
        return this.isRTL(language) ? 'rtl' : 'ltr';
    }

    // Update page direction based on language
    updatePageDirection() {
        const direction = this.getTextDirection();
        document.documentElement.dir = direction;
        
        // Update CSS for RTL support
        if (direction === 'rtl') {
            document.body.classList.add('rtl');
            document.body.classList.remove('ltr');
        } else {
            document.body.classList.add('ltr');
            document.body.classList.remove('rtl');
        }
    }

    // Initialize the translator
    static init() {
        const translator = new LanguageTranslator();
        window.LanguageTranslator = translator;
        
        // Load custom translations
        translator.loadCustomTranslations();
        
        // Load translation settings
        translator.loadTranslationSettings();
        
        // Initialize language selector if exists
        translator.initializeLanguageSelector();
        
        // Update page translations
        translator.updatePageTranslations();
        
        // Update page direction
        translator.updatePageDirection();
        
        // Listen for language change events
        window.addEventListener('languageChanged', () => {
            translator.updatePageTranslations();
            translator.updatePageDirection();
        });
        
        console.log('Language Translator initialized with language:', translator.currentLanguage);
        return translator;
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.LanguageTranslator = LanguageTranslator.init();
    });
} else {
    window.LanguageTranslator = LanguageTranslator.init();
}

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageTranslator;
}

// Add CSS for RTL support
const rtlStyles = `
    .rtl {
        direction: rtl;
        text-align: right;
    }
    
    .rtl .modal-header,
    .rtl .modal-footer {
        flex-direction: row-reverse;
    }
    
    .rtl .btn i {
        margin-right: 0;
        margin-left: 0.5rem;
    }
    
    .rtl .form-group label {
        text-align: right;
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .rtl .input-group {
        flex-direction: row-reverse;
    }
    
    .rtl .table th,
    .rtl .table td {
        text-align: right;
    }
    
    .rtl .nav {
        padding-right: 0;
    }
    
    .rtl .float-left {
        float: right !important;
    }
    
    .rtl .float-right {
        float: left !important;
    }
    
    .rtl .text-left {
        text-align: right !important;
    }
    
    .rtl .text-right {
        text-align: left !important;
    }
    
    .rtl .mr-1 {
        margin-right: 0 !important;
        margin-left: 0.25rem !important;
    }
    
    .rtl .ml-1 {
        margin-left: 0 !important;
        margin-right: 0.25rem !important;
    }
    
    .rtl .pl-1 {
        padding-left: 0 !important;
        padding-right: 0.25rem !important;
    }
    
    .rtl .pr-1 {
        padding-right: 0 !important;
        padding-left: 0.25rem !important;
    }
`;

// Add RTL styles to document
const style = document.createElement('style');
style.textContent = rtlStyles;
document.head.appendChild(style);

console.log('Language Translator module loaded successfully');