import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, ShieldCheck, Mail, Send, Loader2, Sparkles } from 'lucide-react';
import { saveInvoice, sendInvoiceEmail } from '../services/api';

const UPI_ID = 'anshajshaji3-2@okicici';

export default function CheckoutModal({
  order,
  isOpen,
  onClose,
  onInvoiceGenerated
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    if (!isOpen || !order) return;

    // Generate dynamic UPI string
    const roundedAmount = Number(order.total || 0).toFixed(2);
    const invoiceNum = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const upiString = `upi://pay?pa=${UPI_ID}&pn=Velvette&am=${roundedAmount}&cu=INR&tn=Invoice%20${invoiceNum}`;

    QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1C0F17',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setEmailStatus('sending');

    try {
      // 1. Create invoice payload
      const invoiceNumber = 'VEL-' + Date.now().toString().slice(-6);
      const todayDate = new Date();
      const dayId = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const invoicePayload = {
        id: 'inv_' + Date.now(),
        invoiceNumber,
        dayId,
        createdAt: todayDate.toISOString(),
        customer: {
          name: order.customer?.name || 'Walk-in Guest',
          phone: order.customer?.phone || '',
          email: order.customer?.email || '',
          customerId: order.customer?.customerId || `VEL-${Math.floor(1000 + Math.random() * 9000)}`
        },
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          costPrice: item.costPrice || 0,
          quantity: item.quantity
        })),
        subtotal: order.subtotal,
        discountPercent: order.discountPercent,
        discountAmount: order.discountAmount,
        total: order.total,
        mode: order.mode,
        paymentMethod: 'Google Pay (UPI)',
        upiId: UPI_ID,
        status: 'PAID'
      };

      // 2. Save invoice to database (and day's sales)
      const saveRes = await saveInvoice(invoicePayload);

      // 3. Send email to customer via Resend if email is provided
      let emailResult = null;
      if (invoicePayload.customer.email) {
        emailResult = await sendInvoiceEmail(invoicePayload);
      }

      // 4. Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FB4692', '#FF70AA', '#FFD166', '#00BA88']
      });

      // Pass invoice up to parent to display
      onInvoiceGenerated(invoicePayload, emailResult);
    } catch (err) {
      console.error('Error in payment checkout:', err);
      alert('Error finalizing invoice: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card checkout-qr-modal">
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', marginBottom: 6 }}>
          <Sparkles size={18} />
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            UPI & Google Pay Checkout
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: 'var(--text-main)' }}>
          Scan to Pay ₹{Number(order.total || 0).toFixed(2)}
        </h2>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Scan with Google Pay, PhonePe, Paytm, or any UPI app.
        </p>

        {/* QR Code */}
        <div className="qr-code-wrapper">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Google Pay UPI QR Code" className="qr-code-img" />
          ) : (
            <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          )}
        </div>

        <div>
          <div className="upi-id-pill">
            <ShieldCheck size={16} />
            <span>UPI: {UPI_ID}</span>
          </div>
        </div>

        {/* Order Details Quick Summary */}
        <div style={{ margin: '18px 0', background: '#FCF6FA', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border-soft)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ fontWeight: 700 }}>{order.customer?.name || 'Guest'} ({order.customer?.customerId})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Email Receipt:</span>
            <span style={{ fontWeight: 600, color: order.customer?.email ? 'var(--primary)' : '#999' }}>
              {order.customer?.email || 'No email provided'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, paddingTop: 6, borderTop: '1px dashed var(--border-soft)', color: 'var(--primary)' }}>
            <span>Amount Received:</span>
            <span>₹{Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          type="button"
          className="btn-confirm-payment"
          onClick={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Saving & Dispatching Email...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Payment Received • Generate Invoice</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
