import React from 'react';
import { Sparkles, Moon, ShoppingBag, History, Receipt, Package, Settings, LogOut, Zap, TrendingUp } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  pricingMode,
  setPricingMode,
  onOpenCloseShop,
  todayStats,
  currentUser,
  onLogout
}) {
  return (
    <header className="main-header">
      {/* Challenger Alert Bar */}
      {pricingMode === 'challenger' && (
        <div className="challenger-alert-bar">
          <Zap size={14} fill="#FFFFFF" />
          <span>CHALLENGER MODE ACTIVE: +₹50 applied to all items</span>
          <Zap size={14} fill="#FFFFFF" />
        </div>
      )}

      {/* Row 1: Brand, Mode Switcher & Quick Actions */}
      <div className="header-top-bar">
        {/* Brand Logo */}
        <div className="brand-section" onClick={() => setActiveTab('billing')}>
          <img src="/logo.png" alt="Velvette" className="brand-logo-img" />
          <span className="brand-tagline">POS</span>
        </div>

        {/* Header Right Cluster */}
        <div className="header-right-cluster">
          {/* Desktop Mode Switcher */}
          <div className="mode-toggle-card desktop-only-flex">
            <button
              type="button"
              className={`mode-btn ${pricingMode === 'normal' ? 'active normal' : ''}`}
              onClick={() => setPricingMode('normal')}
              title="Normal pricing"
            >
              <Sparkles size={13} />
              <span>Normal</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${pricingMode === 'challenger' ? 'active challenger' : ''}`}
              onClick={() => setPricingMode('challenger')}
              title="Adds ₹50 to every product"
            >
              <Zap size={13} />
              <span>Challenger (+₹50)</span>
            </button>
          </div>

          {/* Mobile Compact Mode Toggle */}
          <button
            type="button"
            className={`mode-toggle-mobile mobile-only-flex ${pricingMode === 'challenger' ? 'challenger' : 'normal'}`}
            onClick={() => setPricingMode(pricingMode === 'normal' ? 'challenger' : 'normal')}
            title="Tap to toggle Normal / Challenger mode"
          >
            {pricingMode === 'challenger' ? <Zap size={12} /> : <Sparkles size={12} />}
            <span>{pricingMode === 'challenger' ? '+₹50' : 'Normal'}</span>
          </button>

          {/* Today Revenue Pill */}
          <div className="badge-live-day" title="Today's total sales">
            <span className="badge-dot"></span>
            <span>₹{todayStats?.revenue || 0}</span>
          </div>

          {/* Close Shop for Today */}
          <button
            type="button"
            className="btn-close-shop"
            onClick={onOpenCloseShop}
            title="End today's trading & calculate net profit"
          >
            <Moon size={13} />
            <span className="close-shop-text">Close Shop</span>
          </button>

          {/* Logout */}
          {currentUser && (
            <button
              type="button"
              className="btn-logout-icon"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Dedicated Scrollable Navigation Tabs */}
      <div className="header-nav-bar">
        <nav className="nav-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <ShoppingBag size={14} />
            <span>Billing</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <History size={14} />
            <span>Sales & Days</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            <TrendingUp size={14} />
            <span>Costs & Margins</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            <Receipt size={14} />
            <span>Purchase Bills</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={14} />
            <span>Products</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
