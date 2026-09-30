import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Package, AlertCircle, 
  ArrowUpRight, Edit3, Check, Filter, Search 
} from 'lucide-react';
import { saveProduct } from '../services/api';

export default function CostAnalysis({
  products = [],
  onProductsUpdated
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editCostVal, setEditCostVal] = useState('');
  const [editPriceVal, setEditPriceVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Overall Cost & Margin Metrics
  const metrics = useMemo(() => {
    let totalInventoryCost = 0;
    let totalRetailValue = 0;
    let totalStockUnits = 0;
    let highestMarginProd = null;
    let highestMarginVal = -1;

    products.forEach(p => {
      const stock = Number(p.stock || 0);
      const cost = Number(p.costPrice || 0);
      const price = Number(p.price || 0);

      totalInventoryCost += (stock * cost);
      totalRetailValue += (stock * price);
      totalStockUnits += stock;

      const unitMargin = price - cost;
      const marginPct = price > 0 ? (unitMargin / price) * 100 : 0;

      if (marginPct > highestMarginVal) {
        highestMarginVal = marginPct;
        highestMarginProd = { ...p, marginPct, unitMargin };
      }
    });

    const expectedTotalProfit = totalRetailValue - totalInventoryCost;
    const avgMarginPct = totalRetailValue > 0 
      ? ((expectedTotalProfit / totalRetailValue) * 100).toFixed(1) 
      : 0;

    return {
      totalInventoryCost,
      totalRetailValue,
      expectedTotalProfit,
      totalStockUnits,
      avgMarginPct,
      highestMarginProd
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const price = Number(p.price || 0);
      const cost = Number(p.costPrice || 0);
      const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;

      if (selectedFilter === 'HighMargin') return matchSearch && marginPct >= 50;
      if (selectedFilter === 'LowMargin') return matchSearch && marginPct < 50;
      return matchSearch;
    });
  }, [products, searchTerm, selectedFilter]);

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditCostVal(p.costPrice || 0);
    setEditPriceVal(p.price || 0);
  };

  const handleSaveInline = async (p) => {
    setIsSaving(true);
    try {
      const updated = {
        ...p,
        costPrice: Number(editCostVal) || 0,
        price: Number(editPriceVal) || 0
      };
      const res = await saveProduct(updated, 'update');
      onProductsUpdated(res.products);
      setEditingId(null);
    } catch (err) {
      alert('Error updating costs: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner Card */}
      <div style={{ background: '#FFFFFF', padding: '22px 26px', borderRadius: '24px', border: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#FFF0F6', color: 'var(--primary)', padding: 12, borderRadius: 16 }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Costs & Profit Margins
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Confidential internal analysis of purchase costs, unit profit margins, and inventory valuation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={`chip-btn ${selectedFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('All')}
          >
            All Items ({products.length})
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedFilter === 'HighMargin' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('HighMargin')}
          >
            High Margin (50%+)
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedFilter === 'LowMargin' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('LowMargin')}
          >
            Low Margin (&lt;50%)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Cost Locked in Stock</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#343A40', marginTop: 4 }}>
            ₹{metrics.totalInventoryCost.toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Across {metrics.totalStockUnits} inventory units
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>Expected Retail Value</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
            ₹{metrics.totalRetailValue.toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            At current selling prices
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0C8A53' }}>Potential Gross Profit</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#0C8A53', marginTop: 4 }}>
            ₹{metrics.expectedTotalProfit.toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: '#0C8A53', fontWeight: 700 }}>
            {metrics.avgMarginPct}% Average Margin
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#D97706' }}>Highest Margin Item</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#D97706', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {metrics.highestMarginProd ? metrics.highestMarginProd.name : 'N/A'}
          </div>
          <span style={{ fontSize: 12, color: '#D97706', fontWeight: 700 }}>
            {metrics.highestMarginProd ? `${metrics.highestMarginProd.marginPct.toFixed(0)}% Margin (+₹${metrics.highestMarginProd.unitMargin.toFixed(0)})` : ''}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '22px', border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, margin: 0 }}>
            Individual Item Cost & Profit Breakdown
          </h3>

          <div className="search-input-wrap" style={{ minWidth: 260 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by product name or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FFF0F6', borderBottom: '1.5px solid var(--border-soft)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Product Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Category</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Purchase Cost (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Selling Price (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Unit Margin (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Margin %</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Markup %</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Stock Value</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Edit Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const cost = Number(p.costPrice || 0);
                const price = Number(p.price || 0);
                const stock = Number(p.stock || 0);
                const unitMargin = price - cost;
                const marginPct = price > 0 ? ((unitMargin / price) * 100).toFixed(1) : 0;
                const markupPct = cost > 0 ? ((unitMargin / cost) * 100).toFixed(1) : 0;
                const isEditing = editingId === p.id;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #FAF0F5' }}>
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={p.image || '/logo.png'}
                        alt={p.name}
                        style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8, background: '#FFF0F6', padding: 4 }}
                        onError={(e) => { e.target.src = '/logo.png'; }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 13 }}>{p.name}</span>
                    </td>

                    <td style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.category}
                    </td>

                    {/* Purchase Cost */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editCostVal}
                          onChange={e => setEditCostVal(e.target.value)}
                          style={{ width: 75, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--primary)', textAlign: 'right', fontWeight: 700 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 800, color: '#333', fontSize: 14 }}>₹{cost}</span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPriceVal}
                          onChange={e => setEditPriceVal(e.target.value)}
                          style={{ width: 75, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--primary)', textAlign: 'right', fontWeight: 700 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>₹{price}</span>
                      )}
                    </td>

                    {/* Unit Margin */}
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: unitMargin >= 0 ? '#0C8A53' : '#FF3B5C', fontSize: 14 }}>
                      +₹{unitMargin.toFixed(0)}
                    </td>

                    {/* Margin % */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 800,
                        background: Number(marginPct) >= 50 ? '#E8FBF2' : '#FFF3E0',
                        color: Number(marginPct) >= 50 ? '#0C8A53' : '#D97706'
                      }}>
                        {marginPct}%
                      </span>
                    </td>

                    {/* Markup % */}
                    <td style={{ padding: '14px', textAlign: 'right', fontSize: 13, color: '#666' }}>
                      {markupPct}%
                    </td>

                    {/* Stock Value */}
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: '#1C0F17' }}>
                      ₹{(stock * cost).toFixed(0)}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>({stock} in stock)</div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveInline(p)}
                          disabled={isSaving}
                          style={{
                            background: '#0C8A53',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Check size={12} />
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          style={{
                            background: '#FAF0F5',
                            border: '1px solid var(--border-soft)',
                            color: 'var(--primary)',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Edit3 size={11} />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
