// Helper for parsing OCR text from receipts and supplier purchase bills

export function parseReceiptText(text) {
  if (!text || typeof text !== 'string') {
    return { total: null, billNumber: null, date: null, vendor: null, rawText: '' };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let extractedTotal = null;
  let extractedBillNumber = null;
  let extractedDate = null;
  let extractedVendor = null;

  // 1. Detect Vendor from the top lines (excluding generic words like TAX INVOICE, CASH MEMO)
  const genericHeaders = ['TAX INVOICE', 'INVOICE', 'RECEIPT', 'CASH MEMO', 'BILL', 'ORIGINAL', 'RETAIL INVOICE'];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const isGeneric = genericHeaders.some(g => line.toUpperCase().includes(g));
    if (!isGeneric && line.length > 2 && !line.match(/^\d+$/)) {
      extractedVendor = line;
      break;
    }
  }

  // 2. Detect Date
  // Formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY
  const dateMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (dateMatch) {
    try {
      const parts = dateMatch[1].split(/[-/]/);
      if (parts.length === 3) {
        let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        let m = parts[1].padStart(2, '0');
        let d = parts[0].padStart(2, '0');
        if (parts[0].length === 4) {
          y = parts[0];
          m = parts[1].padStart(2, '0');
          d = parts[2].padStart(2, '0');
        }
        extractedDate = `${y}-${m}-${d}`;
      }
    } catch (e) {
      extractedDate = dateMatch[1];
    }
  }

  // 3. Detect Invoice / Bill Number
  const billNumMatch = text.match(/(?:Invoice|Bill|Inv|Receipt|Ref)[\s#.:No]+([A-Za-z0-9\/-]+)/i);
  if (billNumMatch && billNumMatch[1].length > 1) {
    extractedBillNumber = billNumMatch[1].replace(/[^A-Za-z0-9\/-]/g, '');
  }

  // 4. Detect Total Amount
  const totalKeywordsRegex = /(?:Grand\s*Total|Total\s*Amount|Net\s*Amount|Net\s*Payable|Total\s*Due|Bill\s*Amount|Invoice\s*Total|TOTAL|Total|AMOUNT|Amount|Balance\s*Due)[\s:=₹RsINR.]*([0-9,]+\.?[0-9]{0,2})/gi;
  let match;
  const potentialTotals = [];

  while ((match = totalKeywordsRegex.exec(text)) !== null) {
    if (match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        potentialTotals.push(num);
      }
    }
  }

  if (potentialTotals.length > 0) {
    extractedTotal = potentialTotals[potentialTotals.length - 1];
  } else {
    // Fallback: look for numbers with 2 decimals
    const numberMatches = text.match(/(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2}))/g);
    if (numberMatches && numberMatches.length > 0) {
      const numbers = numberMatches.map(m => {
        const cleaned = m.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned);
      }).filter(n => !isNaN(n) && n > 0);

      if (numbers.length > 0) {
        extractedTotal = Math.max(...numbers);
      }
    }
  }

  return {
    total: extractedTotal,
    billNumber: extractedBillNumber,
    date: extractedDate,
    vendor: extractedVendor,
    rawText: text
  };
}
