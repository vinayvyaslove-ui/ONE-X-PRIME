const GSTAI = require('gst-ai-sdk');

const client = new GSTAI({
  apiKey: 'sk_live_...',
  environment: 'production' // or 'sandbox'
});

// Create invoice
const invoice = await client.invoices.create({
  customer: {
    name: 'ABC Enterprises',
    gstin: '27XYZPU9603R1ZY'
  },
  items: [{
    description: 'Consulting Services',
    quantity: 1,
    unit_price: 50000
  }]
});

// File GST return
const filing = await client.gst.file({
  period: '04-2024',
  type: 'GSTR1'
});