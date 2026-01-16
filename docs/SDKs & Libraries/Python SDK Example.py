from gst_ai import GSTAI

client = GSTAI(api_key='sk_live_...')

# Analyze document
result = client.ai.analyze_document(
    file_path='invoice.pdf',
    document_type='invoice'
)

# Get reconciliation report
report = client.reconciliation.get_report('recon_123')