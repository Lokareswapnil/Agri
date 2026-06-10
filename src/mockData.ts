import { Product, Customer, Sale, InventoryLog } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Urea (46% N) Premium Bag',
    category: 'fertilizer',
    description: 'High nitrogen source for rapid crop growth and greening. Premium coated for slow release.',
    stock: 120,
    minStockAlert: 20,
    unit: 'bags',
    costPrice: 280,
    sellPrice: 350,
    expiryDate: '2029-12-31',
    batchNumber: 'UR-2026-99A',
    manufacturer: 'IFFCO Ltd.'
  },
  {
    id: 'prod-2',
    name: 'DAP (Di-Ammonium Phosphate) 18-46-0',
    category: 'fertilizer',
    description: 'Excellent source of phosphate and nitrogen for root development and germination.',
    stock: 15, // Trigger low stock alert!
    minStockAlert: 25,
    unit: 'bags',
    costPrice: 1100,
    sellPrice: 1350,
    expiryDate: '2029-06-30',
    batchNumber: 'DP-2026-04B',
    manufacturer: 'KRIBHCO'
  },
  {
    id: 'prod-3',
    name: 'MOP (Muriate of Potash) Potassic Fertilizer',
    category: 'fertilizer',
    description: 'Potassium chloride fertilizer to improve crop quality, pest resistance, and yield density.',
    stock: 45,
    minStockAlert: 15,
    unit: 'bags',
    costPrice: 850,
    sellPrice: 1050,
    expiryDate: '2028-11-15',
    batchNumber: 'MP-2025-11X',
    manufacturer: 'Coromandel International'
  },
  {
    id: 'prod-4',
    name: 'Glyphosate 41% SL Herbicide',
    category: 'pesticide',
    description: 'Non-selective systemic herbicide, highly effective on annual and perennial weeds.',
    stock: 8, // Low stock!
    minStockAlert: 10,
    unit: 'liters',
    costPrice: 320,
    sellPrice: 480,
    expiryDate: '2027-04-12',
    batchNumber: 'GL-26-031',
    manufacturer: 'Bayer CropScience'
  },
  {
    id: 'prod-5',
    name: 'Imidacloprid 17.8% SL Insecticide',
    category: 'pesticide',
    description: 'Systemic insecticide for control of sucking insects like aphids, thrips, and whiteflies.',
    stock: 32,
    minStockAlert: 8,
    unit: 'bottles (500ml)',
    costPrice: 450,
    sellPrice: 620,
    expiryDate: '2027-09-20',
    batchNumber: 'IM-26-441',
    manufacturer: 'Syngenta AG'
  },
  {
    id: 'prod-6',
    name: 'Mancozeb 75% WP Broad Spectrum Fungicide',
    category: 'pesticide',
    description: 'Protective contact fungicide for control of blights, leaf spots, and rusts on crops.',
    stock: 28,
    minStockAlert: 10,
    unit: 'packets (1kg)',
    costPrice: 210,
    sellPrice: 290,
    expiryDate: '2027-05-18',
    batchNumber: 'MZ-26-009',
    manufacturer: 'UPL Limited'
  },
  {
    id: 'prod-7',
    name: 'Hybrid Bt Cotton F1 Gold Seeds',
    category: 'seed',
    description: 'High-yielding hybrid cotton seed, insect-resistant with premium boll sizes.',
    stock: 4, // Deeply low stock!
    minStockAlert: 15,
    unit: 'packets (450g)',
    costPrice: 680,
    sellPrice: 820,
    expiryDate: '2026-11-30',
    batchNumber: 'BTC-26-A2',
    manufacturer: 'Mahyco Seeds'
  },
  {
    id: 'prod-8',
    name: 'Shaktiman Hybrid Maize Seeds',
    category: 'seed',
    description: 'Drought-tolerant, high-stalk strength fodder and grain dual-purpose maize seeds.',
    stock: 60,
    minStockAlert: 20,
    unit: 'bags (5kg)',
    costPrice: 420,
    sellPrice: 550,
    expiryDate: '2027-01-15',
    batchNumber: 'SH-25-M9',
    manufacturer: 'Monsanto India'
  },
  {
    id: 'prod-9',
    name: 'Sweet Corn Golden Honey F1 Seeds',
    category: 'seed',
    description: 'Ultra-sweet specialty table corn seeds with excellent disease package and seed vigor.',
    stock: 18,
    minStockAlert: 5,
    unit: 'packets (100g)',
    costPrice: 110,
    sellPrice: 180,
    expiryDate: '2026-10-30',
    batchNumber: 'SC-26-H1',
    manufacturer: 'Seminis'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ramesh Patel',
    phone: '9876543210',
    village: 'Rampur',
    totalSpent: 12450,
    debt: 1250, // Farmer credit line
    lastActive: '2026-06-09T11:30:00Z'
  },
  {
    id: 'cust-2',
    name: 'Suresh Kumar',
    phone: '9123456789',
    village: 'Kalyanpur',
    totalSpent: 22800,
    debt: 0,
    lastActive: '2026-06-10T09:12:00Z'
  },
  {
    id: 'cust-3',
    name: 'Savita Sharma',
    phone: '9456712345',
    village: 'Haripur',
    totalSpent: 4220,
    debt: 350,
    lastActive: '2026-06-05T14:45:00Z'
  },
  {
    id: 'cust-4',
    name: 'Vikram Singh',
    phone: '9632185214',
    village: 'Rampur',
    totalSpent: 35800,
    debt: 4200, // Large active debt
    lastActive: '2026-06-10T15:10:00Z'
  },
  {
    id: 'cust-5',
    name: 'Harish Choudhary',
    phone: '9822334455',
    village: 'Pipaliya',
    totalSpent: 8900,
    debt: 0,
    lastActive: '2026-06-02T10:05:00Z'
  }
];

