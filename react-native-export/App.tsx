import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  HandCoins,
  TrendingUp,
  Package2,
  Users2,
  Calendar,
  Plus,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Search,
  ShoppingCart,
  Store,
  UserCheck,
  Languages
} from "lucide-react-native";

import { TRANSLATIONS } from "./translations";

// Type declarations matching the web application
interface Product {
  id: string;
  name: string;
  category: "fertilizer" | "pesticide" | "seed";
  description: string;
  stock: number;
  minStockAlert: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  manufacturer: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  village: string;
  totalSpent: number;
  debt: number;
  lastActive: string;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  sellPrice: number;
  costPrice: number;
  unit: string;
}

interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number;
  paymentMethod: "cash" | "upi" | "credit";
  date: string;
  notes?: string;
}

// Initial default configuration datasets
const INITIAL_PRODUCTS: Product[] = [
  { id: "prod-1", name: "Urea Premium Bag", category: "fertilizer", description: "IFFCO Nitrogen source", stock: 120, minStockAlert: 20, unit: "bags", costPrice: 280, sellPrice: 350, manufacturer: "IFFCO" },
  { id: "prod-2", name: "DAP Coated Fertilizer", category: "fertilizer", description: "Phosphate source", stock: 15, minStockAlert: 25, unit: "bags", costPrice: 1100, sellPrice: 1350, manufacturer: "KRIBHCO" },
  { id: "prod-3", name: "MOP potassic soluble", category: "fertilizer", description: "Potassum fertilizer", stock: 45, minStockAlert: 15, unit: "bags", costPrice: 850, sellPrice: 1050, manufacturer: "Coromandel" },
  { id: "prod-4", name: "Glyphosate Herbicide", category: "pesticide", description: "Selective weeds clear", stock: 8, minStockAlert: 10, unit: "liters", costPrice: 320, sellPrice: 480, manufacturer: "Bayer" },
  { id: "prod-5", name: "Bt Cotton Seeds F1 Gold", category: "seed", description: "Premium cotton bolls", stock: 4, minStockAlert: 15, unit: "packets", costPrice: 680, sellPrice: 820, manufacturer: "Mahyco" },
  { id: "prod-6", name: "Shaktiman Hybrid Maize", category: "seed", description: "High yield maize seed", stock: 68, minStockAlert: 20, unit: "bags", costPrice: 420, sellPrice: 550, manufacturer: "Monsanto" }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "cust-1", name: "Ramesh Patel", phone: "9876543210", village: "Rampur", totalSpent: 12450, debt: 1250, lastActive: new Date().toISOString() },
  { id: "cust-2", name: "Suresh Kumar", phone: "9123456789", village: "Kalyanpur", totalSpent: 22800, debt: 0, lastActive: new Date().toISOString() },
  { id: "cust-3", name: "Savita Sharma", phone: "9456712345", village: "Haripur", totalSpent: 4220, debt: 350, lastActive: new Date().toISOString() },
  { id: "cust-4", name: "Vikram Singh", phone: "9632185214", village: "Rampur", totalSpent: 35800, debt: 4200, lastActive: new Date().toISOString() }
];

