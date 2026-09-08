import React, { useState, useEffect } from 'react';
import PosHeader from './components/PosHeader';
import PosMenuGrid from './components/PosMenuGrid';
import PosCartPanel from './components/PosCartPanel';
import PosCheckoutModal from './components/PosCheckoutModal';
import ThermalReceiptModal from './components/ThermalReceiptModal';
import ShiftSummaryModal from './components/ShiftSummaryModal';
import { getLocalCatalog, loadCatalog } from '../services/productCatalog';
import { createOrder } from '../services/api';

export default function PosApp() {
  const [products, setProducts] = useState(getLocalCatalog);
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('01');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [checkoutTotals, setCheckoutTotals] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showShiftSummaryModal, setShowShiftSummaryModal] = useState(false);

  // Shift summary tracking
  const [shiftOrders, setShiftOrders] = useState([]);
  const [shiftStartTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Load products dynamically from admin product catalog
  const syncProducts = () => {
    loadCatalog().then(catalog => {
      if (Array.isArray(catalog) && catalog.length > 0) {
        setProducts(catalog);
      }
    });
  };

  useEffect(() => {
    syncProducts();
    window.addEventListener('focus', syncProducts);
    return () => window.removeEventListener('focus', syncProducts);
  }, []);

  // Add product to cart ticket
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQty } : item));
  };

  // Remove item
  const handleRemoveItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // Clear ticket
  const handleClearCart = () => {
    setCartItems([]);
    setDiscountAmount('0');
  };

  // Open Checkout Modal
  const handleProceedToCheckout = (totals) => {
    setCheckoutTotals(totals);
    setShowCheckoutModal(true);
  };

  // Complete Order & Save to Supabase API
  const handleCompleteOrder = async (paymentDetails) => {
    const orderId = `POS-${Date.now().toString().slice(-6)}`;
    const finalOrder = {
      id: orderId,
      orderId,
      orderType,
      tableNumber: orderType === 'DINE_IN' ? (tableNumber || '01') : null,
      customerName: customerName || 'Counter Guest',
      phone: customerPhone || '',
      items: cartItems,
      subtotal: checkoutTotals.subtotal,
      discountVal: checkoutTotals.discountVal,
      gstTax: checkoutTotals.gstTax,
      finalTotal: checkoutTotals.finalTotal,
      amount: checkoutTotals.finalTotal,
      paymentMethod: paymentDetails.paymentMethod,
      paymentStatus: paymentDetails.paymentStatus,
      paymentDetails,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    // Save order to Express backend & Supabase DB
    try {
      await createOrder({
        orderId,
        customer: {
          name: finalOrder.customerName,
          phone: finalOrder.phone,
          orderType,
          tableNumber: finalOrder.tableNumber
        },
        amount: checkoutTotals.finalTotal,
        currency: 'INR',
        items: cartItems,
        paymentId: paymentDetails.cardTxnId || `${paymentDetails.paymentMethod}_${orderId}`,
        paymentMethod: paymentDetails.paymentMethod,
        paymentStatus: paymentDetails.paymentStatus,
        status: 'CONFIRMED'
      });
    } catch (e) {
      console.warn('POS order save fallback notice:', e.message);
    }

    // Add to local shift orders
    setShiftOrders(prev => [finalOrder, ...prev]);

    // Close checkout modal & show printable receipt
    setShowCheckoutModal(false);
    setCompletedOrder(finalOrder);
    setShowReceiptModal(true);

    // Reset current ticket for next customer
    setCartItems([]);
    setDiscountAmount('0');
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="h-screen bg-[#090d16] text-slate-100 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Header */}
      <PosHeader 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenShiftSummary={() => setShowShiftSummaryModal(true)}
        onResetCart={handleClearCart}
      />

      {/* Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Menu Grid (Left Side) */}
        <PosMenuGrid 
          products={products}
          onAddToCart={handleAddToCart}
        />

        {/* Active Ticket Cart Panel (Right Side) */}
        <PosCartPanel 
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          orderType={orderType}
          setOrderType={setOrderType}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          onProceedToCheckout={handleProceedToCheckout}
        />

      </div>

      {/* Checkout Payment Modal */}
      {showCheckoutModal && (
        <PosCheckoutModal 
          totals={checkoutTotals}
          onClose={() => setShowCheckoutModal(false)}
          onCompleteOrder={handleCompleteOrder}
          orderType={orderType}
          tableNumber={tableNumber}
        />
      )}

      {/* Printable Thermal Receipt Modal */}
      {showReceiptModal && (
        <ThermalReceiptModal 
          order={completedOrder}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Cashier Shift Z-Report Summary Modal */}
      {showShiftSummaryModal && (
        <ShiftSummaryModal 
          shiftOrders={shiftOrders}
          shiftStartTime={shiftStartTime}
          onClose={() => setShowShiftSummaryModal(false)}
        />
      )}

    </div>
  );
}
