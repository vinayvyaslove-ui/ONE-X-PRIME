// GST Calculator Module
class GSTCalculator {
    constructor() {
        this.gstRates = this.loadGSTRates();
        this.calculationMethods = {
            'cgst_sgst': {
                name: 'CGST + SGST',
                description: 'For intra-state transactions',
                components: [
                    { name: 'CGST', rate: 9 },
                    { name: 'SGST', rate: 9 }
                ]
            },
            'igst': {
                name: 'IGST',
                description: 'For inter-state transactions',
                components: [
                    { name: 'IGST', rate: 18 }
                ]
            }
        };
    }

    loadGSTRates() {
        // Load from config or use defaults
        return {
            '0': 'Exempt',
            '5': '5%',
            '12': '12%',
            '18': '18%',
            '28': '28%'
        };
    }

    calculate(amount, gstRate, method = 'cgst_sgst') {
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const rate = this.parseGSTRate(gstRate);
        const calculationMethod = this.calculationMethods[method];
        
        if (!calculationMethod) {
            throw new Error('Invalid calculation method');
        }

        const gstAmount = (amount * rate) / 100;
        const totalAmount = amount + gstAmount;
        
        const components = calculationMethod.components.map(component => {
            const componentAmount = (gstAmount * component.rate) / rate;
            return {
                name: component.name,
                rate: component.rate,
                amount: componentAmount
            };
        });

        return {
            originalAmount: amount,
            gstRate: rate,
            gstAmount: gstAmount,
            totalAmount: totalAmount,
            method: calculationMethod.name,
            components: components,
            breakdown: {
                subtotal: amount,
                gst: gstAmount,
                total: totalAmount
            }
        };
    }

    parseGSTRate(rate) {
        if (typeof rate === 'string') {
            // Remove percentage sign and convert to number
            const num = parseFloat(rate.replace('%', ''));
            return isNaN(num) ? 18 : num;
        }
        return typeof rate === 'number' ? rate : 18;
    }

    reverseCalculate(totalAmount, gstRate, method = 'cgst_sgst') {
        const rate = this.parseGSTRate(gstRate);
        const baseAmount = (totalAmount * 100) / (100 + rate);
        const gstAmount = totalAmount - baseAmount;
        
        return this.calculate(baseAmount, gstRate, method);
    }

    calculateForItems(items, method = 'cgst_sgst') {
        let subtotal = 0;
        let totalGST = 0;
        let itemDetails = [];

        items.forEach((item, index) => {
            const rate = this.parseGSTRate(item.gstRate || 18);
            const itemGST = (item.amount * rate) / 100;
            const itemTotal = item.amount + itemGST;
            
            subtotal += item.amount;
            totalGST += itemGST;
            
            itemDetails.push({
                ...item,
                gstRate: rate,
                gstAmount: itemGST,
                totalAmount: itemTotal
            });
        });

        const totalAmount = subtotal + totalGST;
        const calculationMethod = this.calculationMethods[method];
        
        const components = calculationMethod.components.map(component => {
            const componentAmount = (totalGST * component.rate) / 18; // Assuming 18% total
            return {
                name: component.name,
                rate: component.rate,
                amount: componentAmount
            };
        });

        return {
            items: itemDetails,
            summary: {
                subtotal: subtotal,
                gst: totalGST,
                total: totalAmount
            },
            method: calculationMethod.name,
            components: components,
            breakdown: {
                itemCount: items.length,
                averageGSTRate: totalGST / subtotal * 100
            }
        };
    }

    getGSTRateForCategory(category) {
        const categoryRates = {
            'food': 0,
            'books': 0,
            'clothing': 5,
            'electronics': 18,
            'services': 18,
            'luxury': 28,
            'default': 18
        };

        return categoryRates[category.toLowerCase()] || categoryRates.default;
    }

    validateGSTIN(gstin) {
        // Basic GSTIN validation
        const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinPattern.test(gstin);
    }

    calculateQuarterlyReturn(sales, purchases, expenses) {
        const salesSummary = this.summarizeTransactions(sales);
        const purchaseSummary = this.summarizeTransactions(purchases);
        const expenseSummary = this.summarizeTransactions(expenses);

        const outputTax = salesSummary.totalGST;
        const inputTax = purchaseSummary.totalGST + expenseSummary.totalGST;
        const netTaxLiability = outputTax - inputTax;

        return {
            period: new Date().toISOString().split('T')[0],
            sales: salesSummary,
            purchases: purchaseSummary,
            expenses: expenseSummary,
            taxSummary: {
                outputTax: outputTax,
                inputTax: inputTax,
                netTaxLiability: Math.max(0, netTaxLiability),
                inputTaxCredit: Math.max(0, inputTax - outputTax),
                payable: Math.max(0, netTaxLiability)
            },
            documents: {
                salesCount: sales.length,
                purchaseCount: purchases.length,
                expenseCount: expenses.length
            }
        };
    }

    summarizeTransactions(transactions) {
        let totalAmount = 0;
        let totalGST = 0;
        const rateSummary = {};

        transactions.forEach(transaction => {
            totalAmount += transaction.amount || 0;
            const gstAmount = transaction.gstAmount || 0;
            totalGST += gstAmount;

            const rateKey = `${transaction.gstRate || 18}%`;
            if (!rateSummary[rateKey]) {
                rateSummary[rateKey] = {
                    count: 0,
                    amount: 0,
                    gst: 0
                };
            }
            rateSummary[rateKey].count++;
            rateSummary[rateKey].amount += transaction.amount || 0;
            rateSummary[rateKey].gst += gstAmount;
        });

        return {
            totalAmount: totalAmount,
            totalGST: totalGST,
            totalWithGST: totalAmount + totalGST,
            rateSummary: rateSummary,
            averageGSTRate: totalAmount > 0 ? (totalGST / totalAmount) * 100 : 0
        };
    }

    generateGSTR1Data(invoices) {
        const gstr1Data = {
            b2b: [],
            b2cs: [],
            exports: [],
            summary: {
                totalTaxableValue: 0,
                totalTaxLiability: 0
            }
        };

        invoices.forEach(invoice => {
            const invoiceData = {
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.date,
                customerGSTIN: invoice.customerGSTIN,
                taxableValue: invoice.subtotal,
                taxAmount: invoice.gstAmount || 0,
                totalAmount: invoice.totalAmount,
                items: invoice.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.unitPrice,
                    amount: item.amount,
                    gstRate: item.gstRate,
                    gstAmount: item.gstAmount
                }))
            };

            // Categorize based on GSTIN
            if (invoice.customerGSTIN && this.validateGSTIN(invoice.customerGSTIN)) {
                gstr1Data.b2b.push(invoiceData);
            } else {
                gstr1Data.b2cs.push(invoiceData);
            }

            gstr1Data.summary.totalTaxableValue += invoice.subtotal;
            gstr1Data.summary.totalTaxLiability += invoice.gstAmount || 0;
        });

        return gstr1Data;
    }

    // Helper method for common calculations
    static getCommonRates() {
        return [
            { value: 0, label: '0% - Exempt' },
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' }
        ];
    }

    // Format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GSTCalculator;
} else {
    window.GSTCalculator = GSTCalculator;
}