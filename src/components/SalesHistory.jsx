import React, { useState, useMemo } from 'react';
import { Calendar, Eye, FileText, CheckCircle2, TrendingUp, Moon, Search, DollarSign } from 'lucide-react';

export default function SalesHistory({
  invoices = [],
  dailyClosings = [],
  onSelectInvoice
}) {
  const [selectedDay, setSelectedDay] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all unique days from invoices and closings
  const availableDays = useMemo(() => {
    const daysSet = new Set();
    const today = new Date().toISOString().split('T')[0];
    daysSet.add(today);

    invoices.forEach(i => { if (i.dayId) daysSet.add(i.dayId); });
    dailyClosings.forEach(c => { if (c.dayId) daysSet.add(c.dayId); });

    return Array.from(daysSet).sort().reverse();
  }, [invoices, dailyClosings]);

  // Invoices for selected day
  const dayInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchDay = inv.dayId === selectedDay;
      const matchSearch = searchTerm === '' || 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.phone.includes(searchTerm);
      return matchDay && matchSearch;
    });
  }, [invoices, selectedDay, searchTerm]);

  // Closing summary for selected day (if closed)
  const dayClosing = useMemo(() => {
    return dailyClosings.find(c => c.dayId === selectedDay);
  }, [dailyClosings, selectedDay]);

  // Calculate live numbers for selected day
  const liveDayStats = useMemo(() => {
    const allForDay = invoices.filter(inv => inv.dayId === selectedDay);
    let rev = 0;
    let cogs = 0;
    allForDay.forEach(inv => {
      rev += Number(inv.total || 0);
      (inv.items || []).forEach(it => {
        cogs += (Number(it.costPrice || 0) * Number(it.quantity || 1));
      });
    });
    return {
      revenue: rev,
      cogs,
      grossProfit: rev - cogs,
      count: allForDay.length
    };
  }, [invoices, selectedDay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Day Selector Bar */}
      <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--primary-pastel)', color: 'var(--primary)', padding: 10, borderRadius: 12 }}>
            <Calendar size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, margin: 0 }}>
              Sales & Invoices by Day
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Select a date to audit daily invoices, revenue, and net profits.
            </p>
          </div>
        </div>

        {/* Date Selector Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%', paddingBottom: 4 }}>
          {availableDays.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`chip-btn ${selectedDay === day ? 'active' : ''}`}
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              {day} {day === new Date().toISOString().split('T')[0] ? '(Today)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Performance Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '18px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Day Revenue</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
            ₹{(dayClosing ? dayClosing.totalRevenue : liveDayStats.revenue).toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {liveDayStats.count} Total Invoices
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '18px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Product COGS</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: '#343A40', marginTop: 4 }}>
            ₹{(dayClosing ? dayClosing.totalCogs : liveDayStats.cogs).toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cost of goods sold</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '18px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Misc Extra Expenses</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>
            ₹{dayClosing ? Number(dayClosing.miscExpenses || 0).toFixed(2) : '0.00'}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {dayClosing?.miscNotes ? dayClosing.miscNotes : (dayClosing ? 'No notes' : 'Pending day closing')}
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '18px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0C8A53' }}>Net Profit</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: '#0C8A53', marginTop: 4 }}>
            ₹{dayClosing ? Number(dayClosing.netProfit).toFixed(2) : Number(liveDayStats.grossProfit).toFixed(2)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: dayClosing ? '#0C8A53' : '#D97706' }}>
            {dayClosing ? `Closed (${dayClosing.profitMargin}% margin)` : 'Live (Misc pending)'}
          </span>
        </div>
      </div>

      {/* Highlights (if Day was closed) */}
      {dayClosing && (dayClosing.mostSellingProduct || dayClosing.mostProfitableProduct) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {dayClosing.mostSellingProduct && (
            <div style={{ background: '#FFF0F6', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border-strong)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>🏆 Top Seller for {selectedDay}</span>
              <h4 style={{ margin: '4px 0 2px 0', fontSize: 15, color: 'var(--text-main)' }}>{dayClosing.mostSellingProduct.name}</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{dayClosing.mostSellingProduct.qty} items sold</p>
            </div>
          )}
          {dayClosing.mostProfitableProduct && (
            <div style={{ background: '#E8FBF2', padding: '14px 18px', borderRadius: '16px', border: '1px solid #A4E8CD' }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0C8A53' }}>💎 Most Profitable for {selectedDay}</span>
              <h4 style={{ margin: '4px 0 2px 0', fontSize: 15, color: '#1C0F17' }}>{dayClosing.mostProfitableProduct.name}</h4>
              <p style={{ margin: 0, fontSize: 12, color: '#0C8A53', fontWeight: 600 }}>+ ₹{dayClosing.mostProfitableProduct.profit.toFixed(0)} net margin</p>
            </div>
          )}
        </div>
      )}

      {/* Invoices Table */}
      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, margin: 0 }}>
            Invoices on {selectedDay} ({dayInvoices.length})
          </h3>

          <div className="search-input-wrap" style={{ minWidth: 260 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by invoice #, name, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {dayInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ color: 'var(--primary)', opacity: 0.5, marginBottom: 8 }} />
            <p style={{ fontWeight: 600 }}>No invoices found for this date.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFF0F6', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Invoice #</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Customer</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Items</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Mode</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dayInvoices.map(inv => {
                  const itemsCount = (inv.items || []).reduce((sum, i) => sum + i.quantity, 0);
                  const timeStr = new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={inv.id || inv.invoiceNumber} style={{ borderBottom: '1px solid #FAF0F5' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                        #{inv.invoiceNumber}
                        <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 400 }}>{timeStr}</div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{inv.customer?.name || 'Walk-in'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.customer?.phone || 'No phone'}</div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 13, color: '#444' }}>{itemsCount} items</span>
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {inv.mode === 'challenger' ? (
                          <span style={{ background: '#FFF3E0', color: '#D97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                            ⚡ Challenger
                          </span>
                        ) : (
                          <span style={{ background: '#FCE7F3', color: '#DB2777', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                            Normal
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', fontSize: 15 }}>
                        ₹{Number(inv.total).toFixed(2)}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(inv)}
                          style={{
                            background: '#FAF0F5',
                            border: '1px solid var(--border-soft)',
                            color: 'var(--primary)',
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Eye size={13} />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
