import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Minus, Trash2, Tag, 
  Sparkles, Zap, ArrowRight, UserCheck, ShieldCheck, 
  Package, Upload, X, Loader2, Camera 
} from 'lucide-react';
import { saveProduct, uploadFile } from '../services/api';
import CameraCaptureModal from './CameraCaptureModal';

export default function PosBilling({
  products = [],
  customers = [],
  pricingMode = 'normal',
  cart = [],
  setCart,
  onProceedToCheckout,
  customerData,
  setCustomerData,
  onProductsUpdated
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Quick Add Product from Screen Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('Plushies');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdFile, setNewProdFile] = useState(null);
  const [newProdPreview, setNewProdPreview] = useState('');
  const [isSavingProd, setIsSavingProd] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Adjust product prices based on pricing mode (+₹50 in Challenger mode)
  const getProductPrice = (basePrice) => {
    const num = Number(basePrice) || 0;
    return pricingMode === 'challenger' ? num + 50 : num;
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add item to cart
  const handleAddToCart = (product) => {
    const currentPrice = getProductPrice(product.price);
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      // Keep price updated to current mode
      updated[existingIndex].price = currentPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: currentPrice,
          basePrice: product.price,
          costPrice: product.costPrice || 0,
          image: product.image,
          quantity: 1
        }
      ]);
    }
  };

  // Update item quantity in cart
  const handleUpdateQty = (productId, delta) => {
    const updated = cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(updated);
  };

  // Remove item from cart
  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Autofill customer on phone number typing or lookup
  const handlePhoneChange = (phoneInput) => {
    const cleaned = phoneInput.replace(/[^0-9]/g, '');
    const foundCustomer = customers.find(c => c.phone === cleaned);

    if (foundCustomer) {
      setCustomerData({
        phone: cleaned,
        name: foundCustomer.name,
        email: foundCustomer.email || '',
        customerId: foundCustomer.customerId,
        isReturning: true,
        totalVisits: foundCustomer.totalVisits || 1
      });
    } else {
      setCustomerData(prev => ({
        ...prev,
        phone: cleaned,
        isReturning: false,
        // auto-assign a customer id if none exists
        customerId: prev.customerId || `VEL-${Math.floor(1000 + Math.random() * 9000)}`
      }));
    }
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    return (subtotal * pct) / 100;
  }, [subtotal, discountPercent]);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckoutClick = () => {
    // Generate customer ID if missing
    const finalCustData = {
      ...customerData,
      customerId: customerData.customerId || `VEL-${Math.floor(1000 + Math.random() * 9000)}`
    };
    onProceedToCheckout({
      items: cart,
      subtotal,
      discountPercent: Number(discountPercent) || 0,
      discountAmount,
      total: grandTotal,
      mode: pricingMode,
      customer: finalCustData
    });
  };

  // Quick Add Product Submit Handler
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      alert('Please provide product name and selling price.');
      return;
    }

    setIsSavingProd(true);
    try {
      let imageUrl = '/logo.png';
      if (newProdFile) {
        imageUrl = await uploadFile(newProdFile, false);
      }

      const productPayload = {
        id: 'prod_' + Date.now(),
        name: newProdName,
        category: newProdCat,
        price: Number(newProdPrice),
        costPrice: Number(newProdCost) || 0,
        stock: Number(newProdStock) || 0,
        description: newProdDesc,
        image: imageUrl
      };

      const res = await saveProduct(productPayload, 'create');
      if (onProductsUpdated) {
        onProductsUpdated(res.products);
      }
      setShowAddModal(false);
    } catch (err) {
      alert('Error adding product: ' + err.message);
    } finally {
      setIsSavingProd(false);
    }
  };

  return (
    <div className="pos-layout">
      {/* LEFT: Product Catalog */}
      <div className="catalog-section">
        <div className="catalog-header">
          <div>
            <h1 className="catalog-title">
              <span>Velvette Collection</span>
              {pricingMode === 'challenger' ? (
                <span style={{ fontSize: 13, background: '#FFF3E0', color: '#D97706', padding: '3px 10px', borderRadius: 20, border: '1px solid #FCD34D' }}>
                  ⚡ Challenger (+₹50)
                </span>
              ) : (
                <span style={{ fontSize: 13, background: '#FCE7F3', color: '#DB2777', padding: '3px 10px', borderRadius: 20, border: '1px solid #FBCFE8' }}>
                  🎀 Normal Mode
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Tap any item to add to customer cart. Switch modes anytime.
            </p>
          </div>

          {/* Search Box & Add Product Button */}
          <div className="search-and-filters">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search plushies, charms, apparel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-checkout"
              style={{ width: 'auto', padding: '9px 18px', fontSize: 13, gap: 6, whiteSpace: 'nowrap' }}
              onClick={() => {
                setNewProdName('');
                setNewProdPrice('');
                setNewProdCost('');
                setNewProdStock('50');
                setNewProdDesc('');
                setNewProdFile(null);
                setNewProdPreview('');
                setShowAddModal(true);
              }}
              title="Add a new product directly from this screen"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="category-chips">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => {
            const displayPrice = getProductPrice(product.price);
            return (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  <img
                    src={product.image || '/logo.png'}
                    alt={product.name}
                    className="product-img"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  {product.stock && (
                    <span className="product-stock-tag">
                      {product.stock} left
                    </span>
                  )}
                </div>

                <div className="product-info">
                  <span className="product-category-name">{product.category || 'Velvette'}</span>
                  <h3 className="product-title" title={product.name}>{product.name}</h3>

                  <div className="product-pricing-row">
                    <div className="price-box">
                      <span className={`current-price ${pricingMode === 'challenger' ? 'challenger-active' : ''}`}>
                        ₹{displayPrice}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-add-cart"
                      onClick={() => handleAddToCart(product)}
                      title="Add to Cart"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Customer Panel */}
      <div className="cart-panel">
        <div className="cart-header">
          <div className="cart-title">
            <span>Current Order</span>
            <span className="cart-items-count">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              className="btn-clear-cart"
              onClick={() => setCart([])}
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <Sparkles size={32} style={{ color: 'var(--primary)', marginBottom: 8, opacity: 0.6 }} />
              <p style={{ fontWeight: 600 }}>Cart is empty</p>
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                Select items from catalog to start billing.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item-row">
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-unit-price">
                    ₹{item.price} each
                    {pricingMode === 'challenger' && <span style={{ color: '#D97706', fontSize: 11, marginLeft: 4 }}>(+₹50)</span>}
                  </div>
                </div>

                <div className="cart-qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleUpdateQty(item.id, -1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="qty-number">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleUpdateQty(item.id, 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div className="cart-item-total">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </div>

                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 2 }}
                  onClick={() => handleRemoveItem(item.id)}
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Customer Details Form (Before Payment) */}
        <div className="customer-form-box">
          <div className="customer-form-title">
            <span>Customer Info</span>
            {customerData.isReturning && (
              <span className="autofill-badge">
                <UserCheck size={11} style={{ display: 'inline', marginRight: 3 }} />
                Returning Guest ({customerData.totalVisits} visits)
              </span>
            )}
          </div>

          <div className="customer-inputs-grid">
            {/* Phone (Triggers autofill) */}
            <div className="field-group input-full">
              <label>Phone Number (Enter for Auto-fill)</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerData.phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
            </div>

            {/* Name */}
            <div className="field-group">
              <label>Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={customerData.name}
                onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
              />
            </div>

            {/* Customer ID */}
            <div className="field-group">
              <label>Customer ID</label>
              <input
                type="text"
                placeholder="VEL-1001"
                value={customerData.customerId}
                onChange={e => setCustomerData({ ...customerData, customerId: e.target.value })}
              />
            </div>

            {/* Email (for Resend invoice delivery) */}
            <div className="field-group input-full">
              <label>Email Address (For Invoice Delivery)</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={customerData.email}
                onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Discount Control */}
        <div className="discount-control-box">
          <div className="discount-header">
            <span className="discount-label">
              <Tag size={13} style={{ color: 'var(--primary)' }} />
              Apply Discount (%)
            </span>
            <span className="discount-val-badge">{discountPercent}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={discountPercent}
              onChange={e => setDiscountPercent(e.target.value)}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={e => setDiscountPercent(Math.min(100, Math.max(0, e.target.value)))}
              style={{
                width: 60,
                padding: '4px 6px',
                borderRadius: 6,
                border: '1px solid var(--border-soft)',
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700
              }}
            />
          </div>

          <div className="discount-presets">
            {[0, 5, 10, 15, 20, 50].map(pct => (
              <button
                key={pct}
                type="button"
                className={`discount-chip ${Number(discountPercent) === pct ? 'active' : ''}`}
                onClick={() => setDiscountPercent(pct)}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Totals */}
        <div className="cart-summary-totals">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="summary-row discount-row">
              <span>Discount ({discountPercent}%)</span>
              <span>- ₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row grand-total">
            <span>Total Payable</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          className="btn-checkout"
          disabled={cart.length === 0}
          onClick={handleCheckoutClick}
        >
          <span>Proceed to Checkout</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Quick Add Product Modal from Screen */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520, padding: 26 }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ background: '#FFF0F6', color: 'var(--primary)', padding: 6, borderRadius: 8 }}>
                <Package size={20} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: 0 }}>
                Add New Product
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Add a new item to catalog immediately. It will appear on this screen instantly.
            </p>

            <form onSubmit={handleQuickAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvette Pink Plushie Bear"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Category</label>
                  <select
                    value={newProdCat}
                    onChange={e => setNewProdCat(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border-soft)',
                      fontSize: 13,
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="Plushies">Plushies</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Stock Count</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="499"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Purchase Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="220"
                    value={newProdCost}
                    onChange={e => setNewProdCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Product Picture (Optional)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFF0F6',
                      border: '1.5px solid var(--border-strong)',
                      padding: '8px 14px',
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={14} />
                    <span>Take Picture with Camera</span>
                  </button>

                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFFFFF',
                    border: '1px solid var(--border-soft)',
                    padding: '8px 14px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}>
                    <Upload size={14} />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) {
                          setNewProdFile(f);
                          setNewProdPreview(URL.createObjectURL(f));
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {newProdPreview && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={newProdPreview}
                      alt="Preview"
                      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#FFF0F6', padding: 3, border: '1px solid var(--border-soft)' }}
                    />
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'block' }}>Photo attached</span>
                      <button
                        type="button"
                        onClick={() => { setNewProdFile(null); setNewProdPreview(''); }}
                        style={{ background: 'none', border: 'none', color: '#999', fontSize: 11, cursor: 'pointer', padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-checkout"
                disabled={isSavingProd}
                style={{ marginTop: 6 }}
              >
                <span>{isSavingProd ? 'Saving Product...' : 'Add to Catalog Now'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Take Product Picture"
        onCapture={(file) => {
          setNewProdFile(file);
          setNewProdPreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
