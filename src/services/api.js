// Velvette Frontend API Client

const BASE_URL = ''; // Relative path handled by Vite proxy or backend

export async function fetchStoreData() {
  try {
    const res = await fetch(`${BASE_URL}/api/data`);
    if (!res.ok) throw new Error('Failed to fetch data');
    return await res.json();
  } catch (err) {
    console.error('Error fetching store data:', err);
    // Fallback to localStorage if server isn't reachable
    const local = localStorage.getItem('velvette_offline_db');
    if (local) return JSON.parse(local);
    throw err;
  }
}

export async function saveInvoice(invoice) {
  try {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (!res.ok) throw new Error('Failed to save invoice');
    return await res.json();
  } catch (err) {
    console.error('Error saving invoice:', err);
    throw err;
  }
}

export async function sendInvoiceEmail(invoice) {
  try {
    const res = await fetch(`${BASE_URL}/api/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice })
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('Error sending invoice email:', err);
    return { success: false, error: err.message };
  }
}

export async function saveDailyClosing(closingData) {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-closings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(closingData)
    });
    if (!res.ok) throw new Error('Failed to save daily closing');
    return await res.json();
  } catch (err) {
    console.error('Error closing shop:', err);
    throw err;
  }
}

export async function savePurchaseBill(billData) {
  try {
    const res = await fetch(`${BASE_URL}/api/purchase-bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    if (!res.ok) throw new Error('Failed to save purchase bill');
    return await res.json();
  } catch (err) {
    console.error('Error saving purchase bill:', err);
    throw err;
  }
}

export async function uploadFile(file, isBill = false) {
  const formData = new FormData();
  formData.append(isBill ? 'receipt' : 'file', file);
  const endpoint = isBill ? '/api/upload-bill' : '/api/upload';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('File upload failed');
  const data = await res.json();
  return isBill ? data.receiptUrl : data.url;
}

export async function ocrPurchaseBill(file) {
  const formData = new FormData();
  formData.append('receipt', file);
  const res = await fetch(`${BASE_URL}/api/ocr-bill`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('OCR process failed');
  return await res.json();
}

export async function saveProduct(product, action = 'create') {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, action })
  });
  if (!res.ok) throw new Error('Failed to save product');
  return await res.json();
}

export async function checkSupabaseStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/supabase-status`);
    return await res.json();
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
