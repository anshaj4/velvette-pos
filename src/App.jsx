import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PosBilling from './components/PosBilling';
import CheckoutModal from './components/CheckoutModal';
import InvoiceViewModal from './components/InvoiceViewModal';
import CloseShopModal from './components/CloseShopModal';
import SalesHistory from './components/SalesHistory';
import PurchaseBills from './components/PurchaseBills';
import ProductManagement from './components/ProductManagement';
import CostAnalysis from './components/CostAnalysis';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { fetchStoreData } from './services/api';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('velvette_auth_session');
    return saved ? JSON.parse(saved) : null;
  });

  // App Navigation & Modes
  const [activeTab, setActiveTab] = useState('billing');
  const [pricingMode, setPricingMode] = useState('normal'); // 'normal' or 'challenger'

  // Store Data
  const [storeData, setStoreData] = useState({
    products: [],
    customers: [],
    invoices: [],
    dailyClosings: [],
    purchaseBills: [],
    settings: {
      username: 'admin',
      password: 'velvette123',
      upiId: 'anshajshaji3-2@okicici',
      challengerExtra: 50
    }
  });

  // Cart & Customer Form State
  const [cart, setCart] = useState([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    customerId: '',
    isReturning: false
  });

  // Modals
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [emailResult, setEmailResult] = useState(null);
  const [isCloseShopOpen, setIsCloseShopOpen] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      const data = await fetchStoreData();
      if (data) {
        setStoreData(data);
      }
    } catch (err) {
      console.error('Error loading store data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Today Date Key (YYYY-MM-DD)
  const todayDayId = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Compute Today's Live Statistics
  const todayStats = useMemo(() => {
    const todayInvoices = (storeData.invoices || []).filter(inv => inv.dayId === todayDayId);
    let rev = 0;
    let cogs = 0;
    todayInvoices.forEach(inv => {
      rev += Number(inv.total || 0);
      (inv.items || []).forEach(it => {
        cogs += (Number(it.costPrice || 0) * Number(it.quantity || 1));
      });
    });
    return {
      revenue: rev,
      cogs,
      profit: rev - cogs,
      invoicesCount: todayInvoices.length
    };
  }, [storeData.invoices, todayDayId]);

  // Proceed to Checkout
  const handleProceedToCheckout = (orderPayload) => {
    setCheckoutOrder(orderPayload);
  };

  // Payment completed & Invoice generated
  const handleInvoiceGenerated = (invoice, emailRes) => {
    setStoreData(prev => ({
      ...prev,
      invoices: [invoice, ...(prev.invoices || [])]
    }));
    // Clear cart and customer form
    setCart([]);
    setCustomerData({
      name: '',
      phone: '',
      email: '',
      customerId: '',
      isReturning: false
    });
    setCheckoutOrder(null);
    setEmailResult(emailRes);
    setViewingInvoice(invoice);
    loadData(); // Sync with backend
  };

  // Handle Close Shop
  const handleShopClosed = (closingRecord) => {
    setStoreData(prev => {
      const existing = prev.dailyClosings || [];
      const updated = existing.filter(c => c.dayId !== closingRecord.dayId);
      return {
        ...prev,
        dailyClosings: [closingRecord, ...updated]
      };
    });
  };

  // Handle Bill Added
  const handleBillAdded = (bill) => {
    setStoreData(prev => ({
      ...prev,
      purchaseBills: [bill, ...(prev.purchaseBills || [])]
    }));
  };

  // Handle Products Updated
  const handleProductsUpdated = (updatedProducts) => {
    setStoreData(prev => ({
      ...prev,
      products: updatedProducts
    }));
  };

  // Handle Settings Updated
  const handleUpdateSettings = async (newSettings) => {
    setStoreData(prev => ({
      ...prev,
      settings: newSettings
    }));
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('velvette_auth_session');
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      {/* Login Protection */}
      {!currentUser && (
        <LoginModal
          settings={storeData.settings}
          onLoginSuccess={(user) => setCurrentUser(user)}
        />
      )}

      {/* Main App Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pricingMode={pricingMode}
        setPricingMode={setPricingMode}
        onOpenCloseShop={() => setIsCloseShopOpen(true)}
        todayStats={todayStats}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Tabs */}
      <main className="main-content">
        {activeTab === 'billing' && (
          <PosBilling
            products={storeData.products || []}
            customers={storeData.customers || []}
            pricingMode={pricingMode}
            cart={cart}
            setCart={setCart}
            onProceedToCheckout={handleProceedToCheckout}
            customerData={customerData}
            setCustomerData={setCustomerData}
            onProductsUpdated={handleProductsUpdated}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistory
            invoices={storeData.invoices || []}
            dailyClosings={storeData.dailyClosings || []}
            onSelectInvoice={(inv) => {
              setViewingInvoice(inv);
              setEmailResult(null);
            }}
          />
        )}

        {activeTab === 'costs' && (
          <CostAnalysis
            products={storeData.products || []}
            onProductsUpdated={handleProductsUpdated}
          />
        )}

        {activeTab === 'bills' && (
          <PurchaseBills
            purchaseBills={storeData.purchaseBills || []}
            onBillAdded={handleBillAdded}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement
            products={storeData.products || []}
            onProductsUpdated={handleProductsUpdated}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={storeData.settings || {}}
            storeData={storeData}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Checkout Modal (Google Pay QR) */}
      <CheckoutModal
        order={checkoutOrder}
        isOpen={Boolean(checkoutOrder)}
        onClose={() => setCheckoutOrder(null)}
        onInvoiceGenerated={handleInvoiceGenerated}
      />

      {/* Invoice View / Print / Resend Modal */}
      <InvoiceViewModal
        invoice={viewingInvoice}
        emailResult={emailResult}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
      />

      {/* Close Shop for Today Modal */}
      <CloseShopModal
        isOpen={isCloseShopOpen}
        onClose={() => setIsCloseShopOpen(false)}
        invoices={storeData.invoices || []}
        dayId={todayDayId}
        onShopClosed={handleShopClosed}
      />
    </div>
  );
}
