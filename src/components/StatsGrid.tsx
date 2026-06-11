import React from 'react';
import { IndianRupee, AlertTriangle, Package2, Users2, TrendingUp, HandCoins } from 'lucide-react';
import { Product, Customer, Sale } from '../types';
import { TRANSLATIONS, Language } from '../translations';

interface StatsGridProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  lang: Language;
  onTabChange: (tab: string) => void;
}

export default function StatsGrid({ products, customers, sales, lang, onTabChange }: StatsGridProps) {
  const t = TRANSLATIONS[lang];

  // Calculations
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  
  // Outstanding Debt/Credit
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.debt || 0), 0);
  
  // Calculate total Cost of Goods Sold (COGS) to find profit
  const totalProfit = sales.reduce((sum, s) => {
    const saleCost = s.items.reduce((cSum, item) => cSum + (item.costPrice * item.quantity), 0);
    return sum + (s.totalAmount - saleCost);
  }, 0);

  // Inventory value at Sell Price vs Cost Price
  const totalInventoryCostValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  // Low stock products count
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);

  const stats = [
    {
      id: 'total-sales',
      name: t.statsTodayRevenue,
      value: `₹${totalSalesRevenue.toLocaleString('en-IN')}`,
      change: `${t.statsTodayProfit}: ₹${totalProfit.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      action: () => onTabChange('dashboard')
    },
    {
      id: 'farmer-credit',
      name: t.statsTotalUdhaari,
      value: `₹${totalOutstandingCredit.toLocaleString('en-IN')}`,
      change: `${customers.filter(c => c.debt > 0).length} ${t.statsActiveFarmers}`,
      icon: HandCoins,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      action: () => onTabChange('customers')
    },
    {
      id: 'stock-valuation',
      name: t.statsTotalInventoryVal,
      value: `₹${totalInventoryCostValue.toLocaleString('en-IN')}`,
      change: `${products.reduce((acc, p) => acc + p.stock, 0)} ${t.statsTotalItems}`,
      icon: Package2,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      action: () => onTabChange('inventory')
    },
    {
      id: 'low-stock',
      name: t.statsLowStockCount,
      value: lowStockProducts.length.toString(),
      change: lowStockProducts.length > 0 ? t.statsActionReplenish : t.statsActionHealthy,
      icon: AlertTriangle,
      color: lowStockProducts.length > 0 
        ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' 
        : 'text-zinc-500 bg-zinc-50 border-zinc-100',
      action: () => onTabChange('alerts')
    }
  ];


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="stats-grid-container">
      {stats.map((stat) => {
        const Icon = stat.icon;
        
        // Match different tactile card highlights depending on the stat
        let accentBorderColor = 'border-bottom-emerald-600 hover:border-bottom-emerald-700';
        if (stat.id === 'farmer-credit') accentBorderColor = 'border-bottom-amber-500 hover:border-bottom-amber-600';
        if (stat.id === 'stock-valuation') accentBorderColor = 'border-bottom-sky-500 hover:border-bottom-sky-600';
        if (stat.id === 'low-stock' && lowStockProducts.length > 0) accentBorderColor = 'border-bottom-rose-500 hover:border-bottom-rose-600 bg-rose-50/10';

        return (
          <button
            key={stat.id}
            id={`stat-card-${stat.id}`}
            onClick={stat.action}
            className={`tactile-card hover:-translate-y-1.5 active:translate-y-0.5 relative flex flex-col text-left p-5 bg-white border border-zinc-200/90 rounded-2xl transition-all duration-200 cursor-pointer shadow-[0_6px_12px_rgba(0,0,0,0.02)] group focus:outline-none`}
            style={{
              borderBottom: stat.id === 'low-stock' && lowStockProducts.length > 0 
                ? '5px solid #ef4444' 
                : stat.id === 'farmer-credit' 
                ? '5px solid #f59e0b' 
                : stat.id === 'stock-valuation' 
                ? '5px solid #0ea5e9' 
                : '5px solid #10b981'
            }}
          >
            {/* Top gradient highlight banner */}
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r opacity-20 from-transparent via-white/50 to-transparent" />

            <div className="flex items-center justify-between w-full">
              <span className="text-zinc-500 text-[10px] sm:text-xs font-bold tracking-wider uppercase font-display">{stat.name}</span>
              <div className={`p-2.5 rounded-xl border-2 shadow-[0_3px_0_rgba(0,0,0,0.05)] ${stat.color} transition-all duration-200 group-hover:scale-110`}>
                <Icon size={16} className="stroke-[2.5]" />
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-zinc-900 tracking-tight leading-none">{stat.value}</span>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-bold tracking-normal group-hover:text-zinc-700 transition-colors bg-zinc-50/80 px-2 py-1 rounded-lg border border-zinc-100">
              <span>{stat.change}</span>
              <span className="text-emerald-600 font-extrabold group-hover:translate-x-1 transition-transform">Details &rarr;</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
