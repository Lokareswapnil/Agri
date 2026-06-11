import React, { useState } from 'react';
import { Search, Plus, Filter, ArrowUpDown, ChevronDown, PackageCheck, AlertTriangle, History, Calendar, HelpCircle } from 'lucide-react';
import { Product, CategoryType, InventoryLog } from '../types';
import { TRANSLATIONS, Language } from '../translations';

interface InventoryTabProps {
  products: Product[];
  logs: InventoryLog[];
  lang: Language;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onQuickRestock: (productId: string, quantity: number, reason: string) => void;
}

export default function InventoryTab({ products, logs, lang, onAddProduct, onEditProduct, onQuickRestock }: InventoryTabProps) {
  const t = TRANSLATIONS[lang];
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'low' | 'healthy'>('all');
  
  // Forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('Routine restock shipment');

  // Input States for New/Edit Product
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'fertilizer' as CategoryType,
    description: '',
    stock: 20,
    minStockAlert: 10,
    unit: 'bags',
    costPrice: 100,
    sellPrice: 130,
    expiryDate: '',
    batchNumber: '',
    manufacturer: ''
  });

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'fertilizer': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pesticide': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'seed': return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    const isLow = p.stock <= p.minStockAlert;
    const matchesStock = selectedStockFilter === 'all' || 
                         (selectedStockFilter === 'low' && isLow) || 
                         (selectedStockFilter === 'healthy' && !isLow);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAdd = () => {
    setProdForm({
      name: '',
      category: 'fertilizer',
      description: '',
      stock: 50,
      minStockAlert: 15,
      unit: 'bags',
      costPrice: 500,
      sellPrice: 650,
      expiryDate: '',
      batchNumber: '',
      manufacturer: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setProdForm({
      name: p.name,
      category: p.category,
      description: p.description,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      expiryDate: p.expiryDate || '',
      batchNumber: p.batchNumber || '',
      manufacturer: p.manufacturer || ''
    });
    setEditingProduct(p);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      ...prodForm,
      stock: Number(prodForm.stock),
      minStockAlert: Number(prodForm.minStockAlert),
      costPrice: Number(prodForm.costPrice),
      sellPrice: Number(prodForm.sellPrice)
    });
    setIsAddOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onEditProduct({
        ...prodForm,
        id: editingProduct.id,
        stock: Number(prodForm.stock),
        minStockAlert: Number(prodForm.minStockAlert),
        costPrice: Number(prodForm.costPrice),
        sellPrice: Number(prodForm.sellPrice)
      });
      setEditingProduct(null);
    }
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockProduct) {
      onQuickRestock(restockProduct.id, restockQty, restockReason);
      setRestockProduct(null);
    }
  };

  // Margin calculation helper
  const calculateMargin = (cost: number, sell: number) => {
    if (sell === 0) return 0;
    return (((sell - cost) / sell) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6" id="inventory-tab-container">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-zinc-150 rounded-2xl animate-fade-in">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="all-items-filter-btn"
            onClick={() => { setSelectedCategory('all'); setSelectedStockFilter('all'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              selectedCategory === 'all' && selectedStockFilter === 'all'
                ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {t.allProducts} ({products.length})
          </button>
          
          <button
            id="fertilizer-filter-btn"
            onClick={() => { setSelectedCategory('fertilizer'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              selectedCategory === 'fertilizer'
                ? 'bg-emerald-750 border-emerald-750 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {t.fertilizersOnly} ({products.filter(p => p.category === 'fertilizer').length})
          </button>

          <button
            id="pesticide-filter-btn"
            onClick={() => { setSelectedCategory('pesticide'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              selectedCategory === 'pesticide'
                ? 'bg-purple-700 border-purple-700 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {t.pesticidesOnly} ({products.filter(p => p.category === 'pesticide').length})
          </button>

          <button
            id="seed-filter-btn"
            onClick={() => { setSelectedCategory('seed'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              selectedCategory === 'seed'
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            {t.seedsOnly} ({products.filter(p => p.category === 'seed').length})
          </button>

          <button
            id="low-stock-filter-btn"
            onClick={() => { setSelectedStockFilter('low'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              selectedStockFilter === 'low'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
            }`}
          >
            {t.lowStockFilter} ({products.filter(p => p.stock <= p.minStockAlert).length})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="add-product-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus size={16} className="stroke-[2.5]" />
            {t.registerNewProductBtn}
          </button>

          <button
            id="view-logs-btn"
            onClick={() => setIsLogOpen(!isLogOpen)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
              isLogOpen 
                ? 'bg-zinc-200 text-zinc-800 border-zinc-300' 
                : 'bg-white hover:bg-zinc-50 text-zinc-600 border-zinc-200'
            }`}
          >
            <History size={16} />
            {isLogOpen ? t.hideAuditLogs : t.viewAuditLogs}
          </button>
        </div>
      </div>

      {/* Main Filter & Search Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            id="product-search-input"
            type="text"
            placeholder={t.searchInventoryPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            id="category-select-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
            className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          >
            <option value="all">{t.allSpecialties}</option>
            <option value="fertilizer">{t.fertilizersOnly}</option>
            <option value="pesticide">{t.pesticidesOnly}</option>
            <option value="seed">{t.seedsOnly}</option>
          </select>
        </div>
      </div>

      {/* audit logs panel toggle */}
      {isLogOpen && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4" id="audit-logs-section">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
              <History size={16} className="text-zinc-500" />
              Stock Audit Logs (Most Recent First)
            </h3>
            <span className="text-xs text-zinc-500">{logs.length} journal entries recorded</span>
          </div>

          <div className="overflow-x-auto border border-zinc-150 rounded-xl bg-white max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product Description</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3 text-right">Qty changed</th>
                  <th className="px-4 py-3 text-right">Stock Level Check</th>
                  <th className="px-4 py-3 pl-6">Adjustment Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-zinc-750">{log.productName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase border ${
                        log.type === 'stock_in' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : log.type === 'stock_out'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                      }`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${log.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-zinc-600">
                      {log.prevStock} &rarr; <span className="font-bold text-zinc-900">{log.newStock}</span>
                    </td>
                    <td className="px-4 py-2.5 pl-6 text-zinc-500 italic max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic">No storage/stock logs logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid of Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-5" id="products-cards-grid">
        {filteredProducts.map((p) => {
          const isLow = p.stock <= p.minStockAlert;
          const isOut = p.stock === 0;

          return (
            <div
              key={p.id}
              id={`product-card-${p.id}`}
              className={`tactile-card flex flex-col bg-white border-2 rounded-2xl transition-all duration-200 overflow-hidden group hover:-translate-y-1`}
              style={{
                borderBottom: isOut 
                  ? '5px solid #ef4444' 
                  : isLow 
                  ? '5px solid #f59e0b' 
                  : '5px solid #10b981'
              }}
            >
              {/* Product Header Card */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border-2 capitalize tracking-wide select-none ${getCategoryColor(p.category)}`}>
                      {p.category}
                    </span>
                    <h4 className="text-base font-display font-extrabold text-zinc-900 tracking-tight leading-snug group-hover:text-emerald-805 transition-colors">{p.name}</h4>
                  </div>
                  
                  {isLow && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider select-none ${
                      isOut ? 'bg-rose-50 text-rose-800 border-2 border-rose-200' : 'bg-amber-50 text-amber-800 border-2 border-amber-200'
                    }`}>
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                      {isOut ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  )}
                </div>

                <div className="text-zinc-500 text-xs line-clamp-2 h-8 leading-relaxed font-semibold">
                  {p.description || 'No additional composition details provided.'}
                </div>

                {/* Technical data attributes as physical tags */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-zinc-50/50 p-3 rounded-xl border border-zinc-200/80 text-[11px] font-semibold">
                  <div>
                    <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[9px]">Mfg / Brand:</span>
                    <p className="font-extrabold text-zinc-700 truncate">{p.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[9px]">Batch / Expiry:</span>
                    <p className={`font-extrabold truncate ${p.expiryDate && new Date(p.expiryDate) < new Date() ? 'text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded px-1' : 'text-zinc-750'}`}>
                      {p.expiryDate ? `${p.batchNumber || 'N/A'} (Exp: ${p.expiryDate})` : `${p.batchNumber || 'N/A'}`}
                    </p>
                  </div>
                </div>

                {/* Stock Level Indicator line */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                    <span className="uppercase text-[10px] tracking-wider">{t.availableInventory}:</span>
                    <span className="font-extrabold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border">
                      {p.stock} <span className="text-zinc-500">{p.unit}</span>
                    </span>
                  </div>
                  
                  {/* custom visual bar */}
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((p.stock / Math.max(p.minStockAlert * 3, 50)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                    <span>{t.alertLimit}: {p.minStockAlert} {p.unit}</span>
                    {isLow && p.stock > 0 && <span className="text-amber-650 font-bold animate-pulse">⚠️ Low Stock!</span>}
                  </div>
                </div>

                {/* Financial details row */}
                <div className="grid grid-cols-3 divide-x divide-zinc-200/60 border-t border-zinc-200/60 pt-3">
                  <div className="text-left pr-2">
                    <span className="text-[10px] text-zinc-450 block uppercase font-bold tracking-wider">{t.costPriceLabel}</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-500 font-mono">₹{p.costPrice}</span>
                  </div>
                  <div className="text-left pl-3 pr-2">
                    <span className="text-[10px] text-zinc-450 block uppercase font-bold tracking-wider">{t.sellPriceLabel}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 font-mono">₹{p.sellPrice}</span>
                  </div>
                  <div className="text-left pl-3">
                    <span className="text-[10px] text-zinc-450 block uppercase font-bold tracking-wider">{t.profitMarginLabel}</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-1 rounded">
                      {calculateMargin(p.costPrice, p.sellPrice)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card actions footer panel with actual tactile buttons */}
              <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-3.5 flex gap-2 justify-between items-center">
                <button
                  id={`quick-restock-btn-${p.id}`}
                  onClick={() => {
                    setRestockProduct(p);
                    setRestockQty(p.minStockAlert * 2 || 20);
                  }}
                  className="px-3.5 py-1.5 cursor-pointer bg-white border-2 border-zinc-250 hover:border-emerald-500 font-display font-extrabold text-[11px] text-zinc-700 hover:text-emerald-805 rounded-xl flex items-center gap-1.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.04)] active:translate-y-0.5 active:shadow-none"
                >
                  <PackageCheck size={13} className="text-emerald-600" />
                  {t.quickStockInBtn}
                </button>

                <button
                  id={`edit-product-btn-${p.id}`}
                  onClick={() => handleOpenEdit(p)}
                  className="px-2 py-1.5 text-zinc-500 hover:text-emerald-700 text-xs font-bold hover:underline cursor-pointer"
                >
                  {t.changeDetailsBtn} &rarr;
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
            <PackageCheck size={36} className="mx-auto text-zinc-300" />
            <p className="text-zinc-500 text-sm font-semibold">No matching products found.</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs overflow-y-auto flex justify-center items-start sm:items-center p-2 sm:p-4 z-50 animate-fade-in" id="add-product-modal">
          <div className="my-auto bg-white rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Register New Agricultural Product</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pname">Product Name *</label>
                  <input
                    id="add-pname"
                    type="text"
                    required
                    placeholder="e.g. Urea 46%, Glycel herbicide"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pcategory">Shop Category *</label>
                  <select
                    id="add-pcategory"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as CategoryType })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  >
                    <option value="fertilizer">Fertiliser Shop (Nutrients)</option>
                    <option value="pesticide">Pesticide Shop (Chemicals/Defense)</option>
                    <option value="seed">Seeds/Hybrid Grains Shop</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-punit">Units Pack-Size *</label>
                  <input
                    id="add-punit"
                    type="text"
                    required
                    placeholder="e.g. bags, liters, packets"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pmanufacturer">Manufacturer/Company *</label>
                  <input
                    id="add-pmanufacturer"
                    type="text"
                    required
                    placeholder="e.g. Syngenta, IFFCO, Bayer"
                    value={prodForm.manufacturer}
                    onChange={(e) => setProdForm({ ...prodForm, manufacturer: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pstock">Initial Stock Quantity *</label>
                  <input
                    id="add-pstock"
                    type="number"
                    min="0"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-palert">Low Stock Warning Limit *</label>
                  <input
                    id="add-palert"
                    type="number"
                    min="1"
                    required
                    value={prodForm.minStockAlert}
                    onChange={(e) => setProdForm({ ...prodForm, minStockAlert: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pcost">Cost Price (₹ per unit) *</label>
                  <input
                    id="add-pcost"
                    type="number"
                    min="0"
                    required
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-psell">Selling Price (₹ per unit) *</label>
                  <input
                    id="add-psell"
                    type="number"
                    min="0"
                    required
                    value={prodForm.sellPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellPrice: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pbatch">Batch Number</label>
                  <input
                    id="add-pbatch"
                    type="text"
                    placeholder="e.g. B-993"
                    value={prodForm.batchNumber}
                    onChange={(e) => setProdForm({ ...prodForm, batchNumber: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650" htmlFor="add-pexpiry">Expiry Date (regulatory critical)</label>
                  <input
                    id="add-pexpiry"
                    type="date"
                    value={prodForm.expiryDate}
                    onChange={(e) => setProdForm({ ...prodForm, expiryDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650" htmlFor="add-pdesc">Product Composition & Crop Recommendations</label>
                <textarea
                  id="add-pdesc"
                  rows={2}
                  placeholder="Describe nitrogen grade, dosage patterns or special precautions (e.g. skin contact warning)..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  id="cancel-add-btn"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-new-product-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs overflow-y-auto flex justify-center items-start sm:items-center p-2 sm:p-4 z-50 animate-fade-in" id="edit-product-modal">
          <div className="my-auto bg-white rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Modify Crop Input Details</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-650 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Shop Category *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as CategoryType })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  >
                    <option value="fertilizer">Fertiliser Shop (Nutrients)</option>
                    <option value="pesticide">Pesticide Shop (Chemicals/Defense)</option>
                    <option value="seed">Seeds/Hybrid Grains Shop</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Units Pack-Size *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Manufacturer/Company *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.manufacturer}
                    onChange={(e) => setProdForm({ ...prodForm, manufacturer: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Current Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Low Stock Warning Limit *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodForm.minStockAlert}
                    onChange={(e) => setProdForm({ ...prodForm, minStockAlert: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Cost Price (₹ per unit) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Selling Price (₹ per unit) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.sellPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellPrice: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Batch Number</label>
                  <input
                    type="text"
                    value={prodForm.batchNumber}
                    onChange={(e) => setProdForm({ ...prodForm, batchNumber: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-650">Expiry Date</label>
                  <input
                    type="date"
                    value={prodForm.expiryDate}
                    onChange={(e) => setProdForm({ ...prodForm, expiryDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650">Product Composition & Crop Recommendations</label>
                <textarea
                  rows={2}
                  placeholder="Describe active ingredients..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Drawer Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs overflow-y-auto flex justify-center items-start sm:items-center p-2 sm:p-4 z-50 animate-fade-in" id="restock-product-modal">
          <div className="my-auto bg-white rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 font-bold">Fast Storage Action</span>
                <h3 className="text-sm font-bold text-zinc-900">Restock {restockProduct.name}</h3>
              </div>
              <button onClick={() => setRestockProduct(null)} className="text-zinc-400 hover:text-zinc-650 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Stock:</span>
                  <span className="font-bold text-zinc-800">{restockProduct.stock} {restockProduct.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Safe Level Benchmark:</span>
                  <span className="font-semibold text-zinc-600">{restockProduct.minStockAlert} {restockProduct.unit}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-medium">
                  <span className="text-zinc-500">Unit Cost:</span>
                  <span className="text-zinc-700">₹{restockProduct.costPrice}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650" htmlFor="quick-restock-qty">Supply Quantity to Check In *</label>
                <div className="flex items-center gap-2">
                  <input
                    id="quick-restock-qty"
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="flex-1 text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-500 font-medium">{restockProduct.unit}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650" htmlFor="quick-restock-reason">Reason / Delivery Partner</label>
                <input
                  id="quick-restock-reason"
                  type="text"
                  placeholder="e.g. Supplier Refill, Seasonal Bulk Restock"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-quick-restock-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