// Helper to generate dates relative to "now" (2026-06-10)
export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    customerId: 'cust-1',
    customerName: 'Ramesh Patel',
    items: [
      {
        productId: 'prod-1',
        productName: 'Urea (46% N) Premium Bag',
        quantity: 5,
        sellPrice: 350,
        costPrice: 280,
        unit: 'bags'
      },
      {
        productId: 'prod-3',
        productName: 'MOP (Muriate of Potash) Potassic Fertilizer',
        quantity: 2,
        sellPrice: 1050,
        costPrice: 850,
        unit: 'bags'
      }
    ],
    totalAmount: 3850,
    amountPaid: 3000, // 850 debt added
    paymentMethod: 'cash',
    date: '2026-06-04T10:15:00Z',
    notes: 'Partial payment made. Remaining on next crop delivery.'
  },
  {
    id: 'sale-2',
    customerId: 'cust-2',
    customerName: 'Suresh Kumar',
    items: [
      {
        productId: 'prod-8',
        productName: 'Shaktiman Hybrid Maize Seeds',
        quantity: 10,
        sellPrice: 550,
        costPrice: 420,
        unit: 'bags (5kg)'
      }
    ],
    totalAmount: 5500,
    amountPaid: 5500,
    paymentMethod: 'upi',
    date: '2026-06-05T16:20:00Z',
    notes: 'Paid via PhonePe.'
  },
  {
    id: 'sale-3',
    customerId: 'cust-4',
    customerName: 'Vikram Singh',
    items: [
      {
        productId: 'prod-2',
        productName: 'DAP (Di-Ammonium Phosphate) 18-46-0',
        quantity: 12,
        sellPrice: 1350,
        costPrice: 1100,
        unit: 'bags'
      },
      {
        productId: 'prod-5',
        productName: 'Imidacloprid 17.8% SL Insecticide',
        quantity: 4,
        sellPrice: 620,
        costPrice: 450,
        unit: 'bottles (500ml)'
      }
    ],
    totalAmount: 18680,
    amountPaid: 15000, // 3680 debt added
    paymentMethod: 'upi',
    date: '2026-06-07T09:44:00Z',
    notes: 'Bought for sugarcane crop planting season.'
  },
  {
    id: 'sale-4',
    customerId: 'cust-3',
    customerName: 'Savita Sharma',
    items: [
      {
        productId: 'prod-6',
        productName: 'Mancozeb 75% WP Broad Spectrum Fungicide',
        quantity: 3,
        sellPrice: 290,
        costPrice: 210,
        unit: 'packets (1kg)'
      },
      {
        productId: 'prod-9',
        productName: 'Sweet Corn Golden Honey F1 Seeds',
        quantity: 2,
        sellPrice: 180,
        costPrice: 110,
        unit: 'packets (100g)'
      }
    ],
    totalAmount: 1230,
    amountPaid: 1230,
    paymentMethod: 'cash',
    date: '2026-06-08T11:00:00Z'
  },
  {
    id: 'sale-5',
    customerId: 'cust-4',
    customerName: 'Vikram Singh',
    items: [
      {
        productId: 'prod-1',
        productName: 'Urea (46% N) Premium Bag',
        quantity: 10,
        sellPrice: 350,
        costPrice: 280,
        unit: 'bags'
      }
    ],
    totalAmount: 3500,
    amountPaid: 3500,
    paymentMethod: 'cash',
    date: '2026-06-10T15:10:00Z',
    notes: 'Urgent top dressing urea purchase.'
  }
];

export const INITIAL_LOGS: InventoryLog[] = [
  {
    id: 'log-1',
    productId: 'prod-1',
    productName: 'Urea (46% N) Premium Bag',
    type: 'stock_in',
    quantity: 150,
    prevStock: 0,
    newStock: 150,
    date: '2026-06-01T08:00:00Z',
    reason: 'Initial seasonal batch procurement.'
  },
  {
    id: 'log-2',
    productId: 'prod-1',
    productName: 'Urea (46% N) Premium Bag',
    type: 'stock_out',
    quantity: 5,
    prevStock: 150,
    newStock: 145,
    date: '2026-06-04T10:15:00Z',
    reason: 'Sale #sale-1'
  },
  {
    id: 'log-3',
    productId: 'prod-7',
    productName: 'Hybrid Bt Cotton F1 Gold Seeds',
    type: 'adjustment',
    quantity: -2,
    prevStock: 6,
    newStock: 4,
    date: '2026-06-09T18:00:00Z',
    reason: 'Damaged packet written off due to damp corner storage.'
  }
];
