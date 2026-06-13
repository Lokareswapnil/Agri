export type CategoryType = 'fertilizer' | 'pesticide' | 'seed';

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  description: string;
  stock: number;
  minStockAlert: number;
  unit: string; // 'bag', 'liter', 'kg', 'packet', etc.
  costPrice: number;
  sellPrice: number;
  expiryDate: string; // YYYY-MM-DD or empty
  batchNumber: string;
  manufacturer: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  village: string; // Important attribute for agricultural retailers
  totalSpent: number;
  debt: number; // Farmers often buy on credit, extremely useful feature
  lastActive: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  sellPrice: number;
  costPrice: number;
  unit: string;
}

export interface Sale {
  id: string;
  customerId: string | null; // null for Walk-in Customer
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number; // If amountPaid < totalAmount, difference adds to customer debt
  paymentMethod: 'cash' | 'card' | 'credit' | 'upi';
  date: string; // ISO DateTime string
  notes?: string;
  dueDate?: string; // YYYY-MM-DD when farmer promised to clear credit
  reminderSent?: boolean; // track if SMS/WhatsApp reminder sent
  lastReminderDate?: string; // ISO string when reminder was last triggered
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'expiry_removal';
  quantity: number;
  prevStock: number;
  newStock: number;
  date: string;
  reason: string;
}
