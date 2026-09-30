import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import { parseReceiptText } from './ocrHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // .env might not exist in production or container
}

const app = express();
const PORT = process.env.PORT || 3001;

// Credentials from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihjpksrxjqgpulbwybci.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const DEFAULT_UPI_ID = process.env.DEFAULT_UPI_ID || 'anshajshaji3-2@okicici';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'dummy_key');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/public', express.static(path.join(rootDir, 'public')));

// Configure Multer for Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isBill = req.path.includes('bill');
    const folder = isBill ? path.join(rootDir, 'uploads', 'bills') : path.join(rootDir, 'uploads', 'products');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

// Database file path
const DB_FILE = path.join(__dirname, 'data', 'velvette_db.json');

// Initial Seed Products
const INITIAL_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Velvette Signature Pink Plushie Bear',
    category: 'Plushies',
    price: 499,
    costPrice: 220,
    image: '/public/logo.png',
    stock: 50,
    description: 'Iconic ultra-soft plush bear with velvety feel and heart detail'
  },
  {
    id: 'prod_2',
    name: 'Velvette Twin Gummy Bears Charm',
    category: 'Accessories',
    price: 249,
    costPrice: 95,
    image: '/public/logo.png',
    stock: 75,
    description: 'Double pink gummy bear keychain with ribbon bow'
  },
  {
    id: 'prod_3',
    name: 'Barbie Velvet Bow Scrunchie Set',
    category: 'Accessories',
    price: 199,
    costPrice: 70,
    image: '/public/logo.png',
    stock: 60,
    description: 'Pack of 3 premium silky velvet hair scrunchies'
  },
  {
    id: 'prod_4',
    name: 'Velvette Candy Pink Cropped Hoodie',
    category: 'Apparel',
    price: 1299,
    costPrice: 650,
    image: '/public/logo.png',
    stock: 30,
    description: 'Heavyweight cozy fleece hoodie with embossed 3D logo'
  },
  {
    id: 'prod_5',
    name: 'Velvette Bubble Tea Tumbler (Pink)',
    category: 'Lifestyle',
    price: 399,
    costPrice: 160,
    image: '/public/logo.png',
    stock: 40,
    description: 'Insulated double-wall tumbler with reusable glass straw'
  },
  {
    id: 'prod_6',
    name: 'Velvette Sweetheart Tote Bag',
    category: 'Apparel',
    price: 449,
    costPrice: 180,
    image: '/public/logo.png',
    stock: 45,
    description: 'Canvas tote with pink velvet lettering and bear print'
  }
];

// Helper to load DB
function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        products: INITIAL_PRODUCTS,
        customers: [
          {
            id: 'cust_1',
            customerId: 'VEL-1001',
            name: 'Priya Sharma',
            phone: '9876543210',
            email: 'priya.test@velvette.in',
            totalVisits: 1,
            totalSpent: 499,
            createdAt: new Date().toISOString()
          }
        ],
        invoices: [],
        dailyClosings: [],
        purchaseBills: [],
        settings: {
          username: 'admin',
          password: 'velvette123',
          upiId: DEFAULT_UPI_ID,
          challengerExtra: 50,
          storeName: 'Velvette Store',
          resendFrom: 'Velvette <onboarding@resend.dev>'
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading DB:', err);
    return { products: INITIAL_PRODUCTS, customers: [], invoices: [], dailyClosings: [], purchaseBills: [], settings: {} };
  }
}