export default function App() {
  const [lang, setLang] = useState<"mr" | "hi" | "en">("mr");
  const t = TRANSLATIONS[lang];

  // Primary mobile core storage engines
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "billing" | "stock" | "khata" | "alerts">("dashboard");

  // Load persistence database variables on phone startup
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem("agritally_products");
        const storedCustomers = await AsyncStorage.getItem("agritally_customers");
        const storedSales = await AsyncStorage.getItem("agritally_sales");
        const storedLang = await AsyncStorage.getItem("agritally_lang");

        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        if (storedSales) setSales(JSON.parse(storedSales));
        if (storedLang) setLang(JSON.parse(storedLang) as "mr" | "hi" | "en");
      } catch (err) {
        console.warn("Storage loading failed:", err);
      }
    };
    loadFromStorage();
  }, []);

  // Sync to database triggers on state mutations
  const saveState = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn("State storage sync failed:", err);
    }
  };

  // --- Billing States ---
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchStock, setSearchStock] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [checkoutMode, setCheckoutMode] = useState<"cash" | "upi" | "credit">("cash");
  const [farmerPaymentAmount, setFarmerPaymentAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  // Customer Enrollment States
  const [enrollName, setEnrollName] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollVillage, setEnrollVillage] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Stock Insertion States
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [addedStockQty, setAddedStockQty] = useState("");
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Bahi Khata settlement state
  const [khataCustomer, setKhataCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settlePaymentType, setSettlePaymentType] = useState<"cash" | "upi">("cash");
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Search Farmers state
  const [farmerSearch, setFarmerSearch] = useState("");
  const [restrictToDues, setRestrictToDues] = useState(true);

  // --- Actions & Billing Executors ---

  const handleRegisterFarmer = () => {
    if (!enrollName.trim()) {
      Alert.alert("Input Error", "Please provide a valid Farmer Name");
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: enrollName.trim(),
      phone: enrollPhone.trim() || "N/A",
      village: enrollVillage.trim() || "Local",
      totalSpent: 0,
      debt: 0,
      lastActive: new Date().toISOString()
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    saveState("agritally_customers", updated);
    setSelectedCustomer(newCust);
    setEnrollName("");
    setEnrollPhone("");
    setEnrollVillage("");
    setShowEnrollModal(false);
    Alert.alert("Success", "Registered and selected farmer profile!");
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert("Out of Stock", "This fertilizer or seed stock level is empty!");
      return;
    }
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        Alert.alert("Warning", "Maximum available stock reached!");
        return;
      }
      setCartItems(cartItems.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  const handleFinalizeBill = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Bill", "Please add at least one product items.");
      return;
    }
    if (checkoutMode === "credit" && !selectedCustomer) {
      Alert.alert("Input Error", "You must select/register a farmer profile to write this bill on Udhaari.");
      return;
    }

    const totalBillVal = cartItems.reduce((acc, current) => {
      return acc + (current.product.sellPrice * current.quantity);
    }, 0);

    const paidCash = Number(farmerPaymentAmount) || 0;
    if (paidCash > totalBillVal) {
      Alert.alert("Input Error", "Farmer payment cash cannot exceeds overall bill size!");
      return;
    }

    const unprovidedLiability = totalBillVal - paidCash;

    // Deduct stock levels on main list
    const updatedProducts = products.map(p => {
      const soldItem = cartItems.find(item => item.product.id === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });

    // Update customer lifetime numbers
    const updatedCustomers = customers.map(c => {
      if (selectedCustomer && c.id === selectedCustomer.id) {
        return {
          ...c,
          totalSpent: c.totalSpent + totalBillVal,
          debt: c.debt + (checkoutMode === "credit" ? unprovidedLiability : 0),
          lastActive: new Date().toISOString()
        };
      }
      return c;
    });

    const newInvoice: Sale = {
      id: `VCH-${Date.now()}`,
      customerId: selectedCustomer ? selectedCustomer.id : "walk-in",
      customerName: selectedCustomer ? selectedCustomer.name : "Walk-in Cash Buyer",
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellPrice: item.product.sellPrice,
        costPrice: item.product.costPrice,
        unit: item.product.unit
      })),
      totalAmount: totalBillVal,
      amountPaid: paidCash,
      paymentMethod: checkoutMode,
      date: new Date().toISOString(),
      notes: remarks
    };

    const newSales = [newInvoice, ...sales];

    // Save outputs
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    setSales(newSales);

    saveState("agritally_products", updatedProducts);
    saveState("agritally_customers", updatedCustomers);
    saveState("agritally_sales", newSales);

    // Reset checkout forms
    setCartItems([]);
    setSelectedCustomer(null);
    setFarmerPaymentAmount("");
    setRemarks("");
    Alert.alert("Bill Generated Successfully!", `Receipt recorded details matching ₹${totalBillVal}.`, [
      { text: "Ok", onPress: () => setActiveTab("dashboard") }
    ]);
  };

  const handleStockReplenish = () => {
    if (!restockProduct) return;
    const qty = Number(addedStockQty);
    if (!qty || qty <= 0) {
      Alert.alert("Input Error", "Please enter a valid stock addition number.");
      return;
    }

    const updated = products.map(p => {
      if (p.id === restockProduct.id) {
        return { ...p, stock: p.stock + qty };
      }
      return p;
    });

    setProducts(updated);
    saveState("agritally_products", updated);
    setShowRestockModal(false);
    setAddedStockQty("");
    setRestockProduct(null);
    Alert.alert("Success", "Shop stock level increased!");
  };

  const handleDebtSettleReceipt = () => {
    if (!khataCustomer) return;
    const amt = Number(settleAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Error", "Please enter a valid cash amount");
      return;
    }
    if (amt > khataCustomer.debt) {
      Alert.alert("Error", "Amount is greater than the outstanding debt.");
      return;
    }

    const updatedCustomers = customers.map(c => {
      if (c.id === khataCustomer.id) {
        return {
          ...c,
          debt: Math.max(0, c.debt - amt),
          lastActive: new Date().toISOString()
        };
      }
      return c;
    });

    // Create a payout receipt invoice
    const payoutReceipt: Sale = {
      id: `REC-${Date.now()}`,
      customerId: khataCustomer.id,
      customerName: khataCustomer.name,
      items: [],
      totalAmount: 0,
      amountPaid: amt,
      paymentMethod: settlePaymentType === "cash" ? "cash" : "upi",
      date: new Date().toISOString(),
      notes: "Udhaari cash recovery payback voucher."
    };

    const updatedSales = [payoutReceipt, ...sales];

    setCustomers(updatedCustomers);
    setSales(updatedSales);
    saveState("agritally_customers", updatedCustomers);
    saveState("agritally_sales", updatedSales);

    setShowSettleModal(false);
    setSettleAmount("");
    setKhataCustomer(null);
    Alert.alert("Payment Recorded!", `Outstanding reduced by ₹${amt}. Ledger updated synced!`);
  };

  // Switch App Languages and save to device preference
  const toggleLanguage = (selectedLang: "mr" | "hi" | "en") => {
    setLang(selectedLang);
    saveState("agritally_lang", selectedLang);
  };

  // Calculations for daily metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter(s => s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalUdhaariAmount = customers.reduce((acc, c) => acc + c.debt, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />
      
      {/* Top Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.appSub}>{t.subTitle}</Text>
        </View>

        {/* Language switches */}
        <View style={styles.langPills}>
          <TouchableOpacity onPress={() => toggleLanguage("mr")} style={[styles.langPill, lang === "mr" && styles.activeLangPill]}>
            <Text style={[styles.langPillText, lang === "mr" && styles.activeLangPillText]}>मराठी</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleLanguage("hi")} style={[styles.langPill, lang === "hi" && styles.activeLangPill]}>
            <Text style={[styles.langPillText, lang === "hi" && styles.activeLangPillText]}>हिंदी</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleLanguage("en")} style={[styles.langPill, lang === "en" && styles.activeLangPill]}>
            <Text style={[styles.langPillText, lang === "en" && styles.activeLangPillText]}>EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Screens Viewport Router */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        
        {/* TAB 1: SUMMARY DASHBOARD */}
        {activeTab === "dashboard" && (
          <View style={styles.section}>
            {/* Quick dashboard cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statsCard, { borderLeftColor: "#059669" }]}>
                <Text style={styles.statsLabel}>{t.statsTodayRevenue}</Text>
                <Text style={styles.statsVal}>₹{todayRevenue}</Text>
              </View>

              <View style={[styles.statsCard, { borderLeftColor: "#dc2626" }]}>
                <Text style={styles.statsLabel}>{t.statsTotalUdhaari}</Text>
                <Text style={styles.statsVal}>₹{totalUdhaariAmount}</Text>
              </View>
            </View>

            {/* Notification alert banner */}
            {lowStockCount > 0 && (
              <TouchableOpacity onPress={() => setActiveTab("alerts")} style={styles.warningAlertBox}>
                <ShieldAlert color="#b91c1c" size={20} />
                <Text style={styles.warningAlertText}>
                  {lowStockCount} {t.statsLowStockCount}! {t.statsActionReplenish}
                </Text>
              </TouchableOpacity>
            )}

            {/* List of Today's generated daybook bills */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t.daybookTitle}</Text>
              </View>

              {todaySales.length === 0 ? (
                <Text style={styles.emptyText}>{t.noVouchers}</Text>
              ) : (
                todaySales.map((s) => (
                  <View key={s.id} style={styles.daybookRow}>
                    <View>
                      <Text style={styles.daybookFarmer}>{s.customerName}</Text>
                      <Text style={styles.daybookMeta}>{s.id} • {s.paymentMethod.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.daybookAmt}>₹{s.totalAmount || s.amountPaid}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: ACTIVE POINT-OF-SALE BILLING */}
        {activeTab === "billing" && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t.tabSell}</Text>

            {/* Selecting or registering farmer account */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t.step1Customer}</Text>
              
              {selectedCustomer ? (
                <View style={styles.selectedFarmerBadge}>
                  <UserCheck color="#065f46" size={18} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.badgeFarmerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.badgeFarmerVillage}>{selectedCustomer.village} • {selectedCustomer.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                    <Text style={styles.badgeRemoveText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.farmerBtns}>
                  <TouchableOpacity onPress={() => setShowEnrollModal(true)} style={[styles.btn, styles.btnOutline]}>
                    <Text style={styles.btnOutlineText}>{t.quickRegisterFarmer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveTab("khata")} style={styles.btn}>
                    <Text style={styles.btnText}>{t.chooseExistingFarmer}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedCustomer && selectedCustomer.debt > 0 && (
                <View style={styles.outstandingBanner}>
                  <Text style={styles.outstandingWarning}>
                    {t.highCreditAlert} (Pending: ₹{selectedCustomer.debt})
                  </Text>
                </View>
              )}
            </View>

            {/* Catalogue Search and Cart Loader */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t.step2Products}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Search Fertilizer or seeds..."
                value={searchStock}
                onChangeText={setSearchStock}
              />

              <View style={styles.stockSearchList}>
                {products
                  .filter(p => p.name.toLowerCase().includes(searchStock.toLowerCase()))
                  .slice(0, 3)
                  .map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.stockSearchRow}
                      onPress={() => handleAddToCart(p)}
                    >
                      <View>
                        <Text style={styles.searchProdName}>{p.name}</Text>
                        <Text style={styles.searchProdSub}>₹{p.sellPrice} • Stock: {p.stock} left</Text>
                      </View>
                      <Plus color="#059669" size={20} />
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Basket list display */}
              <View style={styles.cartContainer}>
                <Text style={styles.cartTitle}>Cart Items</Text>
                {cartItems.length === 0 ? (
                  <Text style={styles.emptyText}>{t.cartIsEmptyPrompt}</Text>
                ) : (
                  cartItems.map(item => (
                    <View key={item.product.id} style={styles.cartRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName}>{item.product.name}</Text>
                        <Text style={styles.cartItemPrices}>x{item.quantity} bags ({item.product.sellPrice}/bag)</Text>
                      </View>
                      <Text style={styles.cartItemSubtotal}>₹{item.product.sellPrice * item.quantity}</Text>
                      <TouchableOpacity onPress={() => handleRemoveFromCart(item.product.id)} style={styles.trashBtn}>
                        <Trash2 color="#dc2626" size={16} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Settlement variables and submission */}
            {cartItems.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.inputLabel}>{t.grandTotal}: ₹{cartItems.reduce((acc, cur) => acc + (cur.product.sellPrice * cur.quantity), 0)}</Text>
                
                {/* Checkout selection modes */}
                <Text style={styles.inputSubLabel}>Payment Mode</Text>
                <View style={styles.paymentSelector}>
                  <TouchableOpacity
                    onPress={() => setCheckoutMode("cash")}
                    style={[styles.payOption, checkoutMode === "cash" && styles.payOptionActive]}
                  >
                    <Text style={[styles.payOptionText, checkoutMode === "cash" && styles.payOptionTextActive]}>{t.payCash}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCheckoutMode("upi")}
                    style={[styles.payOption, checkoutMode === "upi" && styles.payOptionActive]}
                  >
                    <Text style={[styles.payOptionText, checkoutMode === "upi" && styles.payOptionTextActive]}>{t.payUpi}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCheckoutMode("credit")}
                    style={[styles.payOption, checkoutMode === "credit" && styles.payOptionActive]}
                  >
                    <Text style={[styles.payOptionText, checkoutMode === "credit" && styles.payOptionTextActive]}>{t.payCredit}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputSubLabel}>{t.amountPaidByFarmer}</Text>
                <TextInput
                  keyboardType="numeric"
                  style={styles.textInput}
                  placeholder="Enter initial cash paid now..."
                  value={farmerPaymentAmount}
                  onChangeText={setFarmerPaymentAmount}
                />

                <Text style={styles.inputSubLabel}>Notes/Remarks</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="wheat subsidy, partial payment..."
                  value={remarks}
                  onChangeText={setRemarks}
                />

                <TouchableOpacity onPress={handleFinalizeBill} style={[styles.btn, styles.btnSuccess, { marginTop: 15 }]}>
                  <Text style={styles.btnText}>{t.finalizeBillBtn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: STOCK & INVENTORY MANAGEMENT */}
        {activeTab === "stock" && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t.appName} Catalog</Text>

            <View style={styles.stockHeaderRow}>
              <Text style={styles.stockHeaderTitle}>{t.allProducts}</Text>
            </View>

            {products.map(p => {
              const isLow = p.stock <= p.minStockAlert;
              return (
                <View key={p.id} style={[styles.productCard, isLow && styles.productCardLow]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.prodDetails}>
                      <Text style={styles.prodName}>{p.name}</Text>
                      {isLow && <Text style={styles.lowStockBadge}>{t.statsActionReplenish}</Text>}
                    </View>
                    <Text style={styles.prodDesc}>{p.description} • {p.manufacturer}</Text>
                    <Text style={styles.prodUnits}>Price: ₹{p.sellPrice} | Buying: ₹{p.costPrice}</Text>
                    <Text style={styles.prodUnitStock}>{t.availableInventory}: <Text style={{ fontWeight: "800" }}>{p.stock} {p.unit}</Text></Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setRestockProduct(p);
                      setShowRestockModal(true);
                    }}
                    style={[styles.btn, styles.btnSm]}
                  >
                    <Text style={styles.btnText}>{t.quickStockInBtn}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 4: BAHI-KHATA LEDGER */}
        {activeTab === "khata" && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t.farmerKhataTitle}</Text>

            {/* Settle details list */}
            {!khataCustomer ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.searchFarmerPlaceholder}
                  value={farmerSearch}
                  onChangeText={setFarmerSearch}
                />

                <TouchableOpacity
                  onPress={() => setRestrictToDues(!restrictToDues)}
                  style={styles.filterCheckbox}
                >
                  <Text style={styles.filterCheckboxText}>
                    {restrictToDues ? "Showing Only Farmers With Dues" : "Showing All Customer Registers"}
                  </Text>
                </TouchableOpacity>

                {customers
                  .filter(c => {
                    const matchesSearch = c.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
                      c.village.toLowerCase().includes(farmerSearch.toLowerCase());
                    return restrictToDues ? (matchesSearch && c.debt > 0) : matchesSearch;
                  })
                  .map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.khataRow}
                      onPress={() => setKhataCustomer(c)}
                    >
                      <View>
                        <Text style={styles.khataFarmerName}>{c.name}</Text>
                        <Text style={styles.khataFarmerMeta}>Village: {c.village} • Phone: {c.phone}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.khataFarmerDue}>₹{c.debt} due</Text>
                        <ChevronRight color="#9ca3af" size={18} />
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => setKhataCustomer(null)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>&larr; Back to Farmer list</Text>
                </TouchableOpacity>

                <Text style={styles.profileName}>{khataCustomer.name}</Text>
                <Text style={styles.profileMeta}>{khataCustomer.village} • {khataCustomer.phone}</Text>

                <View style={styles.debtMetricBox}>
                  <Text style={styles.debtMetricLabel}>{t.activeDebt}</Text>
                  <Text style={styles.debtMetricValue}>₹{khataCustomer.debt}</Text>
                </View>

                {khataCustomer.debt > 0 ? (
                  <TouchableOpacity
                    onPress={() => setShowSettleModal(true)}
                    style={[styles.btn, styles.btnSuccess]}
                  >
                    <Text style={styles.btnText}>{t.collectPaymentBtn}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noDebtIndicator}>No outstanding debt balances matching this profile.</Text>
                )}

                {/* Vouchers histories */}
                <Text style={styles.historyHeading}>{t.linkedVouchers}</Text>
                {sales.filter(s => s.customerId === khataCustomer.id).length === 0 ? (
                  <Text style={styles.emptyText}>No ledger operations logged under this profile yet.</Text>
                ) : (
                  sales
                    .filter(s => s.customerId === khataCustomer.id)
                    .map(sale => (
                      <View key={sale.id} style={styles.historyRow}>
                        <View>
                          <Text style={styles.historyRowTitle}>{sale.id.startsWith("REC") ? "💵 DEBT SERVICE PAYOUT" : "🛒 BILL VOUCHER"}</Text>
                          <Text style={styles.historyRowMeta}>{new Date(sale.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.historyRowAmt}>
                          {sale.id.startsWith("REC") ? `-₹${sale.amountPaid}` : `+₹${sale.totalAmount}`}
                        </Text>
                      </View>
                    ))
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 5: ALERTS MONITOR */}
        {activeTab === "alerts" && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t.tabAlerts}</Text>
            
            {products.filter(p => p.stock <= p.minStockAlert).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.cleanStockTitle}>Perfect Stock Conditions!</Text>
                <Text style={styles.cleanStockDesc}>All agricultural chemicals and seed inventory units are safe above buffer limit checks.</Text>
              </View>
            ) : (
              products
                .filter(p => p.stock <= p.minStockAlert)
                .map(p => (
                  <View key={p.id} style={styles.lowAlertCard}>
                    <ShieldAlert color="#b91c1c" size={24} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.lowAlertName}>{p.name}</Text>
                      <Text style={styles.lowAlertDetails}>Current Level: {p.stock} {p.unit} remaining (Threshhold: {p.minStockAlert})</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setRestockProduct(p);
                        setShowRestockModal(true);
                      }}
                      style={[styles.btn, styles.btnSm, styles.btnDanger]}
                    >
                      <Text style={styles.btnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>
        )}

      </ScrollView>

      {/* FOOTER TAB NAVIGATOR */}
      <View style={styles.tabbar}>
        <TouchableOpacity
          onPress={() => { setActiveTab("dashboard"); setKhataCustomer(null); }}
          style={[styles.tabItem, activeTab === "dashboard" && styles.tabItemActive]}
        >
          <Store color={activeTab === "dashboard" ? "#047857" : "#6b7280"} size={20} />
          <Text style={[styles.tabLabel, activeTab === "dashboard" && styles.tabLabelActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setActiveTab("billing"); setKhataCustomer(null); }}
          style={[styles.tabItem, activeTab === "billing" && styles.tabItemActive]}
        >
          <ShoppingCart color={activeTab === "billing" ? "#047857" : "#6b7280"} size={20} />
          <Text style={[styles.tabLabel, activeTab === "billing" && styles.tabLabelActive]}>Billing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setActiveTab("stock"); setKhataCustomer(null); }}
          style={[styles.tabItem, activeTab === "stock" && styles.tabItemActive]}
        >
          <Package2 color={activeTab === "stock" ? "#047857" : "#6b7280"} size={20} />
          <Text style={[styles.tabLabel, activeTab === "stock" && styles.tabLabelActive]}>Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setActiveTab("khata"); setKhataCustomer(null); }}
          style={[styles.tabItem, activeTab === "khata" && styles.tabItemActive]}
        >
          <Users2 color={activeTab === "khata" ? "#047857" : "#6b7280"} size={20} />
          <Text style={[styles.tabLabel, activeTab === "khata" && styles.tabLabelActive]}>Khata</Text>
        </TouchableOpacity>
      </View>

      {/* --- POPUP MODAL ENGINES --- */}

      {/* Modal 1: Register Farmer */}
      <Modal visible={showEnrollModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t.quickRegisterFarmer}</Text>

            <Text style={styles.modalFieldLabel}>{t.buyerNameLabel}*</Text>
            <TextInput style={styles.modalInput} placeholder="Enter name of farmer..." value={enrollName} onChangeText={setEnrollName} />

            <Text style={styles.modalFieldLabel}>{t.village}</Text>
            <TextInput style={styles.modalInput} placeholder="Enter village..." value={enrollVillage} onChangeText={setEnrollVillage} />

            <Text style={styles.modalFieldLabel}>{t.phone}</Text>
            <TextInput keyboardType="phone-pad" style={styles.modalInput} placeholder="Contact phone number..." value={enrollPhone} onChangeText={setEnrollPhone} />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowEnrollModal(false)} style={[styles.btn, styles.btnCancel]}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRegisterFarmer} style={[styles.btn, styles.btnSuccess]}>
                <Text style={styles.btnText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Stock Replenishment Quick Add */}
      <Modal visible={showRestockModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t.quickStockInBtn}</Text>
            {restockProduct && <Text style={styles.modalSub}>{restockProduct.name}</Text>}

            <Text style={styles.modalFieldLabel}>Shipment Qty to Add *</Text>
            <TextInput keyboardType="numeric" style={styles.modalInput} placeholder="Bags / Solubles / Packets..." value={addedStockQty} onChangeText={setAddedStockQty} />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowRestockModal(false)} style={[styles.btn, styles.btnCancel]}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStockReplenish} style={[styles.btn, styles.btnSuccess]}>
                <Text style={styles.btnText}>{t.confirmStockInBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Debt Settle / Collection Balance */}
      <Modal visible={showSettleModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t.debtSettleTitle}</Text>
            {khataCustomer && <Text style={styles.modalSub}>Collector name: {khataCustomer.name} (Outstanding: ₹{khataCustomer.debt})</Text>}

            <Text style={styles.modalFieldLabel}>{t.paybackAmtRec} *</Text>
            <TextInput keyboardType="numeric" style={styles.modalInput} placeholder="Enter collected cash (₹)..." value={settleAmount} onChangeText={setSettleAmount} />

            <Text style={styles.modalFieldLabel}>Settle Channel</Text>
            <View style={styles.paymentSelector}>
              <TouchableOpacity
                onPress={() => setSettlePaymentType("cash")}
                style={[styles.payOption, settlePaymentType === "cash" && styles.payOptionActive]}
              >
                <Text style={[styles.payOptionText, settlePaymentType === "cash" && styles.payOptionTextActive]}>Cashbox</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSettlePaymentType("upi")}
                style={[styles.payOption, settlePaymentType === "upi" && styles.payOptionActive]}
              >
                <Text style={[styles.payOptionText, settlePaymentType === "upi" && styles.payOptionTextActive]}>UPI QR Scan</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowSettleModal(false)} style={[styles.btn, styles.btnCancel]}>
                <Text style={styles.btnCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDebtSettleReceipt} style={[styles.btn, styles.btnSuccess]}>
                <Text style={styles.btnText}>{t.postSettleVoucherBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f9fafb"
  },
  header: {
    backgroundColor: "#065f46",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  appSub: {
    color: "#a7f3d0",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2
  },
  langPills: {
    flexDirection: "row",
    backgroundColor: "#047857",
    borderRadius: 8,
    padding: 3
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  activeLangPill: {
    backgroundColor: "#fff"
  },
  langPillText: {
    color: "#a7f3d0",
    fontSize: 10,
    fontWeight: "700"
  },
  activeLangPillText: {
    color: "#065f46"
  },
  body: {
    flex: 1
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40
  },
  section: {
    marginBottom: 20
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flex: 0.48,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  statsLabel: {
    color: "#4b5563",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  statsVal: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  },
  warningAlertBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  warningAlertText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 10,
    flex: 1
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
    textTransform: "uppercase"
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 15
  },
  daybookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  daybookFarmer: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937"
  },
  daybookMeta: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2
  },
  daybookAmt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669"
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4b5563",
    marginTop: 10,
    marginBottom: 5
  },
  textInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937"
  },
  farmerBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5
  },
  btn: {
    backgroundColor: "#065f46",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  btnSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  btnDanger: {
    backgroundColor: "#dc2626"
  },
  btnSuccess: {
    backgroundColor: "#059669"
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#065f46"
  },
  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },
  btnOutlineText: {
    color: "#065f46",
    fontSize: 12,
    fontWeight: "800"
  },
  selectedFarmerBadge: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  badgeFarmerName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#065f46"
  },
  badgeFarmerVillage: {
    fontSize: 10,
    color: "#047857",
    marginTop: 2
  },
  badgeRemoveText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "800"
  },
  outstandingBanner: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    padding: 8,
    marginTop: 10
  },
  outstandingWarning: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "700"
  },
  stockSearchList: {
    marginTop: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 10
  },
  stockSearchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  searchProdName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937"
  },
  searchProdSub: {
    fontSize: 10,
    color: "#6b7280"
  },
  cartContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12
  },
  cartTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4b5563",
    textTransform: "uppercase",
    marginBottom: 8
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937"
  },
  cartItemPrices: {
    fontSize: 10,
    color: "#6b7280"
  },
  cartItemSubtotal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginHorizontal: 12
  },
  trashBtn: {
    padding: 5
  },
  paymentSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  payOption: {
    flex: 0.31,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent"
  },
  payOptionActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#059669"
  },
  payOptionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4b5563"
  },
  payOptionTextActive: {
    color: "#047857"
  },
  stockHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  stockHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4b5563",
    textTransform: "uppercase"
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  productCardLow: {
    backgroundColor: "#fffaf0",
    borderColor: "#fbd38d"
  },
  prodDetails: {
    flexDirection: "row",
    alignItems: "center"
  },
  prodName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937"
  },
  lowStockBadge: {
    backgroundColor: "#fed7d7",
    color: "#9b1c1c",
    fontSize: 8,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6
  },
  prodDesc: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2
  },
  prodUnits: {
    fontSize: 10,
    color: "#4b5563",
    fontWeight: "700",
    marginTop: 3
  },
  prodUnitStock: {
    fontSize: 11,
    color: "#111827",
    marginTop: 4
  },
  filterCheckbox: {
    paddingVertical: 8,
    marginBottom: 12
  },
  filterCheckboxText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669"
  },
  khataRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  khataFarmerName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937"
  },
  khataFarmerMeta: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2
  },
  khataFarmerDue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dc2626",
    marginRight: 4
  },
  backBtn: {
    marginBottom: 12
  },
  backBtnText: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 12
  },
  profileName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827"
  },
  profileMeta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    marginBottom: 12
  },
  debtMetricBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#fca5a5"
  },
  debtMetricLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#991b1b",
    textTransform: "uppercase"
  },
  debtMetricValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#b91c1c",
    marginTop: 4
  },
  noDebtIndicator: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 10
  },
  historyHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4b5563",
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  historyRowTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1f2937"
  },
  historyRowMeta: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 1
  },
  historyRowAmt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827"
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#f0fdf4"
  },
  cleanStockTitle: {
    fontWeight: "800",
    fontSize: 14,
    color: "#15803d",
    marginTop: 10
  },
  cleanStockDesc: {
    fontSize: 11,
    color: "#65a30d",
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 4
  },
  lowAlertCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fca5a5"
  },
  lowAlertName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827"
  },
  lowAlertDetails: {
    fontSize: 10,
    color: "#991b1b",
    marginTop: 1
  },
  tabbar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    justifyContent: "space-around"
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: "#047857",
    paddingTop: -2
  },
  tabLabel: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "700",
    marginTop: 2
  },
  tabLabelActive: {
    color: "#047857",
    fontWeight: "900"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "stretch"
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginBottom: 15,
    textTransform: "uppercase"
  },
  modalSub: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4b5563",
    marginBottom: 4,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937"
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20
  },
  btnCancel: {
    backgroundColor: "#f3f4f6",
    flex: 0.48
  },
  btnCancelText: {
    color: "#4b5563",
    fontWeight: "800"
  }
});
