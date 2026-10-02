import { compressImageToDataUrl } from '../utils/imageHelper';

// Velvette Frontend API Client

const BASE_URL = ''; // Relative path handled by Vite proxy or backend

export async function fetchStoreData() {
  try {
    const res = await fetch(`${BASE_URL}/api/data`);
    if (!res.ok) throw new Error('Failed to fetch data');
    const data = await res.json();
    if (data) {
      try {
        localStorage.setItem('velvette_offline_db', JSON.stringify(data));
      } catch (e) {}
    }
    return data;
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
  // 1. Instantly compress and convert to lightweight Data URL (persists without 404s)
  let dataUrl = null;
  try {
    dataUrl = await compressImageToDataUrl(file, isBill ? 1000 : 600, 0.85);
  } catch (err) {
    console.warn('Local compression notice:', err);
  }

  // 2. Also send to server upload endpoint
  try {
    const formData = new FormData();
    formData.append(isBill ? 'receipt' : 'file', file);
    const endpoint = isBill ? '/api/upload-bill' : '/api/upload';

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      // If we have a dataUrl, prefer that so it never 404s on ephemeral Vercel containers
      return dataUrl || (isBill ? data.receiptUrl : (data.dataUrl || data.url));
    }
  } catch (err) {
    console.warn('Server upload notice, using persistent data URL:', err);
  }

  return dataUrl || '/logo.png';
}

export async function ocrPurchaseBill(file) {
  const formData = new FormData();
  formData.append('receipt', file);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/api/ocr-bill`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('OCR response status ' + res.status);
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('OCR request error or timeout:', err.message);
    return {
      success: false,
      fallback: true,
      error: err.name === 'AbortError' ? 'Scan timed out' : err.message
    };
  }
}

export async function saveProduct(product, action = 'create') {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, action })
  });
  if (!res.ok) throw new Error('Failed to save product');
  const result = await res.json();
  
  // Sync to offline cache
  try {
    const local = localStorage.getItem('velvette_offline_db');
    if (local) {
      const parsed = JSON.parse(local);
      parsed.products = result.products;
      localStorage.setItem('velvette_offline_db', JSON.stringify(parsed));
    }
  } catch (e) {}

  return result;
}

export async function checkSupabaseStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/supabase-status`);
    return await res.json();
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
