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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid-container">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.id}
            id={`stat-card-${stat.id}`}
            onClick={stat.action}
            className="flex flex-col text-left p-5 bg-white border border-zinc-150 rounded-2xl hover:border-zinc-300 transition-all duration-200 hover:shadow-xs group focus:outline-none"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">{stat.name}</span>
              <div className={`p-2 rounded-xl border ${stat.color} transition-colors`}>
                <Icon size={18} className="stroke-[2.2]" />
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-2xl font-bold text-zinc-900 tracking-tight">{stat.value}</span>
            </div>
            
            <div className="mt-2 text-xs text-zinc-400 font-medium group-hover:text-zinc-600 transition-colors">
              {stat.change} &rarr;
            </div>
          </button>
        );
      })}
    </div>
  );
}
