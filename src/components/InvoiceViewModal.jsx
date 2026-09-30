import React, { useState } from 'react';
import { X, Printer, Mail, Send, CheckCircle2, AlertCircle, Sparkles, Download } from 'lucide-react';
import { sendInvoiceEmail } from '../services/api';

export default function InvoiceViewModal({
  invoice,
  emailResult,
  isOpen,
  onClose
}) {
  const [resending, setResending] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    if (!invoice.customer?.email) {
      alert('No email attached to this customer.');
      return;
    }
    setResending(true);
    setEmailStatusMsg(null);

    const res = await sendInvoiceEmail(invoice);
    setResending(false);

    if (res.success) {
      setEmailStatusMsg({ type: 'success', text: 'Invoice email delivered via Resend!' });
    } else {
      setEmailStatusMsg({
        type: 'warning',
        text: res.message || 'Resend notice: Check sender/sandbox domain config.'
      });
    }
  };

  const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 660, padding: 0, overflow: 'hidden', background: '#FB4692', position: 'relative' }}>
        {/* Action Toolbar on Top (Hidden during print) */}
        <div className="btn-print-hide" style={{ padding: '12px 18px', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
            <Sparkles size={16} />
            <span>Invoice #{invoice.invoiceNumber}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#FFFFFF',
                color: '#FB4692',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>

            {invoice.customer?.email && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.5)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Mail size={14} />
                <span>{resending ? 'Sending...' : 'Resend'}</span>
              </button>
            )}

            {/* Dedicated Non-overlapping Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.9)',
                color: '#1C0F17',
                border: 'none',
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
              title="Close Invoice"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Email Notification Status */}
        {emailResult && !emailStatusMsg && (
          <div className="btn-print-hide" style={{ padding: '8px 20px', background: emailResult.success ? '#00BA88' : '#FF9E00', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
            {emailResult.success
              ? `✓ Sent via Resend to ${invoice.customer?.email}`
              : `✉ Resend: ${emailResult.message || 'Check recipient or domain in Resend'}`}
          </div>
        )}

        {emailStatusMsg && (
          <div className="btn-print-hide" style={{ padding: '8px 20px', background: emailStatusMsg.type === 'success' ? '#00BA88' : '#FF9E00', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
            {emailStatusMsg.text}
          </div>
        )}

        {/* ========================================================
            BARBIE PINK INVOICE WITH TOP WHITE BANNER & CENTERED LOGO
            ======================================================== */}
        <div style={{ padding: '24px', backgroundColor: '#FB4692' }}>
          
          {/* TOP WHITE BANNER WITH CENTERED LOGO */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px 20px', borderRadius: '20px 20px 0 0', textAlign: 'center', borderBottom: '3px solid #FB4692' }}>
            <img
              src="/logo.png"
              alt="Velvette Logo"
              style={{ maxHeight: '72px', maxWidth: '280px', objectFit: 'contain', display: 'inline-block' }}
            />
            <p style={{ margin: '6px 0 0 0', color: '#FB4692', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Official Customer Invoice & Receipt
            </p>
          </div>

          {/* INVOICE BODY CONTENT */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px 28px', borderRadius: '0 0 20px 20px', color: '#1C0F17' }}>
            
            {/* Meta Row: Billed To & Invoice Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingBottom: '18px', borderBottom: '1px solid #FFE0ED' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Billed To</p>
                <h4 style={{ margin: '4px 0 2px 0', fontSize: 17, color: '#1C0F17' }}>{invoice.customer?.name || 'Customer'}</h4>
                {invoice.customer?.phone && <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>Phone: {invoice.customer.phone}</p>}
                {invoice.customer?.email && <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>Email: {invoice.customer.email}</p>}
                <p style={{ margin: '4px 0 0 0', fontSize: 11, fontWeight: 700, color: '#888' }}>
                  Customer ID: {invoice.customer?.customerId || 'N/A'}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Invoice Details</p>
                <h4 style={{ margin: '4px 0 2px 0', fontSize: 17, color: '#FB4692' }}>#{invoice.invoiceNumber}</h4>
                <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>{dateStr}</p>
                
                <p style={{ margin: '4px 0 0 0', fontSize: 12, fontWeight: 700, color: invoice.paymentMethod === 'Cash' ? '#0C8A53' : '#1C0F17' }}>
                  Paid via {invoice.paymentMethod === 'Cash' ? 'Cash' : 'Google Pay'}
                </p>

                {invoice.mode === 'challenger' && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ display: 'inline-block', backgroundColor: '#FFF3E0', color: '#D97706', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                      Challenger Mode (+₹50)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div style={{ marginTop: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFF0F6', borderBottom: '1px solid #FFD4E5' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: '#FB4692' }}>Item Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, textTransform: 'uppercase', color: '#FB4692' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', color: '#FB4692' }}>Unit Price</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', color: '#FB4692' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #FFEBF2' }}>
                      <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 13, color: '#555' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, color: '#555' }}>₹{Number(item.price).toFixed(2)}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#FB4692' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div style={{ marginTop: 16, borderTop: '2px dashed #FFD4E5', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 4 }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#1C0F17' }}>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>

              {Number(invoice.discountPercent) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0C8A53', marginBottom: 4 }}>
                  <span>Discount ({invoice.discountPercent}%)</span>
                  <span style={{ fontWeight: 600 }}>- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: '#FB4692', marginTop: 8, paddingTop: 8, borderTop: '1px solid #FFE0ED' }}>
                <span>Grand Total</span>
                <span>₹{Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Clean Minimal Footer */}
            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: '#888', borderTop: '1px solid #F0EDF0', paddingTop: 14 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Thank you for shopping at Velvette.</p>
            </div>

          </div>
        </div>

        {/* Bottom Done Button (Hidden on Print) */}
        <div className="btn-print-hide" style={{ padding: '16px 24px', background: '#FFFFFF', textAlign: 'center', borderTop: '1px solid #FFD4E5' }}>
          <button
            type="button"
            className="btn-checkout"
            style={{ width: 'auto', padding: '10px 32px', margin: '0 auto' }}
            onClick={onClose}
          >
            Start New Order
          </button>
        </div>

      </div>
    </div>
  );
}