// Helper to save DB
function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Convert Logo to base64 or public web link for email
function getLogoBase64() {
  try {
    const logoPath = path.join(rootDir, 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
  } catch (e) {
    console.error('Error reading logo for email:', e);
  }
  return '';
}

// Generate Clean, Minimal Invoice HTML template for email
function generateInvoiceEmailHtml(invoice) {
  const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const itemsRows = (invoice.items || []).map(item => `
    <tr style="border-bottom: 1px solid #F0EDF0;">
      <td style="padding: 12px 8px; font-weight: 600; color: #1F121E; font-size: 13px;">${item.name}</td>
      <td style="padding: 12px 8px; text-align: center; color: #666; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #666; font-size: 13px;">₹${Number(item.price).toFixed(2)}</td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #1F121E; font-size: 13px;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Velvette Receipt #${invoice.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #F7F5F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C0F17;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #EBE4E8; overflow: hidden;">
        
        <!-- MINIMAL WHITE HEADER -->
        <div style="padding: 30px 24px 20px; text-align: center; border-bottom: 1px solid #F0EDF0;">
          <h1 style="color: #FB4692; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 3px;">VELVETTE</h1>
          <p style="margin: 6px 0 0 0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Receipt #${invoice.invoiceNumber}</p>
        </div>

        <!-- DETAILS ROW -->
        <div style="padding: 24px 24px 18px; border-bottom: 1px solid #F0EDF0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top; width: 55%;">
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700;">Customer</p>
                <div style="font-weight: 700; font-size: 14px; color: #1F121E;">${invoice.customer?.name || 'Customer'}</div>
                ${invoice.customer?.phone ? `<div style="font-size: 12px; color: #555; margin-top: 2px;">Phone: ${invoice.customer.phone}</div>` : ''}
                ${invoice.customer?.email ? `<div style="font-size: 12px; color: #555; margin-top: 2px;">Email: ${invoice.customer.email}</div>` : ''}
                <div style="font-size: 11px; color: #888; margin-top: 3px;">ID: ${invoice.customer?.customerId || 'N/A'}</div>
              </td>
              <td style="vertical-align: top; text-align: right; width: 45%;">
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700;">Order Details</p>
                <div style="font-size: 12px; color: #555;">${dateStr}</div>
                <div style="font-size: 12px; color: #1F121E; font-weight: 600; margin-top: 4px;">Paid via Google Pay</div>
                ${invoice.mode === 'challenger' ? `<div style="font-size: 11px; color: #D97706; font-weight: 700; margin-top: 2px;">Challenger Mode</div>` : ''}
              </td>
            </tr>
          </table>
        </div>

        <!-- ITEMS TABLE -->
        <div style="padding: 20px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1.5px solid #EBE4E8;">
                <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700;">Item</th>
                <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700;">Qty</th>
                <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700;">Price</th>
                <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- TOTALS SUMMARY -->
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #EBE4E8;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #666; font-size: 13px;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right; font-size: 13px; font-weight: 600; color: #1F121E;">₹${Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
              ${Number(invoice.discountPercent) > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #0C8A53; font-size: 13px;">Discount (${invoice.discountPercent}%)</td>
                <td style="padding: 4px 0; text-align: right; font-size: 13px; font-weight: 600; color: #0C8A53;">- ₹${Number(invoice.discountAmount).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1px solid #F0EDF0;">
                <td style="padding: 12px 0 4px; font-size: 16px; font-weight: 800; color: #1F121E;">Total</td>
                <td style="padding: 12px 0 4px; text-align: right; font-size: 18px; font-weight: 800; color: #FB4692;">₹${Number(invoice.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- MINIMAL CLEAN FOOTER -->
        <div style="padding: 18px 24px; text-align: center; border-top: 1px solid #F0EDF0; background-color: #FAFAFA;">
          <p style="margin: 0; font-size: 12px; color: #777;">Thank you for shopping at Velvette.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

// ---------------------- ROUTES ----------------------

// 1. Send Invoice Email via Resend
app.post('/api/send-invoice', async (req, res) => {
  const { invoice } = req.body;
  if (!invoice || !invoice.customer?.email) {
    return res.status(400).json({ success: false, error: 'Recipient email is missing' });
  }

  const recipientEmail = invoice.customer.email.trim();
  const db = loadDb();
  const resendFrom = db.settings?.resendFrom || 'Velvette <onboarding@resend.dev>';

  try {
    const htmlContent = generateInvoiceEmailHtml(invoice);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [recipientEmail],
        subject: `Your Velvette Receipt #${invoice.invoiceNumber}`,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('Resend API response warning:', data);
      // If Resend test account restriction (only send to account owner), report clearly
      return res.status(200).json({
        success: false,
        warning: true,
        message: data.message || 'Resend restricted sending (sandbox domain requirement)',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice email delivered via Resend!',
      data
    });
  } catch (err) {
    console.error('Error dispatching invoice email:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch All Store Data
app.get('/api/data', (req, res) => {
  const db = loadDb();
  res.json({
    products: db.products || [],
    customers: db.customers || [],
    invoices: db.invoices || [],
    dailyClosings: db.dailyClosings || [],
    purchaseBills: db.purchaseBills || [],
    settings: db.settings || {}
  });
});

// 3. Save / Update Full Store Data
app.post('/api/data', (req, res) => {
  const updatedData = req.body;
  if (!updatedData) {
    return res.status(400).json({ error: 'No data provided' });
  }
  const db = loadDb();
  const merged = { ...db, ...updatedData };
  saveDb(merged);
  res.json({ success: true, message: 'Data saved successfully' });
});

// 4. Save Invoice & Update Customer History
app.post('/api/invoices', async (req, res) => {
  const invoice = req.body;
  if (!invoice || !invoice.invoiceNumber) {
    return res.status(400).json({ error: 'Invalid invoice payload' });
  }

  const db = loadDb();
  db.invoices = db.invoices || [];
  db.customers = db.customers || [];

  // Add invoice
  db.invoices.unshift(invoice);

  // Update or insert customer
  const phone = (invoice.customer?.phone || '').trim();
  if (phone) {
    const existingIndex = db.customers.findIndex(c => c.phone === phone);
    if (existingIndex >= 0) {
      db.customers[existingIndex].name = invoice.customer.name || db.customers[existingIndex].name;
      db.customers[existingIndex].email = invoice.customer.email || db.customers[existingIndex].email;
      db.customers[existingIndex].totalVisits = (db.customers[existingIndex].totalVisits || 0) + 1;
      db.customers[existingIndex].totalSpent = (db.customers[existingIndex].totalSpent || 0) + Number(invoice.total || 0);
      db.customers[existingIndex].lastVisit = new Date().toISOString();
      invoice.customer.customerId = db.customers[existingIndex].customerId;
    } else {
      const newCust = {
        id: 'cust_' + Date.now(),
        customerId: invoice.customer.customerId || `VEL-${Math.floor(1000 + Math.random() * 9000)}`,
        name: invoice.customer.name,
        phone,
        email: invoice.customer.email,
        totalVisits: 1,
        totalSpent: Number(invoice.total || 0),
        createdAt: new Date().toISOString(),
        lastVisit: new Date().toISOString()
      };
      invoice.customer.customerId = newCust.customerId;
      db.customers.push(newCust);
    }
  }

  saveDb(db);

  // Try optional Supabase sync in background
  try {
    supabase.from('invoices').insert([invoice]).then(({ error }) => {
      if (error) console.log('Supabase sync notice:', error.message);
    });
  } catch (e) {}

  res.json({ success: true, invoice, customerId: invoice.customer?.customerId });
});

// 5. Close Shop for Today
app.post('/api/daily-closings', (req, res) => {
  const closingRecord = req.body;
  if (!closingRecord || !closingRecord.dayId) {
    return res.status(400).json({ error: 'Missing dayId' });
  }

  const db = loadDb();
  db.dailyClosings = db.dailyClosings || [];

  // Replace if already closed today or add
  const existingIdx = db.dailyClosings.findIndex(c => c.dayId === closingRecord.dayId);
  if (existingIdx >= 0) {
    db.dailyClosings[existingIdx] = closingRecord;
  } else {
    db.dailyClosings.unshift(closingRecord);
  }

  saveDb(db);
  res.json({ success: true, closing: closingRecord });
});

// 6. Save Purchase Bill
app.post('/api/purchase-bills', (req, res) => {
  const bill = req.body;
  if (!bill) {
    return res.status(400).json({ error: 'Missing bill data' });
  }
  const db = loadDb();
  db.purchaseBills = db.purchaseBills || [];
  db.purchaseBills.unshift(bill);
  saveDb(db);
  res.json({ success: true, bill });
});

// 7. Product Management (Save/Edit/Delete)
app.post('/api/products', (req, res) => {
  const { product, action } = req.body;
  const db = loadDb();
  db.products = db.products || [];

  if (action === 'delete') {
    db.products = db.products.filter(p => p.id !== product.id);
  } else if (action === 'update') {
    const idx = db.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...product };
    }
  } else {
    // Add new
    const newProd = {
      ...product,
      id: product.id || 'prod_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    db.products.push(newProd);
  }

  saveDb(db);
  res.json({ success: true, products: db.products });
});

// 8. Image Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const isBill = req.path.includes('bill');
  const relativePath = `/uploads/${isBill ? 'bills' : 'products'}/${req.file.filename}`;
  res.json({ success: true, url: relativePath });
});

// 9. Upload Purchase Bill with File
app.post('/api/upload-bill', upload.single('receipt'), (req, res) => {
  const receiptUrl = req.file ? `/uploads/bills/${req.file.filename}` : null;
  res.json({ success: true, receiptUrl });
});

// 9b. OCR Purchase Bill Endpoint (Auto extracts Total, Vendor, Date, Bill Number)
app.post('/api/ocr-bill', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No receipt file provided' });
  }

  const receiptUrl = `/uploads/bills/${req.file.filename}`;
  const filePath = req.file.path;

  try {
    console.log('Running OCR on receipt:', filePath);
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    console.log('OCR text extracted:', text.slice(0, 100));

    const parsed = parseReceiptText(text);

    return res.json({
      success: true,
      receiptUrl,
      rawText: text,
      extractedTotal: parsed.total,
      extractedBillNumber: parsed.billNumber,
      extractedDate: parsed.date,
      extractedVendor: parsed.vendor
    });
  } catch (err) {
    console.error('OCR processing error:', err);
    return res.json({
      success: false,
      receiptUrl,
      error: err.message,
      fallback: true
    });
  }
});

// 10. Test Supabase Endpoint & Provide SQL Schema
app.get('/api/supabase-status', async (req, res) => {
  try {
    const { data, error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });
    if (error) {
      return res.json({ connected: true, tablesReady: false, error: error.message });
    }
    return res.json({ connected: true, tablesReady: true, count: data });
  } catch (err) {
    return res.json({ connected: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🌸 Velvette POS Server running on http://localhost:${PORT}`);
  loadDb(); // Ensure db initialized
});
