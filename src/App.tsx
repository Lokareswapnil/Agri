import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  HandCoins, 
  Package2, 
  AlertTriangle, 
  Receipt, 
  Users2, 
  History, 
  Settings, 
  CalendarDays, 
  ChevronRight, 
  Plus, 
  FileSpreadsheet, 
  IndianRupee, 
  CheckCircle2, 
  BookOpen, 
  ShieldAlert, 
  Search, 
  Smartphone,
  Info
} from 'lucide-react';

import { Product, Customer, Sale, InventoryLog, CategoryType } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SALES, INITIAL_LOGS } from './mockData';
import { TRANSLATIONS, Language } from './translations';

// Component imports
import StatsGrid from './components/StatsGrid';
import InventoryTab from './components/InventoryTab';
import SalesTab from './components/SalesTab';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const local = localStorage.getItem('agri_tally_lang');
    return (local as Language) || 'mr'; // default to Marathi as requested for easy, simple local usage
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('agri_tally_lang', lang);
  }, [lang]);

  // --- Persistent Local Database State ---
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('agri_tally_products');
    return local ? JSON.parse(local) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem('agri_tally_customers');
    return local ? JSON.parse(local) : INITIAL_CUSTOMERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const local = localStorage.getItem('agri_tally_sales');
    return local ? JSON.parse(local) : INITIAL_SALES;
  });

  const [logs, setLogs] = useState<InventoryLog[]>(() => {
    const local = localStorage.getItem('agri_tally_logs');
    return local ? JSON.parse(local) : INITIAL_LOGS;
  });

  // --- Active Session Navigation (Tally Mode) ---
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Daybook filter state
  const [selectedDaybookDate, setSelectedDaybookDate] = useState<string>('2026-06-10'); // matching local time context
  
  // Selected Customer detail state
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  
  // Debt Settle state
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState<boolean>(false);

  // Tally Dense UI mode state
  const [denseMode, setDenseMode] = useState<boolean>(false);

  // --- Synchronization effects ---
  useEffect(() => {
    localStorage.setItem('agri_tally_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('agri_tally_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('agri_tally_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('agri_tally_logs', JSON.stringify(logs));
  }, [logs]);

  // --- Business Operations / Transaction Managers ---

  // Add Product (Fertiliser/Seed/Chemical)
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    
    setProducts(prev => [product, ...prev]);
    
    // Log audit trail
    const log: InventoryLog = {
      id: `log-${Date.now()}`,
      productId: id,
      productName: product.name,
      type: 'stock_in',
      quantity: product.stock,
      prevStock: 0,
      newStock: product.stock,
      date: new Date().toISOString(),
      reason: 'Registered new stock item in catalogue.'
    };
    setLogs(prev => [...prev, log]);
  };

  // Edit / Correct Product Specs
  const handleEditProduct = (updatedProd: Product) => {
    const oldProd = products.find(p => p.id === updatedProd.id);
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));

    if (oldProd && oldProd.stock !== updatedProd.stock) {
      const qtyDiff = updatedProd.stock - oldProd.stock;
      const log: InventoryLog = {
        id: `log-${Date.now()}`,
        productId: updatedProd.id,
        productName: updatedProd.name,
        type: qtyDiff > 0 ? 'stock_in' : 'stock_out',
        quantity: Math.abs(qtyDiff),
        prevStock: oldProd.stock,
        newStock: updatedProd.stock,
        date: new Date().toISOString(),
        reason: `Admin manual correction of stock level.`
      };
      setLogs(prev => [...prev, log]);
    }
  };

  // Quick supply stock shipment arrival
  const handleQuickRestock = (productId: string, quantity: number, reason: string) => {
    const oldProd = products.find(p => p.id === productId);
    if (!oldProd) return;

    const newStock = oldProd.stock + quantity;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

    const log: InventoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: oldProd.name,
      type: 'stock_in',
      quantity,
      prevStock: oldProd.stock,
      newStock,
      date: new Date().toISOString(),
      reason: reason || 'Seasonal buffer procurement arrival.'
    };
    setLogs(prev => [...prev, log]);
  };

  // Register a new Farmer on the spot (khata balance initialization)
  const handleQuickRegisterCustomer = (newCust: Omit<Customer, 'id' | 'totalSpent' | 'lastActive'>) => {
    const id = `cust-${Date.now()}`;
    const customer: Customer = {
      ...newCust,
      id,
      totalSpent: 0,
      lastActive: new Date().toISOString()
    };
    setCustomers(prev => [customer, ...prev]);
    return customer;
  };

  // Log automated stock checkout and tally bookkeeping
  const handleRecordSale = (newSale: Omit<Sale, 'id' | 'date'>): Sale => {
    const saleId = `sale-${Date.now()}`;
    const sale: Sale = {
      ...newSale,
      id: saleId,
      date: new Date().toISOString()
    };

    // 1. Deduct units from inventory and throw alerts
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const itemSold = sale.items.find(item => item.productId === p.id);
        if (itemSold) {
          const newStock = Math.max(0, p.stock - itemSold.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });
    });

    // 2. Add individual product movement audits
    const saleLogs: InventoryLog[] = sale.items.map((item, idx) => {
      const parentProd = products.find(p => p.id === item.productId);
      const prevStock = parentProd ? parentProd.stock : 0;
      return {
        id: `log-${Date.now()}-${idx}`,
        productId: item.productId,
        productName: item.productName,
        type: 'stock_out',
        quantity: item.quantity,
        prevStock,
        newStock: Math.max(0, prevStock - item.quantity),
        date: new Date().toISOString(),
        reason: `Deducted for voucher bill ${saleId}`
      };
    });
    setLogs(prev => [...prev, ...saleLogs]);

    // 3. Register financial changes in Farmer credit ledger
    if (sale.customerId) {
      setCustomers(prevCustomers => {
        return prevCustomers.map(c => {
          if (c.id === sale.customerId) {
            const extraDebt = sale.totalAmount - sale.amountPaid;
            return {
              ...c,
              totalSpent: c.totalSpent + sale.totalAmount,
              debt: c.debt + (extraDebt > 0 ? extraDebt : 0),
              lastActive: new Date().toISOString()
            };
          }
          return c;
        });
      });
    }

    setSales(prev => [...prev, sale]);
    return sale;
  };

  // Farmer debt payout collection
  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId) return;

    const amount = Number(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }

    const farmer = customers.find(c => c.id === selectedFarmerId);
    if (!farmer) return;

    if (amount > farmer.debt) {
      alert(`The entry cannot be greater than the actual outstanding debt of ₹${farmer.debt}.`);
      return;
    }

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedFarmerId) {
        return {
          ...c,
          debt: Math.max(0, c.debt - amount),
          lastActive: new Date().toISOString()
        };
      }
      return c;
    }));

    // Record special Virtual Tally Voucher showing negative/payout credit balance
    const payoutVoucher: Sale = {
      id: `vt-${Date.now()}`,
      customerId: selectedFarmerId,
      customerName: farmer.name,
      items: [],
      totalAmount: 0,
      amountPaid: amount,
      paymentMethod: settlePaymentMethod === 'cash' ? 'cash' : 'upi',
      date: new Date().toISOString(),
      notes: `Debt Recipt Voucher. ${settleNotes || 'Manual payment collection.'}`
    };

    setSales(prev => [...prev, payoutVoucher]);
    setSettleAmount('');
    setSettleNotes('');
    setIsSettleModalOpen(false);
    alert('Payment accepted and credited to ledger!');
  };

  // Helper calculation for today's dynamic performance
  const getTodayRevenue = () => {
    const todayStr = selectedDaybookDate; // e.g. "2026-06-10"
    return sales
      .filter(s => s.date.startsWith(todayStr))
      .reduce((sum, s) => sum + s.totalAmount, 0);
  };

  const getTodayProfit = () => {
    const todayStr = selectedDaybookDate;
    const daySales = sales.filter(s => s.date.startsWith(todayStr));
    return daySales.reduce((sum, s) => {
      const parentCost = s.items.reduce((c, item) => c + (item.costPrice * item.quantity), 0);
      return sum + (s.totalAmount - parentCost);
    }, 0);
  };

  // Filter lists for indicators
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
  const totalOutstandingTabs = customers.reduce((sum, c) => sum + (c.debt || 0), 0);
  const selectedFarmerObj = selectedFarmerId ? customers.find(c => c.id === selectedFarmerId) : null;
  const selectedFarmerSales = selectedFarmerId ? sales.filter(s => s.customerId === selectedFarmerId) : [];  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900" id="tally-app-root">
      
      {/* Visual Header & Tally Navigation bar */}
      <header className="bg-white border-b border-zinc-200 sm:sticky sm:top-0 z-40 shadow-xs animate-fade-in" id="app-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-xs">
              <Building2 size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-zinc-90 w-full sm:w-auto leading-tight">{t.appName}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-650 flex items-center gap-1 select-none">
                  <Smartphone className="w-2.5 h-2.5" /> {t.offlineBadge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{t.subTitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-3 self-center sm:self-auto">
            {/* Language switches */}
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 text-xs">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-1 inline-block">भाषा:</span>
              <button
                id="lang-mr-btn"
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  lang === 'mr' ? 'bg-white shadow-3xs text-emerald-805' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                मराठी
              </button>
              <button
                id="lang-hi-btn"
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-white shadow-3xs text-emerald-805' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                हिंदी
              </button>
              <button
                id="lang-en-btn"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-white shadow-3xs text-emerald-850' : 'text-zinc-650 hover:text-zinc-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Quick stock warning shortcut */}
            {lowStockProducts.length > 0 && (
              <button
                type="button"
                id="low-alerts-shortcut-btn"
                onClick={() => setActiveTab('alerts')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg animate-pulse hover:bg-rose-100 cursor-pointer"
              >
                <AlertTriangle size={14} />
                {lowStockProducts.length} {t.statsLowStockCount}
              </button>
            )}

            {/* Date simulator */}
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-xs text-zinc-600">
              <CalendarDays size={14} className="text-zinc-500 shrink-0" />
              <input
                id="daybook-calendar-simulator"
                type="date"
                value={selectedDaybookDate}
                onChange={(e) => {
                  setSelectedDaybookDate(e.target.value);
                }}
                className="bg-transparent font-bold text-zinc-805 focus:outline-none focus:ring-0 cursor-pointer text-xs w-[105px]"
              />
            </div>

            {/* UI Density Switch */}
            <button
              id="toggle-density-btn"
              onClick={() => setDenseMode(!denseMode)}
              className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                denseMode 
                  ? 'bg-zinc-800 border-zinc-800 text-white' 
                  : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {denseMode ? t.standardView : t.simpleView}
            </button>
          </div>
        </div>

        {/* Dense Tabs Indicator */}
        <div className="border-t border-zinc-150 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 overflow-x-auto py-2 -mb-[1px]" aria-label="Tabs">
              <button
                id="tab-dashboard-btn"
                onClick={() => { setActiveTab('dashboard'); setSelectedFarmerId(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white border-zinc-200 text-emerald-800 shadow-3xs'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-850'
                }`}
              >
                {t.tabHome}
              </button>
              
              <button
                id="tab-sales-btn"
                onClick={() => { setActiveTab('sales'); setSelectedFarmerId(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-white border-zinc-200 text-emerald-805 shadow-3xs'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-850'
                }`}
              >
                {t.tabSell}
              </button>

              <button
                id="tab-inventory-btn"
                onClick={() => { setActiveTab('inventory'); setSelectedFarmerId(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-white border-zinc-200 text-emerald-805 shadow-3xs'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-850'
                }`}
              >
                {t.tabStock}
              </button>

              <button
                id="tab-customers-btn"
                onClick={() => { setActiveTab('customers'); setSelectedFarmerId(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'customers' || selectedFarmerId !== null
                    ? 'bg-white border-zinc-200 text-emerald-805 shadow-3xs'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-805'
                }`}
              >
                {t.tabKhata} ({customers.length})
              </button>

              <button
                id="tab-alerts-btn"
                onClick={() => { setActiveTab('alerts'); setSelectedFarmerId(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap relative cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-white border-zinc-200 text-emerald-805 shadow-3xs'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-805'
                }`}
              >
                {t.tabAlerts}
                {lowStockProducts.length > 0 && (
                  <span className="ml-1 bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6" id="app-main-content">
        
        {/* Render Tally Dashboard view */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in" id="dashboard-view-content">
            {/* High level counters */}
            <StatsGrid 
              products={products} 
              customers={customers} 
              sales={sales} 
              lang={lang}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedFarmerId(null);
              }}
            />

            {/* Simulated Tally Trial Balance Day Ledger info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Operatives Daybook Panel */}
              <div className="lg:col-span-2 space-y-5 bg-white p-5 border border-zinc-150 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={16} className="text-emerald-600" />
                      {t.daybookTitle} ({selectedDaybookDate})
                    </h2>
                    <p className="text-xs text-zinc-400">{t.daybookSub}</p>
                  </div>
                  <div className="bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-150 text-xs font-semibold text-zinc-650 flex justify-between gap-4">
                    <span>Inflow: <strong className="text-emerald-700 font-bold">₹{getTodayRevenue().toLocaleString('en-IN')}</strong></span>
                    <span>Profit Margin: <strong className="text-zinc-800 font-bold">₹{getTodayProfit().toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-700">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-150">
                        <th className="px-4 py-2.5">{t.voucherId}</th>
                        <th className="px-4 py-2.5">{t.farmerName}</th>
                        <th className="px-4 py-2.5">{t.paymentMethod}</th>
                        <th className="px-4 py-2.5">{t.soldItems}</th>
                        <th className="px-4 py-2.5 text-right">{t.cashRec}</th>
                        <th className="px-4 py-2.5 text-right font-black text-zinc-900">{t.billTotal}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {sales
                        .filter(s => s.date.startsWith(selectedDaybookDate))
                        .map((s) => (
                           <tr key={s.id} className="hover:bg-zinc-50/50">
                             <td className="px-4 py-3 font-mono font-bold text-zinc-400">{s.id}</td>
                             <td className="px-4 py-3">
                               <span className="font-extrabold text-zinc-850">{s.customerName}</span>
                             </td>
                             <td className="px-4 py-3">
                               <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                 s.paymentMethod === 'credit'
                                   ? 'bg-rose-50 text-rose-700 border-rose-100'
                                   : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                               }`}>
                                 {s.paymentMethod === 'credit' ? t.payCredit : s.paymentMethod === 'upi' ? t.payUpi : t.payCash}
                               </span>
                             </td>
                             <td className="px-4 py-3 max-w-xs truncate text-zinc-500 italic">
                               {s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ') || s.notes || 'Balance Settled (Debt repayment voucher)'}
                             </td>
                             <td className="px-4 py-3 text-right font-semibold text-emerald-700">₹{s.amountPaid}</td>
                             <td className="px-4 py-3 text-right font-bold text-zinc-900">₹{s.totalAmount}</td>
                           </tr>
                         ))}
                      
                      {sales.filter(s => s.date.startsWith(selectedDaybookDate)).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-16 text-center text-zinc-400 italic">
                            {t.noVouchers}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-150 text-xs text-zinc-500 space-y-2">
                  <div className="flex gap-2 items-center">
                    <Info size={14} className="text-emerald-100 fill-emerald-600 stroke-white shrink-0" />
                    <strong>Daily operational diagnostics:</strong>
                  </div>
                  <p>
                    {t.dailyTips}
                  </p>
                </div>
              </div>

              {/* Sidebar Quick-Ledger Summary / Category Ratios */}
              <div className="space-y-6">
                
                {/* Visual Category analysis ratios */}
                <div className="bg-white p-5 border border-zinc-150 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wilder">Catalogue Stock Breakdown</h3>
                  
                  <div className="space-y-3.5">
                    {/* Fertiliser category */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Fertilisers (Nutrients / Solubles)
                        </span>
                        <span className="font-bold text-zinc-900">
                          {products.filter(p => p.category === 'fertilizer').reduce((s, p) => s + p.stock, 0)} bags
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-lg" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Pesticides Category */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          Pesticides (Chemical Defense)
                        </span>
                        <span className="font-bold text-zinc-900">
                          {products.filter(p => p.category === 'pesticide').reduce((s, p) => s + p.stock, 0)} units
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-lg" style={{ width: '30%' }} />
                      </div>
                    </div>

                    {/* Seeds category */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          F1 Hybrid Seeds (Premium)
                        </span>
                        <span className="font-bold text-zinc-900">
                          {products.filter(p => p.category === 'seed').reduce((s, p) => s + p.stock, 0)} packets
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-lg" style={{ width: '25%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-3 flex justify-between text-xs">
                    <span className="text-zinc-400">Total Unique Lines:</span>
                    <strong className="text-zinc-800">{products.length} registered products</strong>
                  </div>
                </div>

                {/* Top outstanding farmer credit widget */}
                <div className="bg-white p-5 border border-zinc-150 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Credit Dues</h3>
                    <button 
                      onClick={() => setActiveTab('customers')} 
                      className="text-[10px] font-bold text-emerald-600 hover:underline uppercase"
                    >
                      Bahi-Khata ledger &rarr;
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {customers
                      .slice()
                      .sort((a,b) => b.debt - a.debt)
                      .filter(c => c.debt > 0)
                      .slice(0, 4)
                      .map(farmer => (
                        <div key={farmer.id} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-zinc-800 block">{farmer.name}</span>
                            <span className="text-[10px] text-zinc-400">Village: {farmer.village}</span>
                          </div>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                            ₹{farmer.debt} due
                          </span>
                        </div>
                      ))}
                    {customers.filter(c => c.debt > 0).length === 0 && (
                      <p className="text-xs text-zinc-400 italic py-3 text-center">No outstanding credits registered!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render Inventory / Stock cataloque Tab */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <InventoryTab 
              products={products}
              logs={logs}
              lang={lang}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onQuickRestock={handleQuickRestock}
            />
          </div>
        )}

        {/* Render Active POS / Voucher Cashbox Tab */}
        {activeTab === 'sales' && (
          <div className="animate-fade-in">
            <SalesTab 
              products={products}
              customers={customers}
              sales={sales}
              lang={lang}
              onRecordSale={handleRecordSale}
              onQuickRegisterCustomer={handleQuickRegisterCustomer}
            />
          </div>
        )}

        {/* Render Low Stock Warning dashboard */}
        {activeTab === 'alerts' && (
          <div className="bg-white p-6 border border-zinc-150 rounded-2xl space-y-6 animate-fade-in" id="low-stock-alert-tab">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <ShieldAlert className="text-rose-650 shrink-0" size={20} />
                  {t.alertsBannerTitle}
                </h2>
                <p className="text-xs text-zinc-400">{t.alertsBannerDesc}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-150 rounded-lg self-start sm:self-auto uppercase">
                {lowStockProducts.length} {t.statsLowStockCount}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lowStockProducts.map(p => (
                <div key={p.id} className="p-4 border border-rose-200 bg-rose-50/20 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                        {p.category === 'fertilizer' ? t.fertilizer : p.category === 'seed' ? t.seed : t.pesticide}
                      </span>
                      <span className="text-xs font-bold text-rose-600 animate-pulse">
                        Level: {p.stock} left
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900">{p.name}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-zinc-400">{t.alertLimit}: {p.minStockAlert} {p.unit}</span>
                    <button
                      id={`restock-warning-btn-${p.id}`}
                      onClick={() => {
                        setActiveTab('inventory');
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {t.quickStockInBtn}
                    </button>
                  </div>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="col-span-full py-16 text-center bg-zinc-50 rounded-xl space-y-2 border border-dashed border-zinc-200">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-zinc-850">{t.allOptimized}</p>
                  <p className="text-xs text-zinc-400">No input items have fallen below safety limits.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render Farmers credit Bahi-Khata and Histories */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="bahi-khata-root">
            
            {/* Left Column: Farmers catalogue with outstanding debt dials */}
            <div className="lg:col-span-4 bg-white p-5 border border-zinc-150 rounded-2xl h-[650px] flex flex-col">
              <div className="pb-3 border-b border-zinc-100 space-y-2">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Farmer Credit Accounts</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    id="farmer-khata-search-input"
                    type="text"
                    placeholder="Search master ledger by name or town..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs placeholder-zinc-400"
                    onChange={(e) => {
                      // Simple inline toggle or filter
                    }}
                  />
                </div>
              </div>

              {/* Farmers list body */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
                {customers.map((farmer) => {
                  const isSelected = selectedFarmerId === farmer.id;
                  return (
                    <button
                      key={farmer.id}
                      id={`farmer-khata-card-${farmer.id}`}
                      onClick={() => setSelectedFarmerId(farmer.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center focus:outline-none ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/10 shadow-xs' 
                          : 'border-zinc-150 bg-white hover:bg-zinc-50/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-800 text-sm leading-tight">{farmer.name}</span>
                          <span className="text-[9px] bg-zinc-100 border px-1 py-0.2 rounded text-zinc-500">{farmer.village}</span>
                        </div>
                        <p className="text-[10px] text-zinc-450 font-medium">Contact: {farmer.phone || 'N/A'}</p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className={`text-xs font-bold block ${farmer.debt > 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                          ₹{farmer.debt}
                        </span>
                        <span className="text-[9px] text-zinc-400 block font-medium">pending bahi</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Farmer profile, purchase histories, receipts payback ledger */}
            <div className="lg:col-span-8 bg-white p-5 border border-zinc-150 rounded-2xl flex flex-col justify-between min-h-[600px]">
              {selectedFarmerId && selectedFarmerObj ? (
                <div className="space-y-6 flex-1">
                  
                  {/* Ledger header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-150">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Ledger Balance Account</span>
                      <h3 className="text-base font-bold text-zinc-900">{selectedFarmerObj.name}</h3>
                      <p className="text-xs text-zinc-500">
                        Town: <strong>{selectedFarmerObj.village}</strong> • Phone Contact: <strong>{selectedFarmerObj.phone || 'Not setup'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block uppercase font-mono">Current Debt tab dues</span>
                        <strong className="text-lg font-black text-rose-600">₹{selectedFarmerObj.debt}</strong>
                      </div>
                      
                      {selectedFarmerObj.debt > 0 && (
                        <button
                          type="button"
                          id="open-debt-settle-pnl-btn"
                          onClick={() => setIsSettleModalOpen(true)}
                          className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                          Collect Payment Settle
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Operational stats */}
                  <div className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs text-zinc-600">
                    <div>
                      <span className="text-zinc-400 block">Gross Lifetime Operations</span>
                      <strong className="text-sm font-bold text-zinc-800">₹{selectedFarmerObj.totalSpent}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Total Booked Transactions</span>
                      <strong className="text-sm font-bold text-zinc-800">{selectedFarmerSales.length} bills</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Latest ledger update</span>
                      <strong className="text-sm font-bold text-zinc-800">
                        {selectedFarmerObj.lastActive ? new Date(selectedFarmerObj.lastActive).toLocaleDateString() : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Chronological transaction history list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Linked Voucher Ledgers (Invoices/Payback receipts)</h4>
                    
                    <div className="overflow-x-auto border border-zinc-150 rounded-xl bg-white max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-150 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Voucher Type</th>
                            <th className="px-4 py-2.5">Purchased items</th>
                            <th className="px-4 py-2.5 text-right">Sum paid</th>
                            <th className="px-4 py-2.5 text-right font-bold text-zinc-900">Gross Bill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {selectedFarmerSales.slice().reverse().map((sale) => (
                            <tr key={sale.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3 text-zinc-450 uppercase whitespace-nowrap">
                                {new Date(sale.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  sale.totalAmount === 0 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                    : sale.paymentMethod === 'credit'
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                                }`}>
                                  {sale.totalAmount === 0 ? 'PAYBACK RECEIPT' : `SALE (${sale.paymentMethod})`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-zinc-500 italic max-w-xs truncate">
                                {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ') || sale.notes || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-700">₹{sale.amountPaid}</td>
                              <td className="px-4 py-3 text-right font-bold text-zinc-900">₹{sale.totalAmount}</td>
                            </tr>
                          ))}
                          
                          {selectedFarmerSales.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 italic">No purchase or payment history found for this farmer.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center py-20 text-center space-y-3">
                  <Users2 size={36} className="text-zinc-300" />
                  <p className="text-zinc-550 text-sm font-semibold">Select a Farmer profile from the ledger listing.</p>
                  <p className="text-zinc-450 text-xs">Verify their village context, review total purchase history, and settle outstanding credits offline.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Settle Debt Modal Dialog */}
      {isSettleModalOpen && selectedFarmerObj && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="debt-settle-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Offline Bahi khata settlement</span>
                <h3 className="text-sm font-bold text-zinc-900">Accept Payment from {selectedFarmerObj.name}</h3>
              </div>
              <button onClick={() => setIsSettleModalOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handlePayDebt} className="space-y-4">
              <div className="space-y-2.5 bg-rose-50 p-4 rounded-xl border border-rose-150 text-xs text-rose-800">
                <div className="flex justify-between">
                  <span className="text-rose-700">Outstanding Farmer Tab Balance:</span>
                  <strong className="text-base text-rose-900 font-black">₹{selectedFarmerObj.debt}</strong>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Enter the payback sum collected. Once finalized, the farmer's ledger balance is deducted immediately inside the mobile's database, and a cash ledger transaction is stored.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650" htmlFor="settle-amount-input">Amount Received (INR) *</label>
                <input
                  id="settle-amount-input"
                  type="number"
                  required
                  min="1"
                  max={selectedFarmerObj.debt}
                  placeholder={`Max Limit ₹${selectedFarmerObj.debt}`}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-650">Collection Instrument *</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSettlePaymentMethod('cash')}
                    className={`p-2 rounded-lg border font-semibold text-center ${
                      settlePaymentMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Cash Box Hand-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlePaymentMethod('upi')}
                    className={`p-2 rounded-lg border font-semibold text-center ${
                      settlePaymentMethod === 'upi'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Direct UPI QR Scan
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650" htmlFor="settle-notes-input">Collection Comments</label>
                <input
                  id="settle-notes-input"
                  type="text"
                  placeholder="e.g. Paid in full post monsoon wheat crop sale..."
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-ledger-settle-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Post Payment Settle Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky footer informational credit bar */}
      <footer className="bg-white border-t border-zinc-200 mt-12 py-5" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-medium">
          <p>© 2026 Agri-Tally Operations Software Inc. All ledger operations are performed offline.</p>
          <p>
            Operating with device index: <strong className="text-emerald-700 font-bold">127.0.0.1 (Localstorage offline ledger)</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
