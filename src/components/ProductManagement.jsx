import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Upload, TrendingUp, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { saveProduct, uploadFile } from '../services/api';
import CameraCaptureModal from './CameraCaptureModal';

export default function ProductManagement({
  products = [],
  onProductsUpdated
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Plushies');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Plushies');
    setPrice('');
    setCostPrice('');
    setStock('50');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category || 'Plushies');
    setPrice(p.price);
    setCostPrice(p.costPrice || 0);
    setStock(p.stock || 50);
    setDescription(p.description || '');
    setImageFile(null);
    setImagePreview(p.image || '');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Please fill product name and selling price.');
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = editingProduct?.image || '/logo.png';
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, false);
      }

      const productPayload = {
        id: editingProduct ? editingProduct.id : 'prod_' + Date.now(),
        name,
        category,
        price: Number(price),
        costPrice: Number(costPrice) || 0,
        stock: Number(stock) || 0,
        description,
        image: imageUrl
      };

      const res = await saveProduct(productPayload, editingProduct ? 'update' : 'create');
      onProductsUpdated(res.products);
      setModalOpen(false);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Are you sure you want to remove "${p.name}"?`)) return;
    try {
      const res = await saveProduct(p, 'delete');
      onProductsUpdated(res.products);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'var(--primary-pastel)', color: 'var(--primary)', padding: 12, borderRadius: 14 }}>
            <Package size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: 0 }}>
              Product Catalog & Cost Pricing
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Configure selling prices, purchase cost prices (COGS), pictures, and stock levels.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-checkout"
          style={{ width: 'auto', padding: '10px 22px', fontSize: 14 }}
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1.5px solid var(--border-soft)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FFF0F6', borderBottom: '1px solid var(--border-soft)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Product</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Category</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Selling Price</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Cost Price</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Margin / Unit</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Stock</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const margin = (p.price || 0) - (p.costPrice || 0);
                const marginPct = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : 0;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #FAF0F5' }}>
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={p.image || '/logo.png'}
                        alt={p.name}
                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#FFF0F6', padding: 4 }}
                        onError={(e) => { e.target.src = '/logo.png'; }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{p.description || 'Velvette Collection'}</div>
                      </div>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: 12, background: 'var(--primary-pastel)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        {p.category || 'General'}
                      </span>
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>
                      ₹{p.price}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 600, color: '#555' }}>
                      ₹{p.costPrice || 0}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: margin >= 0 ? '#0C8A53' : '#FF3B5C' }}>
                      +₹{margin.toFixed(0)} ({marginPct}%)
                    </td>

                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.stock > 10 ? '#333' : '#FF3B5C' }}>
                        {p.stock}
                      </span>
                    </td>

                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          style={{
                            background: '#FAF0F5',
                            border: '1px solid var(--border-soft)',
                            color: 'var(--primary)',
                            padding: '6px 10px',
                            borderRadius: 10,
                            cursor: 'pointer'
                          }}
                          title="Edit Price & Details"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          style={{
                            background: '#FFF0F3',
                            border: '1px solid #FFCCD5',
                            color: '#FF3B5C',
                            padding: '6px 10px',
                            borderRadius: 10,
                            cursor: 'pointer'
                          }}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 540, padding: 26 }}>
            <button type="button" className="modal-close-btn" onClick={() => setModalOpen(false)}>
              ✕
            </button>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: '0 0 4px 0' }}>
              {editingProduct ? 'Edit Product Prices & Info' : 'Add New Product to Velvette'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              Set customer selling price and your purchase cost price to track daily profit margins.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvette Pink Plushie Bear"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="responsive-form-grid">
                <div className="field-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
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
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="responsive-form-grid">
                <div className="field-group">
                  <label>Selling Price (Normal Mode ₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="499"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    In Challenger mode, it will auto-add +₹50.
                  </span>
                </div>

                <div className="field-group">
                  <label>Your Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="220"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Used for daily COGS & net profit calculation.
                  </span>
                </div>
              </div>

              {/* Picture Upload & Camera Snap */}
              <div className="field-group">
                <label>Product Picture</label>
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
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {imagePreview && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 8, background: '#FFF0F6', padding: 4, border: '1px solid var(--border-soft)' }}
                    />
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, display: 'block' }}>Picture selected</span>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
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
                disabled={isSaving}
                style={{ marginTop: 10 }}
              >
                <span>{isSaving ? 'Saving Product...' : (editingProduct ? 'Update Product' : 'Add to Catalog')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Snap Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Take Product Picture"
        onCapture={(file) => {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
