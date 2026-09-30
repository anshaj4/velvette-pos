import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle2, ShieldCheck, Mail, Send, Loader2, Sparkles, 
  Banknote, Smartphone, ArrowRight, CornerDownLeft 
} from 'lucide-react';
import { saveInvoice, sendInvoiceEmail } from '../services/api';

const UPI_ID = 'anshajshaji3-2@okicici';

export default function CheckoutModal({
  order,
  isOpen,
  onClose,
  onInvoiceGenerated
}) {
  const [activeTab, setActiveTab] = useState('gpay'); // 'gpay' | 'cash'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [cashTendered, setCashTendered] = useState('');

  const totalAmount = Number(order?.total || 0);

  useEffect(() => {
    if (!isOpen || !order) return;
    setCashTendered(Math.ceil(totalAmount).toString());
    setShowMethodModal(false);

    // Generate dynamic UPI string
    const roundedAmount = totalAmount.toFixed(2);
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

  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  const handleConfirmPayment = async (selectedMethod) => {
    setIsProcessing(true);
    setEmailStatus('sending');
    setShowMethodModal(false);

    try {
      // 1. Create invoice payload
      const invoiceNumber = 'VEL-' + Date.now().toString().slice(-6);
      const todayDate = new Date();
      const dayId = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const finalMethod = selectedMethod === 'Cash' ? 'Cash' : 'Google Pay';

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
        paymentMethod: finalMethod,
        cashTendered: finalMethod === 'Cash' ? tenderedNum : null,
        changeGiven: finalMethod === 'Cash' ? changeDue : null,
        upiId: finalMethod === 'Cash' ? null : UPI_ID,
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
      <div className="modal-card checkout-qr-modal" style={{ position: 'relative' }}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Top Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', marginBottom: 6 }}>
          <Sparkles size={18} />
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Payment & Checkout
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 14px 0' }}>
          Total Due: ₹{totalAmount.toFixed(2)}
        </h2>

        {/* Payment Method Switcher Tabs */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 8, 
          background: '#F5ECF2', 
          padding: 4, 
          borderRadius: 14, 
          marginBottom: 16 
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('gpay')}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'gpay' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'gpay' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: activeTab === 'gpay' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={16} />
            <span>Google Pay (UPI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'cash' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'cash' ? '#0C8A53' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: activeTab === 'cash' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Banknote size={16} />
            <span>Cash Payment</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE PAY (UPI QR) */}
        {activeTab === 'gpay' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Scan QR code with Google Pay, PhonePe, Paytm, or any UPI app.
            </p>

            <div className="qr-code-wrapper" style={{ margin: '0 auto 12px auto' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Google Pay UPI QR Code" className="qr-code-img" />
              ) : (
                <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="upi-id-pill">
                <ShieldCheck size={16} />
                <span>UPI ID: {UPI_ID}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CASH PAYMENT TENDER */}
        {activeTab === 'cash' && (
          <div style={{ background: '#F0FFF4', border: '1.5px solid #9AE6B4', borderRadius: 16, padding: '16px 18px', marginBottom: 14, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#276749', marginBottom: 10 }}>
              <Banknote size={20} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>Cash Collection Counter</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#2F855A', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Cash Received from Customer (₹)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #68D391',
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#22543D',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCashTendered(Math.ceil(totalAmount).toString())}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #68D391',
                    background: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#276749',
                    cursor: 'pointer'
                  }}
                >
                  Exact (₹{Math.ceil(totalAmount)})
                </button>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[100, 200, 500, 1000, 2000].filter(note => note >= totalAmount).slice(0, 4).map(note => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCashTendered(note.toString())}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid #9AE6B4',
                      background: tenderedNum === note ? '#276749' : '#FFFFFF',
                      color: tenderedNum === note ? '#FFFFFF' : '#276749',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ₹{note}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Due Display */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #68D391',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#276749' }}>Change to Return:</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: changeDue > 0 ? '#0C8A53' : '#666' }}>
                ₹{changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Customer & Total Info */}
        <div style={{ margin: '12px 0 16px', background: '#FCF6FA', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border-soft)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ fontWeight: 700 }}>{order.customer?.name || 'Walk-in'} ({order.customer?.customerId || 'N/A'})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: 'var(--text-muted)' }}>Receipt Email:</span>
            <span style={{ fontWeight: 600, color: order.customer?.email ? 'var(--primary)' : '#999' }}>
              {order.customer?.email || 'None'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, paddingTop: 6, borderTop: '1px dashed var(--border-soft)', color: 'var(--primary)' }}>
            <span>Total Payable:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Dedicated Action Button for Active Tab */}
        {activeTab === 'gpay' ? (
          <button
            type="button"
            className="btn-confirm-payment"
            onClick={() => handleConfirmPayment('Google Pay')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Saving & Dispatching Email...</span>
              </>
            ) : (
              <>
                <Smartphone size={18} />
                <span>Payment Received via Google Pay</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn-confirm-payment"
            onClick={() => handleConfirmPayment('Cash')}
            disabled={isProcessing}
            style={{
              background: '#0C8A53',
              boxShadow: '0 8px 24px rgba(12, 138, 83, 0.3)'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Saving & Generating Invoice...</span>
              </>
            ) : (
              <>
                <Banknote size={18} />
                <span>Payment Received in Cash</span>
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}
