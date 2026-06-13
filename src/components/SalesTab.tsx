import React, { useState } from 'react';
import { ShoppingCart, Search, Trash2, UserPlus, Receipt, ArrowRight, CornerDownRight, Landmark, BadgeAlert, AlertCircle, Printer, MessageSquare, Phone, Copy, Check, Share2, Send } from 'lucide-react';
import { Product, Customer, Sale, SaleItem } from '../types';
import { TRANSLATIONS, Language } from '../translations';

interface SalesTabProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  lang: Language;
  onRecordSale: (sale: Omit<Sale, 'id' | 'date'>) => Sale;
  onQuickRegisterCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'lastActive'>) => Customer;
  aiCartTrigger?: { productId: string; quantity: number; timestamp: number } | null;
  aiCustomerTrigger?: { customerId: string; timestamp: number } | null;
  aiCheckoutTrigger?: { timestamp: number; paymentMethod?: 'cash' | 'card' | 'credit' | 'upi' } | null;
}

export default function SalesTab({ 
  products, 
  customers, 
  sales, 
  lang, 
  onRecordSale, 
  onQuickRegisterCustomer,
  aiCartTrigger,
  aiCustomerTrigger,
  aiCheckoutTrigger
}: SalesTabProps) {
  const t = TRANSLATIONS[lang];
  // POS States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | 'walk-in'>('walk-in');

  // React effects to listen to dynamic incoming Krishi-AI Voice actions
  React.useEffect(() => {
    if (aiCartTrigger && aiCartTrigger.productId) {
      const prod = products.find(p => p.id === aiCartTrigger.productId);
      if (prod) {
        setCart(prev => {
          const exists = prev.find(item => item.product.id === prod.id);
          if (exists) {
            return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + aiCartTrigger.quantity } : item);
          } else {
            return [...prev, { product: prod, quantity: aiCartTrigger.quantity }];
          }
        });
      }
    }
  }, [aiCartTrigger, products]);

  React.useEffect(() => {
    if (aiCustomerTrigger && aiCustomerTrigger.customerId) {
      setSelectedCustomerId(aiCustomerTrigger.customerId);
    }
  }, [aiCustomerTrigger]);

  // AI fully automated direct checkout trigger effect
  React.useEffect(() => {
    if (aiCheckoutTrigger) {
      console.log("[Auto-Checkout] AI Checkout Trigger received:", aiCheckoutTrigger);
      // Construct the absolute latest cart, incorporating any concurrent aiCartTrigger changes from this tick
      let finalCart = [...cart];
      if (aiCartTrigger && aiCartTrigger.productId && Math.abs(aiCheckoutTrigger.timestamp - aiCartTrigger.timestamp) < 500) {
        const prod = products.find(p => p.id === aiCartTrigger.productId);
        if (prod) {
          const existsIdx = finalCart.findIndex(item => item.product.id === prod.id);
          if (existsIdx > -1) {
            finalCart[existsIdx] = { ...finalCart[existsIdx], quantity: finalCart[existsIdx].quantity + aiCartTrigger.quantity };
          } else {
            finalCart.push({ product: prod, quantity: aiCartTrigger.quantity });
          }
        }
      }

      if (finalCart.length === 0) {
        console.warn("[Auto-Checkout] Cancelled checkout. Cart is empty.");
        return;
      }

      // Compile items
      const saleItems: SaleItem[] = finalCart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellPrice: item.product.sellPrice,
        costPrice: item.product.costPrice,
        unit: item.product.unit
      }));

      // Find selected customer
      let activeCustomerId = selectedCustomerId;
      if (aiCustomerTrigger && Math.abs(aiCheckoutTrigger.timestamp - aiCustomerTrigger.timestamp) < 500) {
        activeCustomerId = aiCustomerTrigger.customerId;
      }

      const activeFarmer = activeCustomerId !== 'walk-in' 
        ? customers.find(c => c.id === activeCustomerId) 
        : null;

      let customerNameCombined = 'Walk-In Customer';
      if (activeFarmer) {
        customerNameCombined = activeFarmer.name;
      } else if (walkInName) {
        customerNameCombined = `${walkInName} (Walk-In)`;
      }

      const totalAmount = finalCart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);
      const parsedPaymentMethod = aiCheckoutTrigger.paymentMethod || 'cash';

      const compiledSale: Omit<Sale, 'id' | 'date'> = {
        customerId: activeCustomerId === 'walk-in' ? null : activeCustomerId,
        customerName: customerNameCombined,
        items: saleItems,
        totalAmount,
        amountPaid: parsedPaymentMethod === 'credit' ? 0 : totalAmount,
        paymentMethod: parsedPaymentMethod,
        notes: lang === 'mr' ? "कृषी-एआय व्हॉइस असिस्टंट द्वारे स्वयंचलित बिलिंग." : lang === 'hi' ? "कृषि-एआई वॉइस असिस्टेंट द्वारा स्वचालित बिलिंग।" : "Automated billing via Krishi-AI Voice Assistant.",
        dueDate: parsedPaymentMethod === 'credit' ? getOneMonthLaterDateStr() : undefined
      };

      console.log("[Auto-Checkout] Complete compiler recording:", compiledSale);
      const createdSale = onRecordSale(compiledSale);

      // Reset state
      setCart([]);
      setSelectedCustomerId('walk-in');
      setWalkInName('Spot Cash Buyer');
      setWalkInPhone('');
      setWalkInVillage('');
      setAmountPaidInput('');
      setPaymentNotes('');
      setPaymentMethod('cash');

      // Instantly open generated invoice modal
      setViewingSale(createdSale);
    }
  }, [aiCheckoutTrigger]);
  
  // Walk-in or quick register details
  const [walkInName, setWalkInName] = useState('Spot Cash Buyer');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInVillage, setWalkInVillage] = useState('');
  const [isQuickRegistering, setIsQuickRegistering] = useState(false);

  // New item draft state
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductDraft, setSelectedProductDraft] = useState<Product | null>(null);
  const [quantityDraft, setQuantityDraft] = useState(5);

  // Checkout Payment particulars
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'upi'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>(''); // empty string to dynamically match
  const [paymentNotes, setPaymentNotes] = useState('');

  const getOneMonthLaterDateStr = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const [dueDateInput, setDueDateInput] = useState<string>(getOneMonthLaterDateStr());

  // Selected Invoice viewer
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  
  // Digital invoice sharing states
  const [sharePhone, setSharePhone] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Sync sharePhone whenever viewingSale changes
  React.useEffect(() => {
    if (viewingSale) {
      const activeCust = viewingSale.customerId ? customers.find(c => c.id === viewingSale.customerId) : null;
      setSharePhone(activeCust ? activeCust.phone : '');
      setCopiedSuccess(false);
    } else {
      setSharePhone('');
      setCopiedSuccess(false);
    }
  }, [viewingSale, customers]);

  // Active Customer Object
  const selectedFarmer = selectedCustomerId !== 'walk-in' 
    ? customers.find(c => c.id === selectedCustomerId) 
    : null;

  // Filter products for dropdown draft choosing
  const searchableProducts = products.filter(p => {
    return p.stock > 0 && (
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchProductQuery.toLowerCase())
    );
  });

  // Totals calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);
  
  // Set default paid sum depending on method, if payment is 'credit', amountPaid is usually 0
  const totalAmount = cartSubtotal;
  const determinedAmountPaid = paymentMethod === 'credit' 
    ? 0 
    : amountPaidInput === '' 
      ? totalAmount 
      : Number(amountPaidInput);

  const pendingDebtAddition = totalAmount > determinedAmountPaid ? totalAmount - determinedAmountPaid : 0;

  // Handlers
  const handleAddProductToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductDraft) return;

    if (quantityDraft <= 0) return;

    // Check if stock is sufficient
    const existingCartItem = cart.find(item => item.product.id === selectedProductDraft.id);
    const existingQty = existingCartItem ? existingCartItem.quantity : 0;
    const totalQtyNeeded = existingQty + quantityDraft;

    if (totalQtyNeeded > selectedProductDraft.stock) {
      alert(`Insufficient stock! ${selectedProductDraft.name} only has ${selectedProductDraft.stock} units available.`);
      return;
    }

    if (existingCartItem) {
      setCart(cart.map(item => 
        item.product.id === selectedProductDraft.id 
          ? { ...item, quantity: totalQtyNeeded }
          : item
      ));
    } else {
      setCart([...cart, { product: selectedProductDraft, quantity: quantityDraft }]);
    }

    // Reset draft fields
    setSelectedProductDraft(null);
    setSearchProductQuery('');
    setQuantityDraft(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleRegisterAndAssignFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;

    const newFarmer = onQuickRegisterCustomer({
      name: walkInName,
      phone: walkInPhone,
      village: walkInVillage,
      debt: 0
    });

    setSelectedCustomerId(newFarmer.id);
    setIsQuickRegistering(false);
  };

  const handleCheckoutComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Build items
    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      sellPrice: item.product.sellPrice,
      costPrice: item.product.costPrice,
      unit: item.product.unit
    }));

    let customerNameCombined = 'Walk-In Customer';
    if (selectedFarmer) {
      customerNameCombined = selectedFarmer.name;
    } else if (walkInName) {
      customerNameCombined = `${walkInName} (Walk-In)`;
    }

    const compiledSale: Omit<Sale, 'id' | 'date'> = {
      customerId: selectedCustomerId === 'walk-in' ? null : selectedCustomerId,
      customerName: customerNameCombined,
      items: saleItems,
      totalAmount,
      amountPaid: Math.min(determinedAmountPaid, totalAmount),
      paymentMethod,
      notes: paymentNotes || undefined,
      dueDate: (paymentMethod === 'credit' || (determinedAmountPaid < totalAmount)) ? dueDateInput : undefined
    };

    const createdSale = onRecordSale(compiledSale);

    // Reset POS checkout state
    setCart([]);
    setSelectedCustomerId('walk-in');
    setWalkInName('Spot Cash Buyer');
    setWalkInPhone('');
    setWalkInVillage('');
    setAmountPaidInput('');
    setPaymentNotes('');
    setPaymentMethod('cash');
    setDueDateInput(getOneMonthLaterDateStr());
    
    // Auto show the invoice modal for instant print or WhatsApp/SMS dispatch
    setViewingSale(createdSale);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="sales-tab-pos-root">
      {/* POS Cart and Input Engine */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Step 1: Customer details choosing */}
        <div className="tactile-card bg-white p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-bold text-emerald-805 uppercase tracking-widest font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.step1Customer}
            </h3>
            <button
              id="toggle-quick-register-btn"
              type="button"
              onClick={() => setIsQuickRegistering(!isQuickRegistering)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserPlus size={14} />
              {isQuickRegistering ? t.chooseExistingFarmer : t.quickRegisterFarmer}
            </button>
          </div>

          {!isQuickRegistering ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider" htmlFor="farmer-profile-select">{t.buyerNameLabel}</label>
                  <select
                    id="farmer-profile-select"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value === 'walk-in') {
                        setPaymentMethod('cash');
                      }
                    }}
                    className="w-full text-xs p-3 bg-zinc-50 hover:bg-white border-2 border-zinc-250 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors cursor-pointer font-semibold text-zinc-800"
                  >
                    <option value="walk-in">{t.nonRegisteredWalkIn}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({t.village}: {c.village || 'N/A'}) {c.debt > 0 ? `[${t.activeDebt}: ₹${c.debt}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedCustomerId === 'walk-in' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider" htmlFor="walk-in-name-input">{t.buyerNameLabel}</label>
                    <input
                      id="walk-in-name-input"
                      type="text"
                      className="w-full text-xs p-3 bg-zinc-50 focus:bg-white border-2 border-zinc-250 focus:border-emerald-500 rounded-xl focus:outline-none transition-colors font-semibold text-zinc-805"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Outstanding ledger notification with a 3D overlay status */}
              {selectedFarmer && (
                <div className={`p-4 rounded-xl border-t-4 flex items-start gap-3.5 text-xs shadow-3xs transition-all ${
                  selectedFarmer.debt > 0 
                    ? 'bg-amber-50/50 text-amber-900 border-amber-500' 
                    : 'bg-emerald-50/50 text-emerald-900 border-emerald-500'
                }`}>
                  <AlertCircle size={18} className={`shrink-0 mt-0.5 ${selectedFarmer.debt > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <div>
                    <span className="font-bold text-zinc-800">Farmer Ledger Status: <strong className="text-zinc-900">{selectedFarmer.name}</strong></span>
                    <p className="mt-1 text-zinc-650 font-semibold space-x-1.5 flex flex-wrap gap-y-1">
                      <span>Village: <strong className="text-zinc-900 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">{selectedFarmer.village}</strong></span>
                      <span>• Contact: <strong className="text-zinc-90 w-auto bg-white border border-zinc-200 px-1.5 py-0.5 rounded">{selectedFarmer.phone || 'None'}</strong></span>
                      <span>• Outstanding: <strong className={`px-1.5 py-0.5 rounded border ${selectedFarmer.debt > 0 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>₹{selectedFarmer.debt}</strong></span>
                    </p>
                    {selectedFarmer.debt > 3000 && (
                      <p className="text-[10px] font-bold text-rose-800 mt-2 uppercase tracking-widest bg-rose-150 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200">
                        <BadgeAlert size={12} className="text-rose-600 shrink-0" /> Note: Collect dues first!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Quick Farmer Enrollment subform built as 3D Card */
            <form onSubmit={handleRegisterAndAssignFarmer} className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-3.5 shadow-inner">
              <span className="text-xs font-bold text-zinc-700 block uppercase tracking-wider font-display">New Farmer Quick-Tally Entry</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider" htmlFor="enroll-name">Farmer Name *</label>
                  <input
                    id="enroll-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider" htmlFor="enroll-phone">Phone Number</label>
                  <input
                    id="enroll-phone"
                    type="tel"
                    placeholder="10 digit number"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider" htmlFor="enroll-village">Village/Area *</label>
                  <input
                    id="enroll-village"
                    type="text"
                    required
                    placeholder="e.g. Haripur"
                    value={walkInVillage}
                    onChange={(e) => setWalkInVillage(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickRegistering(false)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="enroll-farmer-btn"
                  className="px-5 py-2 btn-3d-emerald text-xs text-white"
                >
                  Register & Connect
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Step 2: Product Addition POS */}
        <div className="tactile-card bg-white p-6 space-y-4">
          <h3 className="text-xs font-bold text-emerald-805 uppercase tracking-widest font-display pb-2 border-b border-zinc-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t.step2Products}
          </h3>
          
          <form onSubmit={handleAddProductToCart} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1 relative">
                <label className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider" htmlFor="pos-search-composition">Product Item Catalogue *</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={15} />
                  <input
                    id="pos-search-composition"
                    type="text"
                    autoComplete="off"
                    placeholder={t.searchStockPlaceholder}
                    value={searchProductQuery}
                    onChange={(e) => {
                      setSearchProductQuery(e.target.value);
                      if (selectedProductDraft && !e.target.value.includes(selectedProductDraft.name)) {
                        setSelectedProductDraft(null);
                      }
                    }}
                    className="w-full text-xs pl-10 pr-3 py-3 bg-zinc-50 hover:bg-white border-2 border-zinc-250 focus:border-emerald-500 rounded-xl focus:outline-none transition-colors font-semibold"
                  />
                </div>

                {/* Dropdown overlay */}
                {searchProductQuery && !selectedProductDraft && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-zinc-200 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto z-20 text-xs divide-y divide-zinc-150">
                    {searchableProducts.map(p => (
                      <button
                        key={p.id}
                        id={`pos-search-result-${p.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedProductDraft(p);
                          setSearchProductQuery(p.name);
                        }}
                        className="w-full text-left p-3 hover:bg-emerald-50/50 flex flex-col gap-1 focus:outline-none transition-all"
                      >
                        <div className="flex justify-between font-extrabold text-zinc-800">
                          <span className="text-zinc-900 font-bold">{p.name}</span>
                          <span className={`${p.stock <= p.minStockAlert ? 'text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold animate-pulse' : 'text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px]'}`}>
                            {p.stock} {p.unit} left
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-semibold">
                          <span>Mfg: {p.manufacturer} • Batch: {p.batchNumber}</span>
                          <span className="text-zinc-900 bg-zinc-150 px-1 rounded">₹{p.sellPrice} / unit</span>
                        </div>
                      </button>
                    ))}
                    {searchableProducts.length === 0 && (
                      <div className="p-3 text-center italic text-zinc-400 bg-zinc-50">No items available.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider" htmlFor="pos-quantity-input">{t.quantity}</label>
                <div className="flex items-center gap-2">
                  <input
                    id="pos-quantity-input"
                    type="number"
                    min="1"
                    max={selectedProductDraft?.stock || 500}
                    value={quantityDraft}
                    onChange={(e) => setQuantityDraft(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-zinc-50 border-2 border-zinc-250 focus:border-emerald-500 font-bold rounded-xl text-center focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 font-extrabold bg-zinc-100 border px-2 py-1 rounded truncate max-w-[65px] select-none text-center">
                    {selectedProductDraft?.unit || 'bags'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 flex items-end">
                <button
                  type="submit"
                  id="add-item-to-pos-cart-btn"
                  disabled={!selectedProductDraft}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-805 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-0.5"
                >
                  <ShoppingCart size={14} />
                  {t.addToCartBtn}
                </button>
              </div>
            </div>
            {selectedProductDraft && (
              <div className="text-[11px] bg-emerald-50/55 text-emerald-850 p-2.5 rounded-lg border border-emerald-100 flex justify-between animate-fade-in font-semibold">
                <span>Composition details: <strong className="text-zinc-700">{selectedProductDraft.description}</strong></span>
                <span className="font-bold text-emerald-805 shrink-0">Product Subtotal: ₹{selectedProductDraft.sellPrice * quantityDraft}</span>
              </div>
            )}
          </form>

          {/* Cart Table list with polished 3D borders */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b border-zinc-200 flex items-center gap-1.5 justify-between">
              <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 align-middle">
                <ShoppingCart size={15} className="text-emerald-700 animate-pulse" />
                {t.activeCartTitle}
              </span>
              <span className="text-[11px] font-bold text-emerald-805 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">{cart.reduce((s, c) => s + c.quantity, 0)} Items Added</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Item name</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3 text-right">Total Price</th>
                  <th className="px-4 py-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {cart.map((item) => (
                  <tr key={item.product.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-850">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-400 capitalize font-medium">{item.product.category} ({item.product.manufacturer})</p>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 font-semibold">₹{item.product.sellPrice}</td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-800">{item.quantity} {item.product.unit}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-zinc-950">₹{item.product.sellPrice * item.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        id={`remove-cart-item-${item.product.id}`}
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg hover:text-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 italic font-medium bg-zinc-50/30">
                      {t.cartIsEmptyPrompt}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POS Checkout Invoice Receipt Panel */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Checkout Summary panel */}
        <div className="tactile-card bg-white p-6 space-y-4">
          <h3 className="text-xs font-bold text-emerald-805 uppercase tracking-widest font-display pb-2 border-b border-zinc-100">
            {t.step3Payment}
          </h3>
          
          <form onSubmit={handleCheckoutComplete} className="space-y-4">
            <div className="divide-y divide-zinc-200/60 bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200 p-4 rounded-xl space-y-2.5 shadow-inner">
              <div className="flex justify-between text-xs py-0.5 font-bold text-zinc-650">
                <span>Items checklist:</span>
                <span>{cart.length} unique line(s)</span>
              </div>
              <div className="flex justify-between text-sm py-2 font-bold text-zinc-900 border-t border-zinc-200">
                <span className="font-display uppercase tracking-wider">{t.grandTotal}:</span>
                <span className="text-xl text-emerald-805 font-extrabold font-display">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{t.paymentMethodLabel} *</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    id="pay-cash-btn"
                    type="button"
                    onClick={() => { setPaymentMethod('cash'); setAmountPaidInput(''); }}
                    className={`p-3 rounded-xl border-2 font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-805 shadow-sm'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {t.payCash}
                    <span className="text-[9px] font-mono px-1.5 bg-emerald-100 text-emerald-700 border border-emerald-250 rounded font-black">CASH</span>
                  </button>

                  <button
                    id="pay-upi-btn"
                    type="button"
                    onClick={() => { setPaymentMethod('upi'); setAmountPaidInput(''); }}
                    className={`p-3 rounded-xl border-2 font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-805 shadow-sm'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {t.payUpi}
                    <span className="text-[9px] font-mono px-1.5 bg-sky-100 text-sky-700 border border-sky-250 rounded font-black">UPI</span>
                  </button>

                  <button
                    id="pay-card-btn"
                    type="button"
                    onClick={() => { setPaymentMethod('card'); setAmountPaidInput(''); }}
                    className={`p-3 rounded-xl border-2 font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-805 shadow-sm'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {t.payCard}
                    <span className="text-[9px] font-mono px-1.5 bg-purple-100 text-purple-700 border border-purple-250 rounded font-black">CARD</span>
                  </button>

                  <button
                    id="pay-credit-btn"
                    type="button"
                    disabled={selectedCustomerId === 'walk-in'}
                    onClick={() => { setPaymentMethod('credit'); setAmountPaidInput('0'); }}
                    className={`p-3 rounded-xl border-2 font-bold text-left flex items-center justify-between transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                    }`}
                    title={selectedCustomerId === 'walk-in' ? 'Register farmer profile to enable credit sales' : 'Add to farmer pending tab'}
                  >
                    {t.payCredit}
                    <span className="text-[9px] font-mono px-1.5 bg-rose-100 text-rose-700 border border-rose-250 rounded font-black">TAB/KHATA</span>
                  </button>
                </div>
              </div>

              {/* Amount paid input (Partial payment support for Credit sales / custom payment) */}
              {paymentMethod !== 'credit' && selectedCustomerId !== 'walk-in' && (
                <div className="space-y-1.5 bg-zinc-50 p-3.5 border border-zinc-205 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider" htmlFor="partial-paid-amt">{t.amountPaidByFarmer} *</label>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-200 px-1.5 rounded">Full matches empty</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-xs">₹</span>
                    <input
                      id="partial-paid-amt"
                      type="number"
                      placeholder={totalAmount.toString()}
                      min="0"
                      max={totalAmount}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full text-xs pl-7 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  {pendingDebtAddition > 0 && (
                    <div className="mt-1.5 text-[9px] text-rose-805 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <BadgeAlert size={12} className="text-rose-600 shrink-0" />
                      ₹{pendingDebtAddition} rest balance will be auto-debited!
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'credit' && (
                <div className="bg-rose-50 border-t-2 border-rose-550 p-3 rounded-xl text-xs text-rose-900 space-y-1">
                  <span className="font-bold text-rose-950">Agricultural Credit (Bahi-Khata ledger):</span>
                  <p className="text-zinc-650 leading-snug font-medium">
                    This outstanding total of <strong className="text-rose-700 font-bold">₹{totalAmount}</strong> is recorded as Credit. 
                    This will be booked to <span className="font-bold text-zinc-900">{selectedFarmer?.name}</span>'s profile under village <span className="font-bold text-zinc-900">{selectedFarmer?.village}</span>.
                  </p>
                </div>
              )}

              {/* Promise Date / Due Date Selector for outstanding debt */}
              {(paymentMethod === 'credit' || pendingDebtAddition > 0) && (
                <div className="space-y-1.5 bg-emerald-50/40 p-4 border-2 border-dashed border-emerald-200/80 rounded-xl animate-fade-in">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-emerald-805 uppercase tracking-wider block" htmlFor="due-date-payment">
                      📅 Promised Payment Date (परत फेड तारीख) *
                    </label>
                    <span className="text-[9px] text-emerald-600 bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-black uppercase">
                      Default: 1 Month Later
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="due-date-payment"
                      type="date"
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-white border-2 border-zinc-250 focus:border-emerald-500 rounded-lg focus:outline-none transition-colors font-bold text-zinc-900 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                    A reminder will be scheduled on <strong>{dueDateInput ? new Date(dueDateInput).toLocaleDateString() : 'N/A'}</strong>. You will be able to send an automatic text, WhatsApp alert, or call with our system.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider" htmlFor="payment-notes">Transaction Notes / remarks</label>
                <input
                  id="payment-notes"
                  type="text"
                  placeholder="e.g. Paid via crop credit card, subsidy coupon..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 focus:bg-white border-2 border-zinc-250 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            <button
              id="finalize-checkout-btn"
              type="submit"
              disabled={cart.length === 0}
              className="w-full py-3.5 btn-3d-emerald text-sm text-white"
            >
              <Receipt size={16} className="mr-1.5" />
              {t.finalizeBillBtn}
            </button>
          </form>
        </div>

        {/* Recent receipts lookup */}
        <div className="tactile-card bg-white p-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 font-display">
            <Receipt size={14} className="text-emerald-700 animate-bounce" />
            {t.recentInvoices}
          </h3>

          <div className="space-y-2 h-44 overflow-y-auto pr-1">
            {sales.slice().reverse().map((s) => {
              const saleDate = new Date(s.date);
              return (
                <button
                  key={s.id}
                  id={`recent-sale-${s.id}`}
                  onClick={() => setViewingSale(s)}
                  className="w-full text-left p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 flex justify-between items-center text-xs transition-all focus:outline-none"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-800">{s.customerName}</p>
                    <p className="text-[10px] text-zinc-400">
                      {saleDate.toLocaleDateString()} • {saleDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-900">₹{s.totalAmount}</p>
                    <span className={`text-[9px] uppercase px-1 rounded font-bold border ${
                      s.paymentMethod === 'credit'
                        ? 'bg-rose-50 text-rose-700 border-rose-105'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-105'
                    }`}>
                      {s.paymentMethod}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoice Details Dialog Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs overflow-y-auto flex justify-center items-start sm:items-center p-2 sm:p-4 z-50 animate-fade-in" id="invoice-details-modal">
          <div className="my-auto bg-white rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Tax Invoice Receipt</span>
                <h3 className="text-base font-extrabold text-zinc-900">Invoice {viewingSale.id}</h3>
              </div>
              <button onClick={() => setViewingSale(null)} className="text-zinc-400 hover:text-zinc-650 text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-dashed border-zinc-150 pb-2">
                <div>
                  <span className="text-zinc-400 block font-medium">Billed To:</span>
                  <strong className="text-zinc-850 font-bold">{viewingSale.customerName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block font-medium">Date & Time:</span>
                  <strong className="text-zinc-650">{new Date(viewingSale.date).toLocaleString()}</strong>
                </div>
              </div>

              {/* Items Table inside Invoice */}
              <div className="space-y-1.5">
                <span className="font-bold text-zinc-400 uppercase tracking-widest text-[9px] block">Itemized Cart Purchase</span>
                <div className="space-y-1">
                  {viewingSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-zinc-50">
                      <div className="max-w-[70%]">
                        <p className="font-semibold text-zinc-850">{item.productName}</p>
                        <p className="text-[10px] text-zinc-450">{item.quantity} units @ ₹{item.sellPrice}</p>
                      </div>
                      <span className="font-bold text-zinc-905 mt-1">₹{item.quantity * item.sellPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement particulars in Invoice */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150 space-y-2">
                <div className="flex justify-between font-bold text-zinc-850">
                  <span>Gross Total Invoice:</span>
                  <span className="text-base">₹{viewingSale.totalAmount}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Payment Settled ({viewingSale.paymentMethod.toUpperCase()}):</span>
                  <span className="font-bold text-emerald-600">₹{viewingSale.amountPaid}</span>
                </div>
                {viewingSale.totalAmount > viewingSale.amountPaid && (
                  <div className="flex justify-between text-rose-700 font-bold border-t border-zinc-200 pt-1">
                    <span>Transferred to Farmer Tab Credit:</span>
                    <span>₹{viewingSale.totalAmount - viewingSale.amountPaid}</span>
                  </div>
                )}
              </div>

              {viewingSale.notes && (
                <div className="p-2 border border-zinc-100 bg-zinc-50/50 rounded-lg text-zinc-500 italic text-[11px]">
                  <strong>Remarks:</strong> {viewingSale.notes}
                </div>
              )}

              {/* Digital Dispatch Communication Form */}
              <div className="bg-emerald-50/70 p-4 border border-emerald-150 rounded-xl space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 size={13} className="text-emerald-600" />
                  Dispatch Bill Digitally (SMS / WhatsApp)
                </h4>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-400">
                        <Phone size={11} />
                        <span className="text-[9px] font-bold font-mono">IN</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="Farmer 10-digit Phone Number"
                        value={sharePhone}
                        onChange={(e) => setSharePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full text-xs pl-12 pr-2 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-emerald-500/10 focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!viewingSale) return;
                        const itemsStr = viewingSale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                        const dueAmount = viewingSale.totalAmount - viewingSale.amountPaid;
                        let textMsg = '';
                        if (lang === 'mr') {
                          textMsg = `*कृषी-तपशील पावती - AGRI-INPUT CENTER*\n\nशेतकरी: ${viewingSale.customerName}\nबिल क्रमांक: ${viewingSale.id}\nमाल: ${itemsStr}\nएकूण बिल: ₹${viewingSale.totalAmount}\nजमा रक्क: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `उर्वरित बाकी (उधारी): ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\n\nआपल्या भेटीबद्दल धन्यवाद! 🙏`;
                        } else if (lang === 'hi') {
                          textMsg = `*कृषि डिजिटल बिल पर्ची - AGRI-INPUT CENTER*\n\nकिसान: ${viewingSale.customerName}\nपर्ची क्रमांक: ${viewingSale.id}\nमाल: ${itemsStr}\nकुल बिल: ₹${viewingSale.totalAmount}\nप्राप्त राशि: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `शेष बकाया (उधारी): ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\n\nदुकान पर पधारने के लिए धन्यवाद! 🙏`;
                        } else {
                          textMsg = `*DIGITAL INVOICE RECEIPT - AGRI-INPUT CENTER*\n\nFarmer: ${viewingSale.customerName}\nInvoice ID: ${viewingSale.id}\nItems: ${itemsStr}\nGross Total: ₹${viewingSale.totalAmount}\nAmount Paid: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `Pending Udhaari: ₹${dueAmount}\n` : ''}Date: ${new Date(viewingSale.date).toLocaleDateString()}\n\nThank you for your visit! 🙏`;
                        }
                        navigator.clipboard.writeText(textMsg);
                        setCopiedSuccess(true);
                        setTimeout(() => setCopiedSuccess(false), 2000);
                      }}
                      className="px-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg text-zinc-600 transition-colors flex items-center justify-center cursor-pointer"
                      title="Copy Message Text"
                    >
                      {copiedSuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${sharePhone.length === 10 ? '91' + sharePhone : sharePhone}?text=${encodeURIComponent(
                        (() => {
                          const itemsStr = viewingSale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                          const dueAmount = viewingSale.totalAmount - viewingSale.amountPaid;
                          if (lang === 'mr') {
                            return `*कृषी-तपशील पावती - AGRI-INPUT CENTER*\n\nशेतकरी: ${viewingSale.customerName}\nबिल क्रमांक: ${viewingSale.id}\nमाल: ${itemsStr}\nएकूण बिल: ₹${viewingSale.totalAmount}\nजमा रक्क: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `उर्वरित बाकी (उधारी): ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\n\nआपल्या भेटीबद्दल धन्यवाद! 🙏`;
                          } else if (lang === 'hi') {
                            return `*कृषि डिजिटल बिल पर्ची - AGRI-INPUT CENTER*\n\nकिसान: ${viewingSale.customerName}\nपर्ची क्रमांक: ${viewingSale.id}\nमाल: ${itemsStr}\nकुल बिल: ₹${viewingSale.totalAmount}\nप्राप्त राशि: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `शेष बकाया (उधारी): ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\n\nदुकान पर पधारने के लिए धन्यवाद! 🙏`;
                          } else {
                            return `*DIGITAL INVOICE RECEIPT - AGRI-INPUT CENTER*\n\nFarmer: ${viewingSale.customerName}\nInvoice ID: ${viewingSale.id}\nItems: ${itemsStr}\nGross Total: ₹${viewingSale.totalAmount}\nAmount Paid: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `Pending Udhaari: ₹${dueAmount}\n` : ''}Date: ${new Date(viewingSale.date).toLocaleDateString()}\n\nThank you for your visit! 🙏`;
                          }
                        })()
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageSquare size={13} />
                      WhatsApp
                    </a>

                    <a
                      href={`sms:${sharePhone}?body=${encodeURIComponent(
                        (() => {
                          const itemsStr = viewingSale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                          const dueAmount = viewingSale.totalAmount - viewingSale.amountPaid;
                          if (lang === 'mr') {
                            return `कृषी-तपशील पावती - AGRI-INPUT CENTER\nशेतकरी: ${viewingSale.customerName}\nबिल: ${viewingSale.id}\nमाल: ${itemsStr}\nएकूण: ₹${viewingSale.totalAmount}\nजमा: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `बाकी: ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\nधन्यवाद!`;
                          } else if (lang === 'hi') {
                            return `कृषि डिजिटल बिल - AGRI-INPUT CENTER\nकिसान: ${viewingSale.customerName}\nबिल: ${viewingSale.id}\nमाल: ${itemsStr}\nकुल बिल: ₹${viewingSale.totalAmount}\nजमा: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `बकाया: ₹${dueAmount}\n` : ''}दिनांक: ${new Date(viewingSale.date).toLocaleDateString()}\nधन्यवाद!`;
                          } else {
                            return `DEALER RECEIPT - AGRI-INPUT CENTER\nFarmer: ${viewingSale.customerName}\nInvoice: ${viewingSale.id}\nItems: ${itemsStr}\nTotal: ₹${viewingSale.totalAmount}\nPaid: ₹${viewingSale.amountPaid}\n${dueAmount > 0 ? `Due: ₹${dueAmount}\n` : ''}Date: ${new Date(viewingSale.date).toLocaleDateString()}\nThank you!`;
                          }
                        })()
                      )}`}
                      className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send size={13} />
                      Send SMS
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  if (!viewingSale) return;
                  // Hidden iframe trick for precise paper sizing (80mm / thermal fit)
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
                  if (!iframeDoc) {
                    window.print();
                    return;
                  }

                  const rows = viewingSale.items.map(item => `
                    <tr style="border-bottom: 1px dashed #eee;">
                      <td style="padding: 4px 0; font-size: 11px;">${item.productName}</td>
                      <td style="padding: 4px 0; font-size: 11px; text-align: center;">${item.quantity} ${item.unit || 'units'}</td>
                      <td style="padding: 4px 0; font-size: 11px; text-align: right;">₹${item.sellPrice}</td>
                      <td style="padding: 4px 0; font-size: 11px; text-align: right; font-weight: bold;">₹${item.quantity * item.sellPrice}</td>
                    </tr>
                  `).join('');

                  iframeDoc.write(`
                    <html>
                      <head>
                        <title>Billing Invoice #${viewingSale.id}</title>
                        <style>
                          @page { size: 80mm auto; margin: 0; }
                          body {
                            font-family: 'Courier New', monospace;
                            width: 72mm;
                            margin: 0;
                            padding: 8px;
                            color: #000;
                            background: #fff;
                          }
                          .center { text-align: center; }
                          .bold { font-weight: bold; }
                          .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                          .sub { font-size: 9px; margin-bottom: 2px; }
                          .divider { border-top: 1px dashed #000; margin: 6px 0; }
                          table { width: 100%; border-collapse: collapse; }
                          th { border-bottom: 1px dashed #000; font-size: 10px; padding: 4px 0; text-align: left; }
                          td { font-size: 10px; }
                          .text-right { text-align: right; }
                          .bold-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-top: 4px; }
                          .footer { text-align: center; margin-top: 16px; font-size: 8px; line-height: 1.3; }
                        </style>
                      </head>
                      <body>
                        <div class="center">
                          <div class="title">★ AGRI-INPUT CENTER ★</div>
                          <div class="sub">Fertilizers, Seeds & Plant Nutrition Depot</div>
                          <div class="sub">Lic No: LIC/MH-34/CO-4592</div>
                          <div class="sub">Contact: +91 90496 52848</div>
                        </div>
                        <div class="divider"></div>
                        <div><strong>Voucher:</strong> ${viewingSale.id}</div>
                        <div><strong>Date   :</strong> ${new Date(viewingSale.date).toLocaleString()}</div>
                        <div><strong>Farmer :</strong> ${viewingSale.customerName.toUpperCase()}</div>
                        <div class="divider"></div>
                        <table>
                          <thead>
                            <tr>
                              <th style="width: 45%;">Crop Input</th>
                              <th style="width: 15%; text-align: center;">Qty</th>
                              <th style="width: 20%; text-align: right;">Rate</th>
                              <th style="width: 20%; text-align: right;">Amt</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rows}
                          </tbody>
                        </table>
                        <div class="divider"></div>
                        <div class="bold-total">
                          <span>Gross Amt:</span>
                          <span>₹${viewingSale.totalAmount}</span>
                        </div>
                        <div class="bold-total">
                          <span>Paid Settle:</span>
                          <span>₹${viewingSale.amountPaid}</span>
                        </div>
                        ${viewingSale.totalAmount > viewingSale.amountPaid ? `
                        <div class="bold-total" style="color: #000;">
                          <span>Udhaari Balance:</span>
                          <span>₹${viewingSale.totalAmount - viewingSale.amountPaid}</span>
                        </div>
                        ` : ''}
                        ${viewingSale.notes ? `
                        <div class="divider"></div>
                        <div style="font-size: 9px;">Notes: ${viewingSale.notes}</div>
                        ` : ''}
                        <div class="divider"></div>
                        <div class="footer">
                          <p class="bold">★ KEEP RECEIPT SAFE ★</p>
                          <p>Authenticated agri premium imports guarantee. Goods once sold cannot be substituted loosely.</p>
                          <p>Agri-Tally billing console</p>
                        </div>
                        <script>
                          window.onload = function() {
                            window.focus();
                            window.print();
                            setTimeout(function() {
                              try {
                                window.parent.document.body.removeChild(window.frameElement);
                              } catch(e) {}
                            }, 800);
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  iframeDoc.close();
                }}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} />
                Thermal Print (80mm)
              </button>
              
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="py-1.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
