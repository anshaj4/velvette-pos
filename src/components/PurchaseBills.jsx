import React, { useState } from 'react';
import { 
  Receipt, Plus, Upload, FileText, Image as ImageIcon, 
  Calendar, DollarSign, Check, ExternalLink, Sparkles, 
  Scan, Loader2, ChevronDown, ChevronUp, AlertCircle, Camera 
} from 'lucide-react';
import { savePurchaseBill, uploadFile, ocrPurchaseBill } from '../services/api';
import CameraCaptureModal from './CameraCaptureModal';

export default function PurchaseBills({
  purchaseBills = [],
  onBillAdded
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Form fields
  const [vendor, setVendor] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  
  // OCR States
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrSuccessInfo, setOcrSuccessInfo] = useState(null);
  const [ocrRawText, setOcrRawText] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Total spent across all purchase bills
  const totalBillsSpent = purchaseBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const resetForm = () => {
    setVendor('');
    setBillNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setItemsDescription('');
    setSelectedFile(null);
    setFilePreview('');
    setReceiptUrl('');
    setOcrSuccessInfo(null);
    setOcrRawText('');
    setShowRawOcr(false);
    setShowCameraModal(false);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Reusable OCR process for files or live camera photos
  const processReceiptFile = async (file) => {
    if (!file) return;

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setIsScanningOcr(true);
    setOcrSuccessInfo(null);
    setOcrRawText('');

    try {
      const res = await ocrPurchaseBill(file);
      if (res && res.receiptUrl) {
        setReceiptUrl(res.receiptUrl);
      } else {
        // Fallback upload file directly
        try {
          const directUrl = await uploadFile(file, true);
          if (directUrl) setReceiptUrl(directUrl);
        } catch (upErr) {
          console.warn('Fallback direct upload warning:', upErr);
        }
      }

      if (res && res.success) {
        let extractedCount = 0;

        // Auto extract Total
        if (res.extractedTotal) {
          setAmount(res.extractedTotal);
          extractedCount++;
        }

        // Auto extract Bill Number
        if (res.extractedBillNumber && !billNumber) {
          setBillNumber(res.extractedBillNumber);
          extractedCount++;
        }

        // Auto extract Date
        if (res.extractedDate) {
          setDate(res.extractedDate);
          extractedCount++;
        }

        // Auto extract Vendor
        if (res.extractedVendor && !vendor) {
          setVendor(res.extractedVendor);
          extractedCount++;
        }

        setOcrRawText(res.rawText || '');
        setOcrSuccessInfo({
          total: res.extractedTotal,
          billNumber: res.extractedBillNumber,
          date: res.extractedDate,
          vendor: res.extractedVendor,
          extractedCount
        });
      } else {
        console.warn('OCR notice:', res?.error || 'Manual entry active');
      }
    } catch (err) {
      console.warn('OCR processing notice:', err.message);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processReceiptFile(file);
  };

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    if (!vendor || !amount) {
      alert('Please provide Vendor Name and Bill Amount.');
      return;
    }

    setIsSaving(true);
    try {
      let finalReceiptUrl = receiptUrl;
      if (!finalReceiptUrl && selectedFile) {
        finalReceiptUrl = await uploadFile(selectedFile, true);
      }

      const billPayload = {
        id: 'bill_' + Date.now(),
        vendor,
        billNumber: billNumber || `BILL-${Date.now().toString().slice(-4)}`,
        date,
        amount: Number(amount),
        itemsDescription,
        receiptUrl: finalReceiptUrl,
        ocrRawText: ocrRawText || null,
        createdAt: new Date().toISOString()
      };

      await savePurchaseBill(billPayload);
      onBillAdded(billPayload);

      resetForm();
      setShowAddModal(false);
    } catch (err) {
      alert('Error saving bill: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'var(--primary-pastel)', color: 'var(--primary)', padding: 12, borderRadius: 14 }}>
            <Receipt size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: 0 }}>
              Purchase Bills & OCR Receipt Scanning
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Upload receipts to auto-extract totals via AI OCR, or manually record supplier invoices.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Purchases Recorded</span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
              ₹{totalBillsSpent.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            className="btn-checkout"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}
            onClick={handleOpenModal}
          >
            <Plus size={16} />
            <span>Add / Scan Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Grid / Table */}
      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)' }}>
        {purchaseBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 10px', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: 10 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>No purchase bills uploaded yet</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Click "Add / Scan Bill" above to scan your first receipt.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF0F6', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Vendor / Supplier</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Bill / Ref #</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Items / Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Amount (₹)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Receipt Attachment</th>
                </tr>
              </thead>
              <tbody>
                {purchaseBills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #FAF0F5' }}>
                    <td style={{ padding: '14px', fontSize: 13, fontWeight: 600 }}>{bill.date}</td>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{bill.vendor}</td>
                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-muted)' }}>{bill.billNumber}</td>
                    <td style={{ padding: '14px', fontSize: 13, color: '#555', maxWidth: 280 }}>{bill.itemsDescription || '—'}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: 'var(--text-main)', fontSize: 15 }}>
                      ₹{Number(bill.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      {bill.receiptUrl ? (
                        <a
                          href={bill.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#FFF0F6',
                            color: 'var(--primary)',
                            padding: '4px 10px',
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <ImageIcon size={13} />
                          <span>View Receipt</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: '#aaa' }}>Manual bill (No receipt)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Scan Purchase Bill with OCR */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 580, padding: 26 }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ background: '#FFF0F6', color: 'var(--primary)', padding: 6, borderRadius: 8 }}>
                <Scan size={20} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: 0 }}>
                Record Purchase Bill
              </h2>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Upload receipt to auto-extract total via OCR, or enter manually below.
            </p>

            {/* OCR Upload Area */}
            <div style={{
              background: '#FFF9FC',
              border: '2px dashed var(--border-strong)',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'center',
              marginBottom: 16,
              position: 'relative'
            }}>
              <input
                type="file"
                id="receipt-file-input"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {isScanningOcr ? (
                <div style={{ padding: '10px 0' }}>
                  <Loader2 className="animate-spin" size={28} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                    🤖 Reading receipt text with OCR...
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                    Extracting Grand Total, Vendor, Date, and Bill Number.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#FFF0F6',
                        border: '1.5px solid var(--border-strong)',
                        padding: '9px 18px',
                        borderRadius: 20,
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Camera size={16} />
                      <span>Snap Receipt with Camera</span>
                    </button>

                    <label htmlFor="receipt-file-input" style={{ cursor: 'pointer', display: 'inline-block' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1.5px solid var(--border-soft)', padding: '9px 18px', borderRadius: 20, color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, boxShadow: 'var(--shadow-sm)' }}>
                        <Upload size={15} />
                        <span>{selectedFile ? 'Change Receipt File' : 'Upload Receipt File'}</span>
                      </div>
                    </label>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                    Take a live picture of any bill or upload PNG, JPG, or PDF.
                  </p>
                </div>
              )}

              {/* OCR Detection Banner */}
              {ocrSuccessInfo && (
                <div style={{
                  marginTop: 12,
                  background: '#E8FBF2',
                  border: '1px solid #A4E8CD',
                  borderRadius: 12,
                  padding: '10px 14px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0C8A53', fontWeight: 800, fontSize: 12 }}>
                    <Sparkles size={14} />
                    <span>OCR Extracted Successfully!</span>
                  </div>

                  <div style={{ marginTop: 4, fontSize: 12, color: '#1C0F17' }}>
                    {ocrSuccessInfo.total && (
                      <div>✓ <strong>Total Amount:</strong> ₹{ocrSuccessInfo.total}</div>
                    )}
                    {ocrSuccessInfo.vendor && (
                      <div>✓ <strong>Vendor:</strong> {ocrSuccessInfo.vendor}</div>
                    )}
                    {ocrSuccessInfo.billNumber && (
                      <div>✓ <strong>Bill #:</strong> {ocrSuccessInfo.billNumber}</div>
                    )}
                    <span style={{ fontSize: 11, color: '#0C8A53', marginTop: 2, display: 'block' }}>
                      Fields populated below. You can verify or edit manually anytime.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Form with Manual Override */}
            <form onSubmit={handleSubmitBill} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="e.g. 14750"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}
                  />
                </div>

                <div className="field-group">
                  <label>Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Vendor / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat Fabrics Co."
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Bill / Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SF-2026/894"
                    value={billNumber}
                    onChange={e => setBillNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Items Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 50 meters pink velvet fabric, 100 teddy eyes"
                  value={itemsDescription}
                  onChange={e => setItemsDescription(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-soft)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Collapsible Raw OCR Text */}
              {ocrRawText && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRawOcr(!showRawOcr)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <span>{showRawOcr ? 'Hide Raw OCR Text' : 'View Scanned OCR Text'}</span>
                    {showRawOcr ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showRawOcr && (
                    <pre style={{
                      marginTop: 6,
                      background: '#1F121E',
                      color: '#FFD4E5',
                      padding: 10,
                      borderRadius: 10,
                      fontSize: 10,
                      maxHeight: 100,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {ocrRawText}
                    </pre>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="btn-checkout"
                disabled={isSaving || isScanningOcr}
                style={{ marginTop: 6 }}
              >
                <span>{isSaving ? 'Saving Purchase Bill...' : 'Confirm & Save Purchase Bill'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder for Receipts */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Snap Bill / Receipt Photo"
        onCapture={(file) => {
          processReceiptFile(file);
        }}
      />
    </div>
  );
}
