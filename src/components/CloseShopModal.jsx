import React, { useState, useMemo } from 'react';
import { 
  X, Moon, TrendingUp, DollarSign, Award, AlertCircle, 
  CheckCircle, ArrowUpRight, HelpCircle, Save 
} from 'lucide-react';
import { saveDailyClosing } from '../services/api';

export default function CloseShopModal({
  isOpen,
  onClose,
  invoices = [],
  dayId,
  onShopClosed
}) {
  const [miscExpenses, setMiscExpenses] = useState(0);
  const [miscNotes, setMiscNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter invoices for today
  const todayInvoices = useMemo(() => {
    return invoices.filter(inv => inv.dayId === dayId);
  }, [invoices, dayId]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    const productStats = {}; // { [id]: { name, qty, revenue, profit } }

    todayInvoices.forEach(inv => {
      totalRevenue += Number(inv.total || 0);

      (inv.items || []).forEach(item => {
        const qty = Number(item.quantity || 1);
        const sellingPrice = Number(item.price || 0);
        const costPrice = Number(item.costPrice || 0);

        const itemRevenue = sellingPrice * qty;
        const itemCost = costPrice * qty;
        const itemProfit = itemRevenue - itemCost;

        totalCogs += itemCost;

        if (!productStats[item.name]) {
          productStats[item.name] = {
            id: item.id,
            name: item.name,
            qty: 0,
            revenue: 0,
            profit: 0
          };
        }
        productStats[item.name].qty += qty;
        productStats[item.name].revenue += itemRevenue;
        productStats[item.name].profit += itemProfit;
      });
    });

    const productsArr = Object.values(productStats);

    // Most selling by volume
    const mostSelling = productsArr.length > 0 
      ? [...productsArr].sort((a, b) => b.qty - a.qty)[0] 
      : null;

    // Most profitable by profit earned
    const mostProfitable = productsArr.length > 0 
      ? [...productsArr].sort((a, b) => b.profit - a.profit)[0] 
      : null;

    const grossProfit = totalRevenue - totalCogs;
    const numMisc = Number(miscExpenses) || 0;
    const netProfit = grossProfit - numMisc;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalInvoices: todayInvoices.length,
      totalRevenue,
      totalCogs,
      grossProfit,
      netProfit,
      profitMargin,
      mostSelling,
      mostProfitable
    };
  }, [todayInvoices, miscExpenses]);

  if (!isOpen) return null;

  const handleConfirmCloseShop = async () => {
    setIsSaving(true);
    try {
      const closingRecord = {
        dayId,
        closedAt: new Date().toISOString(),
        closedBy: 'admin',
        totalRevenue: stats.totalRevenue,
        totalCogs: stats.totalCogs,
        grossProfit: stats.grossProfit,
        miscExpenses: Number(miscExpenses) || 0,
        miscNotes,
        netProfit: stats.netProfit,
        profitMargin: stats.profitMargin,
        totalInvoices: stats.totalInvoices,
        mostSellingProduct: stats.mostSelling,
        mostProfitableProduct: stats.mostProfitable,
        status: 'closed'
      };

      await saveDailyClosing(closingRecord);
      onShopClosed(closingRecord);
      onClose();
    } catch (err) {
      alert('Error closing shop: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 640, padding: '28px 24px' }}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ background: '#2D1424', color: '#FFD4E5', padding: 8, borderRadius: 12 }}>
            <Moon size={22} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Close Shop for Today
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Trading Day: <strong>{dayId}</strong> • {stats.totalInvoices} invoices completed
            </p>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0' }}>
          <div style={{ background: '#FFF0F6', padding: '14px', borderRadius: '16px', border: '1px solid #FFD4E5' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>Today's Revenue</span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
              ₹{stats.totalRevenue.toFixed(2)}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>From {stats.totalInvoices} sales</span>
          </div>

          <div style={{ background: '#F8F9FA', padding: '14px', borderRadius: '16px', border: '1px solid #E9ECEF' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6C757D' }}>Product Cost (COGS)</span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: '#343A40', marginTop: 4 }}>
              ₹{stats.totalCogs.toFixed(2)}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Purchase cost of items</span>
          </div>

          <div style={{ background: stats.netProfit >= 0 ? '#E8FBF2' : '#FFEBEF', padding: '14px', borderRadius: '16px', border: `1px solid ${stats.netProfit >= 0 ? '#A4E8CD' : '#FFB3C2'}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: stats.netProfit >= 0 ? '#0C8A53' : '#FF3B5C' }}>Net Profit</span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: stats.netProfit >= 0 ? '#0C8A53' : '#FF3B5C', marginTop: 4 }}>
              ₹{stats.netProfit.toFixed(2)}
            </div>
            <span style={{ fontSize: 11, color: stats.netProfit >= 0 ? '#0C8A53' : '#FF3B5C' }}>Margin: {stats.profitMargin}%</span>
          </div>
        </div>

        {/* Prompt: Extra / Misc Costs Incurred Today */}
        <div style={{ background: '#FFF8EB', padding: '16px 18px', borderRadius: '18px', border: '1.5px solid #FFD182', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', marginBottom: 8 }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>Prompt: How much extra / misc cost came out today?</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78350F', display: 'block', marginBottom: 3 }}>Misc Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="0"
                value={miscExpenses}
                onChange={e => setMiscExpenses(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #FCD34D',
                  fontWeight: 800,
                  fontSize: 15,
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78350F', display: 'block', marginBottom: 3 }}>Notes (e.g. Courier, packaging, food)</label>
              <input
                type="text"
                placeholder="Packaging materials, courier delivery, etc."
                value={miscNotes}
                onChange={e => setMiscNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #FCD34D',
                  fontSize: 13,
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>
          </div>
        </div>

        {/* Best Performing Highlights: Most Selling & Most Profitable */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Most Selling */}
          <div style={{ background: '#FAF3F7', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', marginBottom: 6 }}>
              <Award size={16} />
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Most Selling Product</span>
            </div>
            {stats.mostSelling ? (
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{stats.mostSelling.name}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  <strong>{stats.mostSelling.qty} units</strong> sold • ₹{stats.mostSelling.revenue.toFixed(0)} total
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#999', margin: 0 }}>No sales recorded today yet.</p>
            )}
          </div>

          {/* Most Profitable */}
          <div style={{ background: '#FAF3F7', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0C8A53', marginBottom: 6 }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Most Profitable Product</span>
            </div>
            {stats.mostProfitable ? (
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{stats.mostProfitable.name}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#0C8A53', fontWeight: 600 }}>
                  <strong>+ ₹{stats.mostProfitable.profit.toFixed(0)}</strong> earned margin ({stats.mostProfitable.qty} sold)
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#999', margin: 0 }}>No sales recorded today yet.</p>
            )}
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          type="button"
          className="btn-checkout"
          onClick={handleConfirmCloseShop}
          disabled={isSaving}
          style={{ background: 'linear-gradient(135deg, #2D1424, #12050E)' }}
        >
          <Save size={18} />
          <span>{isSaving ? 'Finalizing Day...' : 'Lock & Save Day\'s Final Report'}</span>
        </button>
      </div>
    </div>
  );
}
