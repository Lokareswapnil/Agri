package com.gpkp162230.agritally

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

// Native Models mimicking the Web schemas
data class Product(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    var stock: Int,
    val minStockAlert: Int,
    val unit: String,
    val costPrice: Int,
    val sellPrice: Int,
    val manufacturer: String
)

data class Customer(
    val id: String,
    val name: String,
    val phone: String,
    val village: String,
    var totalSpent: Int,
    var debt: Int,
    var lastActive: String
)

data class SaleItem(
    val productId: String,
    val productName: String,
    val quantity: Int,
    val sellPrice: Int,
    val costPrice: Int,
    val unit: String
)

data class Sale(
    val id: String,
    val customerId: String,
    val customerName: String,
    val items: List<SaleItem>,
    val totalAmount: Int,
    val amountPaid: Int,
    val paymentMethod: String, // "cash", "upi", "credit"
    val date: String,
    val notes: String
)

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                MainAppScreen(context = this)
            }
        }
    }
}

// Translations Dictionary
object AppTranslations {
    val mr = mapOf(
        "appName" to "अ‍ॅग्री-टॅली",
        "subTitle" to "खते, बियाणे आणि औषधांचे खाते वही",
        "tabHome" to "🏠 संक्षिप्त",
        "tabSell" to "🛒 बिलिंग",
        "tabStock" to "📦 माल स्टॉक",
        "tabKhata" to "👥 उधारी रेकॉर्ड",
        "tabAlerts" to "⚠️ कमी माल",
        "statsTodayRevenue" to "आजची एकूण विक्री",
        "statsTotalUdhaari" to "एकूण उधारी बाकी",
        "statsLowStockCount" to "माल अलर्ट",
        "statsActionReplenish" to "माल लगेच भरा!",
        "statsActionHealthy" to "स्टॉक योग्य आहे",
        "daybookTitle" to "आजचे पक्के बिल",
        "noVouchers" to "आज अजून एकही बिल नाही!",
        "quickRegisterFarmer" to "➕ नवीन शेतकरी",
        "chooseExistingFarmer" to "मागील शेतकरी निवडा",
        "highCreditAlert" to "⚠️ जास्त उधारी! पैसे जमा करा.",
        "grandTotal" to "एकूण देय रक्कम",
        "payCash" to "नगद (CASH)",
        "payUpi" to "UPI स्कॅनर",
        "payCredit" to "उधारी खाते",
        "amountPaidByFarmer" to "मिळालेले पैसे",
        "finalizeBillBtn" to "बिल सुरक्षित जतन करा",
        "allProducts" to "एकूण सर्व माल",
        "availableInventory" to "उपलब्ध संख्या",
        "quickStockInBtn" to "माल जमा करा",
        "confirmStockInBtn" to "अपडेट करा",
        "farmerKhataTitle" to "उधारी खाते वही",
        "searchFarmerPlaceholder" to "नाव/गाव शोधा...",
        "collectPaymentBtn" to "उधारी जमा करा",
        "linkedVouchers" to "पावत्यांचा इतिहास",
        "activeDebt" to "चालू उधारी",
        "debtSettleTitle" to "उधारी पैसे जमा करणे",
        "paybackAmtRec" to "किती रक्कम जमा झाली (₹)"
    )

    val hi = mapOf(
        "appName" to "एग्री-टॅली",
        "subTitle" to "खाद, बीज और कीटनाशकों का बही-खाता",
        "tabHome" to "🏠 संक्षिप्त",
        "tabSell" to "🛒 नया बिल",
        "tabStock" to "📦 कुल स्टॉक",
        "tabKhata" to "👥 उधारी बही",
        "tabAlerts" to "⚠️ कम स्टॉक",
        "statsTodayRevenue" to "आज की बिक्री",
        "statsTotalUdhaari" to "कुल बकाया उधारी",
        "statsLowStockCount" to "स्टॉक चेतावनी",
        "statsActionReplenish" to "माल तुरंत जोड़ें!",
        "statsActionHealthy" to "स्टॉक सुरक्षित है",
        "daybookTitle" to "आज के बने बिल",
        "noVouchers" to "आज अभी तक कोई बिल नहीं बना है!",
        "quickRegisterFarmer" to "➕ नया किसान",
        "chooseExistingFarmer" to "पुराने किसान चुनें",
        "highCreditAlert" to "⚠️ अत्यधिक उधारी! जमा करवाएं।",
        "grandTotal" to "अंतिम मूल्य",
        "payCash" to "नकद (CASH)",
        "payUpi" to "UPI / QR",
        "payCredit" to "खाता उधारी",
        "amountPaidByFarmer" to "दिया गया नकद",
        "finalizeBillBtn" to "बिल सहेजें",
        "allProducts" to "समस्त सामान सूची",
        "availableInventory" to "दुकान में स्टॉक",
        "quickStockInBtn" to "तुरंत जोड़ें",
        "confirmStockInBtn" to "अपडेट करें",
        "farmerKhataTitle" to "शेतकरी बही-खाता",
        "searchFarmerPlaceholder" to "किसान या गांव खोजें...",
        "collectPaymentBtn" to "उधारी पैसे लें",
        "linkedVouchers" to "पुराने लेनदेन",
        "activeDebt" to "बकाया उधारी",
        "debtSettleTitle" to "उधारी जमा रसीद",
        "paybackAmtRec" to "प्राप्त जमा राशि (₹)"
    )

    val en = mapOf(
        "appName" to "Agri-Tally",
        "subTitle" to "Billing & Udhaari Bookkeeping App",
        "tabHome" to "🏠 Summary",
        "tabSell" to "🛒 Billing",
        "tabStock" to "📦 Stock",
        "tabKhata" to "👥 Ledger",
        "tabAlerts" to "⚠️ Alerts",
        "statsTodayRevenue" to "Today's Sale",
        "statsTotalUdhaari" to "Total Udhaari",
        "statsLowStockCount" to "Stock Alerts",
        "statsActionReplenish" to "Requires Restock!",
        "statsActionHealthy" to "Stock is Healthy",
        "daybookTitle" to "Today's Bills",
        "noVouchers" to "No bills made today yet!",
        "quickRegisterFarmer" to "➕ Register Farmer",
        "chooseExistingFarmer" to "Select Farmer",
        "highCreditAlert" to "⚠️ High Outstanding Udhaari!",
        "grandTotal" to "Grand Total",
        "payCash" to "CASH",
        "payUpi" to "UPI QR",
        "payCredit" to "Udhaari Khata",
        "amountPaidByFarmer" to "Cash Received",
        "finalizeBillBtn" to "Save Bill & Record",
        "allProducts" to "All Shop items",
        "availableInventory" to "Available Qty",
        "quickStockInBtn" to "Stock-In",
        "confirmStockInBtn" to "Save",
        "farmerKhataTitle" to "Bahi-Khata Ledger",
        "searchFarmerPlaceholder" to "Search farmer name/village...",
        "collectPaymentBtn" to "Settle / Clear Debt",
        "linkedVouchers" to "Linked Bills History",
        "activeDebt" to "Active Debt",
        "debtSettleTitle" to "Settle Balance",
        "paybackAmtRec" to "Collected Amount (₹)"
    )

    fun get(lang: String, key: String): String {
        return when (lang) {
            "mr" -> mr[key] ?: key
            "hi" -> hi[key] ?: key
            else -> en[key] ?: key
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(context: Context) {
    val prefs = context.getSharedPreferences("agritally_prefs", Context.MODE_PRIVATE)

    // Lang State
    var lang by remember { mutableStateOf(prefs.getString("lang", "mr") ?: "mr") }

    // Helper translation accessor
    fun text(key: String): String {
        return AppTranslations.get(lang, key)
    }

    // Main States loaded from local SharedPreferences
    val productsList = remember { mutableStateListOf<Product>() }
    val customersList = remember { mutableStateListOf<Customer>() }
    val salesList = remember { mutableStateListOf<Sale>() }

    // Seed Initial Datasets if SharedPrefs are empty
    LaunchedEffect(Unit) {
        val prodJson = prefs.getString("products", null)
        val custJson = prefs.getString("customers", null)
        val salesJson = prefs.getString("sales", null)

        if (prodJson != null) {
            val arr = JSONArray(prodJson)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                productsList.add(
                    Product(
                        obj.getString("id"), obj.getString("name"), obj.getString("category"),
                        obj.getString("description"), obj.getInt("stock"), obj.getInt("minStockAlert"),
                        obj.getString("unit"), obj.getInt("costPrice"), obj.getInt("sellPrice"),
                        obj.getString("manufacturer")
                    )
                )
            }
        } else {
            // Seed defaults
            val defaults = listOf(
                Product("prod-1", "Urea Premium Bag", "fertilizer", "IFFCO Nitrogen source", 120, 20, "bags", 280, 350, "IFFCO"),
                Product("prod-2", "DAP Coated Fertilizer", "fertilizer", "Phosphate source", 15, 25, "bags", 1100, 1350, "KRIBHCO"),
                Product("prod-3", "MOP potassic soluble", "fertilizer", "Potassium source", 45, 15, "bags", 850, 1050, "Coromandel"),
                Product("prod-4", "Glyphosate Herbicide", "pesticide", "Selective weeds clear", 8, 10, "liters", 320, 480, "Bayer"),
                Product("prod-5", "Bt Cotton Seeds F1 Gold", "seed", "Premium cotton bolls", 4, 15, "packets", 680, 820, "Mahyco"),
                Product("prod-6", "Shaktiman Hybrid Maize", "seed", "High yield seed", 68, 20, "bags", 420, 550, "Monsanto")
            )
            productsList.addAll(defaults)
        }

        if (custJson != null) {
            val arr = JSONArray(custJson)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                customersList.add(
                    Customer(
                        obj.getString("id"), obj.getString("name"), obj.getString("phone"),
                        obj.getString("village"), obj.getInt("totalSpent"), obj.getInt("debt"),
                        obj.getString("lastActive")
                    )
                )
            }
        } else {
            val defaults = listOf(
                Customer("cust-1", "Ramesh Patel", "9876543210", "Rampur", 12450, 1250, "2026-06-11"),
                Customer("cust-2", "Suresh Kumar", "9123456789", "Kalyanpur", 22800, 0, "2026-06-11"),
                Customer("cust-3", "Savita Sharma", "9456712345", "Haripur", 4220, 350, "2026-06-11"),
                Customer("cust-4", "Vikram Singh", "9632185214", "Rampur", 35800, 4200, "2026-06-11")
            )
            customersList.addAll(defaults)
        }

        if (salesJson != null) {
            val arr = JSONArray(salesJson)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val itemsArr = obj.getJSONArray("items")
                val items = mutableListOf<SaleItem>()
                for (j in 0 until itemsArr.length()) {
                    val io = itemsArr.getJSONObject(j)
                    items.add(
                        SaleItem(
                            io.getString("productId"), io.getString("productName"),
                            io.getInt("quantity"), io.getInt("sellPrice"),
                            io.getInt("costPrice"), io.getString("unit")
                        )
                    )
                }
                salesList.add(
                    Sale(
                        obj.getString("id"), obj.getString("customerId"), obj.getString("customerName"),
                        items, obj.getInt("totalAmount"), obj.getInt("amountPaid"),
                        obj.getString("paymentMethod"), obj.getString("date"), obj.getString("notes")
                    )
                )
            }
        }
    }

    // SharedPreferences sync helper logic
    fun syncToLocalStorage() {
        val prodArr = JSONArray()
        for (p in productsList) {
            val o = JSONObject()
            o.put("id", p.id)
            o.put("name", p.name)
            o.put("category", p.category)
            o.put("description", p.description)
            o.put("stock", p.stock)
            o.put("minStockAlert", p.minStockAlert)
            o.put("unit", p.unit)
            o.put("costPrice", p.costPrice)
            o.put("sellPrice", p.sellPrice)
            o.put("manufacturer", p.manufacturer)
            prodArr.put(o)
        }

        val custArr = JSONArray()
        for (c in customersList) {
            val o = JSONObject()
            o.put("id", c.id)
            o.put("name", c.name)
            o.put("phone", c.phone)
            o.put("village", c.village)
            o.put("totalSpent", c.totalSpent)
            o.put("debt", c.debt)
            o.put("lastActive", c.lastActive)
            custArr.put(o)
        }

        val salesArr = JSONArray()
        for (s in salesList) {
            val o = JSONObject()
            o.put("id", s.id)
            o.put("customerId", s.customerId)
            o.put("customerName", s.customerName)
            o.put("totalAmount", s.totalAmount)
            o.put("amountPaid", s.amountPaid)
            o.put("paymentMethod", s.paymentMethod)
            o.put("date", s.date)
            o.put("notes", s.notes)

            val iArr = JSONArray()
            for (item in s.items) {
                val io = JSONObject()
                io.put("productId", item.productId)
                io.put("productName", item.productName)
                io.put("quantity", item.quantity)
                io.put("sellPrice", item.sellPrice)
                io.put("costPrice", item.costPrice)
                io.put("unit", item.unit)
                iArr.put(io)
            }
            o.put("items", iArr)
            salesArr.put(o)
        }

        prefs.edit().apply {
            putString("lang", lang)
            putString("products", prodArr.toString())
            putString("customers", custArr.toString())
            putString("sales", salesArr.toString())
            apply()
        }
    }

    // Tabs navigation State router
    var selectedTab by remember { mutableStateOf("home") }

    // --- Billing State Form Variables ---
    var billSelectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var billingSearchText by remember { mutableStateOf("") }
    val cartItems = remember { mutableStateListOf<Pair<Product, Int>>() }
    var checkoutMode by remember { mutableStateOf("cash") }
    var farmerPaidText by remember { mutableStateOf("") }
    var notesText by remember { mutableStateOf("") }

    // Modals visibility toggles
    var showRegisterFarmerDialog by remember { mutableStateOf(false) }
    var showStockInDialog by remember { mutableStateOf(false) }
    var selectedStockInProduct by remember { mutableStateOf<Product?>(null) }
    var showSettleDueDialog by remember { mutableStateOf(false) }
    var ledgerDetailsCustomer by remember { mutableStateOf<Customer?>(null) }

    // --- Compute stats metrics ---
    val todayDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    val todaySales = salesList.filter { it.date.startsWith(todayDateStr) }
    val todayRevenueSum = todaySales.sumOf { it.totalAmount }
    val totalOutstandingDebt = customersList.sumOf { it.debt }
    val lowStockAlertsCount = productsList.count { it.stock <= it.minStockAlert }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = text("appName"),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            text = text("subTitle"),
                            fontSize = 11.sp,
                            color = Color(0xFFA7F3D0)
                        )
                    }
                },
                actions = {
                    // Quick language toggles
                    Row(
                        modifier = Modifier.padding(end = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        listOf("mr" to "मराठी", "hi" to "हिंदी", "en" to "EN").forEach { (code, label) ->
                            val isActive = lang == code
                            Box(
                                modifier = Modifier
                                    .background(
                                        color = if (isActive) Color.White else Color(0x33FFFFFF),
                                        shape = RoundedCornerShape(6.dp)
                                    )
                                    .clickable {
                                        lang = code
                                        prefs
                                            .edit()
                                            .putString("lang", code)
                                            .apply()
                                    }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isActive) Color(0xFF065F46) else Color.White
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF065F46))
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                listOf(
                    Triple("home", text("tabHome"), Icons.Default.Assessment),
                    Triple("sell", text("tabSell"), Icons.Default.ShoppingCart),
                    Triple("stock", text("tabStock"), Icons.Default.Inventory),
                    Triple("khata", text("tabKhata"), Icons.Default.People)
                ).forEach { (tabId, label, icon) ->
                    NavigationBarItem(
                        selected = selectedTab == tabId,
                        onClick = {
                            selectedTab = tabId
                            if (tabId != "khata") ledgerDetailsCustomer = null
                        },
                        icon = { Icon(icon, contentDescription = label, tint = if (selectedTab == tabId) Color(0xFF065F46) else Color.Gray) },
                        label = { Text(label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF065F46),
                            unselectedIconColor = Color.Gray
                        )
                    )
                }
            }
        },
        containerColor = Color(0xFFF9FAFB)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
        ) {
            when (selectedTab) {
                "home" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // KPI Grid Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Revenue Metric
                            Card(
                                modifier = Modifier.weight(1f),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .padding(12.dp)
                                        .border(
                                            width = 1.5.dp,
                                            color = Color(0xFFE5E7EB),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Text(
                                        text = text("statsTodayRevenue"),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.Gray
                                    )
                                    Text(
                                        text = "₹$todayRevenueSum",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFF065F46)
                                    )
                                }
                            }

                            // Total Udhaari Debt
                            Card(
                                modifier = Modifier.weight(1f),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .padding(12.dp)
                                        .border(
                                            width = 1.5.dp,
                                            color = Color(0xFFE5E7EB),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Text(
                                        text = text("statsTotalUdhaari"),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.Gray
                                    )
                                    Text(
                                        text = "₹$totalOutstandingDebt",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFFDC2626)
                                    )
                                }
                            }
                        }

                        // Alerts Banner
                        if (lowStockAlertsCount > 0) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFFEF2F2), RoundedCornerShape(12.dp))
                                    .border(1.dp, Color(0xFFFCA5A5), RoundedCornerShape(12.dp))
                                    .clickable { selectedTab = "stock" }
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.Warning,
                                        contentDescription = "Alert",
                                        tint = Color(0xFFB91C1C),
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = "$lowStockAlertsCount " + text("statsLowStockCount") + "! " + text("statsActionReplenish"),
                                        color = Color(0xFF991B1B),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        // Daybook Voucher list
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(14.dp),
                            elevation = CardDefaults.cardElevation(2.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = text("daybookTitle"),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )

                                if (todaySales.isEmpty()) {
                                    Text(
                                        text = text("noVouchers"),
                                        fontSize = 12.sp,
                                        color = Color.Gray,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 24.dp),
                                        textAlign = TextAlign.Center
                                    )
                                } else {
                                    todaySales.forEach { sale ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .border(
                                                    width = 1.dp,
                                                    color = Color(0xFFF3F4F6),
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .padding(12.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = sale.customerName,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    text = "${sale.id} • ${sale.paymentMethod.uppercase(Locale.getDefault())}",
                                                    fontSize = 10.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                            Text(
                                                text = "₹${sale.totalAmount}",
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF059669)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                "sell" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Section 1: Customer Profile picker
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "1. Farmer Account Details",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF111827)
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                val selectCust = billSelectedCustomer
                                if (selectCust != null) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFFECFDF5), RoundedCornerShape(8.dp))
                                            .border(1.dp, Color(0xFFA7F3D0), RoundedCornerShape(8.dp))
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = selectCust.name,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF065F46)
                                            )
                                            Text(
                                                text = "Village: ${selectCust.village} • Dues: ₹${selectCust.debt}",
                                                fontSize = 11.sp,
                                                color = Color(0xFF047857)
                                            )
                                        }
                                        Text(
                                            text = "Change",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.Red,
                                            modifier = Modifier.clickable { billSelectedCustomer = null }
                                        )
                                    }

                                    if (selectCust.debt > 0) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = text("highCreditAlert") + " Outstanding debt is active on this ledger profile",
                                            color = Color(0xFF92400E),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier
                                                .background(Color(0xFFFFFBEB), RoundedCornerShape(6.dp))
                                                .padding(6.dp)
                                        )
                                    }
                                } else {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Button(
                                            onClick = { showRegisterFarmerDialog = true },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46))
                                        ) {
                                            Text(text("quickRegisterFarmer"), fontSize = 11.sp)
                                        }

                                        OutlinedButton(
                                            onClick = { selectedTab = "khata" },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF065F46))
                                        ) {
                                            Text(text("chooseExistingFarmer"), fontSize = 11.sp)
                                        }
                                    }
                                }
                            }
                        }

                        // Section 2: Catalog additions Selector
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "2. Catalog Stock Items Loader",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                OutlinedTextField(
                                    value = billingSearchText,
                                    onValueChange = { billingSearchText = it },
                                    placeholder = { Text("Search shop items (e.g., Urea, Maize)...") },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF065F46),
                                        unfocusedBorderColor = Color.LightGray
                                    )
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                // Show top matches from stock
                                val matches = productsList.filter {
                                    it.name.contains(billingSearchText, ignoreCase = true)
                                }.take(3)

                                matches.forEach { p ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                if (p.stock <= 0) {
                                                    Toast
                                                        .makeText(
                                                            context,
                                                            "Out of stock!",
                                                            Toast.LENGTH_SHORT
                                                        )
                                                        .show()
                                                } else {
                                                    val existsIdx = cartItems.indexOfFirst { it.first.id == p.id }
                                                    if (existsIdx != -1) {
                                                        val qty = cartItems[existsIdx].second
                                                        if (qty >= p.stock) {
                                                            Toast
                                                                .makeText(
                                                                    context,
                                                                    "Max stock limit!",
                                                                    Toast.LENGTH_SHORT
                                                                )
                                                                .show()
                                                        } else {
                                                            cartItems[existsIdx] = p to (qty + 1)
                                                        }
                                                    } else {
                                                        cartItems.add(p to 1)
                                                    }
                                                }
                                            }
                                            .border(
                                                1.dp,
                                                Color(0xFFE5E7EB),
                                                RoundedCornerShape(8.dp)
                                            )
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(p.name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            Text(
                                                "Rate: ₹${p.sellPrice} | Buffer left: ${p.stock}",
                                                fontSize = 10.sp,
                                                color = Color.Gray
                                            )
                                        }
                                        Icon(
                                            Icons.Default.AddCircle,
                                            contentDescription = "Add",
                                            tint = Color(0xFF059669)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Selected cart basket summary
                                Text(
                                    "Products Basket:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Gray
                                )

                                if (cartItems.isEmpty()) {
                                    Text(
                                        "Basket is empty. Scan or select products above.",
                                        fontSize = 11.sp,
                                        color = Color.Gray,
                                        modifier = Modifier.padding(vertical = 12.dp)
                                    )
                                } else {
                                    cartItems.forEachIndexed { index, (prod, qty) ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    prod.name,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    "x$qty | ₹${prod.sellPrice} each",
                                                    fontSize = 10.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                            Text(
                                                "₹${prod.sellPrice * qty}",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 8.dp)
                                            )
                                            IconButton(
                                                onClick = { cartItems.removeAt(index) },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Delete,
                                                    contentDescription = "Remove",
                                                    tint = Color.Red
                                                )
                                            }
                                        }
                                        HorizontalDivider(color = Color(0xFFF3F4F6))
                                    }
                                }
                            }
                        }

                        // Section 3: Final total bill calculations / settlement modes
                        if (cartItems.isNotEmpty()) {
                            val finalBillTotal = cartItems.sumOf { it.first.sellPrice * it.second }

                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "${text("grandTotal")}: ₹$finalBillTotal",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFF065F46)
                                    )

                                    Spacer(modifier = Modifier.height(14.dp))

                                    // Payment Mode Selector Pills
                                    Text(
                                        "Selected Ledger Settlement Type:",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.Gray
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        listOf(
                                            "cash" to text("payCash"),
                                            "upi" to text("payUpi"),
                                            "credit" to text("payCredit")
                                        ).forEach { (mode, label) ->
                                            val isModeSel = checkoutMode == mode
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .background(
                                                        color = if (isModeSel) Color(0xFFECFDF5) else Color(
                                                            0xFFF3F4F6
                                                        ),
                                                        shape = RoundedCornerShape(8.dp)
                                                    )
                                                    .border(
                                                        width = 1.5.dp,
                                                        color = if (isModeSel) Color(0xFF059669) else Color.Transparent,
                                                        shape = RoundedCornerShape(8.dp)
                                                    )
                                                    .clickable { checkoutMode = mode }
                                                    .padding(vertical = 10.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = label,
                                                    fontSize = 10.sp,
                                                    color = if (isModeSel) Color(0xFF047857) else Color.DarkGray,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    // Paid input
                                    OutlinedTextField(
                                        value = farmerPaidText,
                                        onValueChange = { farmerPaidText = it },
                                        label = { Text(text("amountPaidByFarmer")) },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Color(0xFF065F46)
                                        )
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    OutlinedTextField(
                                        value = notesText,
                                        onValueChange = { notesText = it },
                                        label = { Text("Bill Notes (Optional)") },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Color(0xFF065F46)
                                        )
                                    )

                                    Spacer(modifier = Modifier.height(16.dp))

                                    Button(
                                        onClick = {
                                            if (checkoutMode == "credit" && billSelectedCustomer == null) {
                                                Toast
                                                    .makeText(
                                                        context,
                                                        "Please select a farmer to book outstanding dues!",
                                                        Toast.LENGTH_LONG
                                                    )
                                                    .show()
                                                return@Button
                                            }

                                            val paidAmt = farmerPaidText.toIntOrNull() ?: 0
                                            if (paidAmt > finalBillTotal) {
                                                Toast
                                                    .makeText(
                                                        context,
                                                        "Farmer paid cash cannot surpass final bill size!",
                                                        Toast.LENGTH_LONG
                                                    )
                                                    .show()
                                                return@Button
                                            }

                                            // Deduct inventory levels
                                            cartItems.forEach { (prod, qty) ->
                                                val mainIdx = productsList.indexOfFirst { it.id == prod.id }
                                                if (mainIdx != -1) {
                                                    val updatedProd = productsList[mainIdx]
                                                    updatedProd.stock = Math.max(0, updatedProd.stock - qty)
                                                    productsList[mainIdx] = updatedProd
                                                }
                                            }

                                            // Update customer dues
                                            val activeCust = billSelectedCustomer
                                            if (activeCust != null) {
                                                val cIdx = customersList.indexOfFirst { it.id == activeCust.id }
                                                if (cIdx != -1) {
                                                    val original = customersList[cIdx]
                                                    original.totalSpent += finalBillTotal
                                                    if (checkoutMode == "credit") {
                                                        original.debt += (finalBillTotal - paidAmt)
                                                    }
                                                    original.lastActive = SimpleDateFormat(
                                                        "yyyy-MM-dd",
                                                        Locale.getDefault()
                                                    ).format(Date())
                                                    customersList[cIdx] = original
                                                }
                                            }

                                            // Log Sale Voucher transaction
                                            val loggedItems = cartItems.map { (prod, qty) ->
                                                SaleItem(
                                                    prod.id,
                                                    prod.name,
                                                    qty,
                                                    prod.sellPrice,
                                                    prod.costPrice,
                                                    prod.unit
                                                )
                                            }

                                            val saleId = "VCH-${System.currentTimeMillis()}"
                                            salesList.add(
                                                0,
                                                Sale(
                                                    id = saleId,
                                                    customerId = activeCust?.id ?: "walk-in",
                                                    customerName = activeCust?.name ?: "Walk-in Cash Buyer",
                                                    items = loggedItems,
                                                    totalAmount = finalBillTotal,
                                                    amountPaid = paidAmt,
                                                    paymentMethod = checkoutMode,
                                                    date = SimpleDateFormat(
                                                        "yyyy-MM-dd",
                                                        Locale.getDefault()
                                                    ).format(Date()),
                                                    notes = notesText
                                                )
                                            )

                                            syncToLocalStorage()

                                            // Reset billing form
                                            cartItems.clear()
                                            billSelectedCustomer = null
                                            farmerPaidText = ""
                                            notesText = ""
                                            selectedTab = "home"

                                            Toast
                                                .makeText(
                                                    context,
                                                    "Bill generated and saved successfully! ₹$finalBillTotal",
                                                    Toast.LENGTH_LONG
                                                )
                                                .show()
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                                    ) {
                                        Text(text("finalizeBillBtn"), fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }

                "stock" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = text("allProducts"),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            items(productsList) { p ->
                                val isLow = p.stock <= p.minStockAlert
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isLow) Color(0xFFFFFBEB) else Color.White
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(
                                            width = 1.dp,
                                            color = if (isLow) Color(0xFFFBD38D) else Color(0xFFE5E7EB),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    p.name,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                if (isLow) {
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = "REPLENISH",
                                                        fontSize = 8.sp,
                                                        fontWeight = FontWeight.Black,
                                                        color = Color(0xFF991B1B),
                                                        modifier = Modifier
                                                            .background(
                                                                Color(0xFFFED7D7),
                                                                RoundedCornerShape(4.dp)
                                                            )
                                                            .padding(horizontal = 5.dp, vertical = 2.dp)
                                                    )
                                                }
                                            }
                                            Text(
                                                "${p.description} • ${p.manufacturer}",
                                                fontSize = 10.sp,
                                                color = Color.Gray
                                            )
                                            Text(
                                                "Sell Rate: ₹${p.sellPrice} | Buying: ₹${p.costPrice}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "${text("availableInventory")}: ${p.stock} ${p.unit}",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = if (isLow) Color(0xFFB91C1C) else Color(0xFF111827)
                                            )
                                        }

                                        Button(
                                            onClick = {
                                                selectedStockInProduct = p
                                                showStockInDialog = true
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46)),
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                            modifier = Modifier.height(32.dp)
                                        ) {
                                            Text(text("quickStockInBtn"), fontSize = 10.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "khata" -> {
                    val activeCust = ledgerDetailsCustomer
                    if (activeCust == null) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp)
                        ) {
                            Text(
                                text = text("farmerKhataTitle"),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(bottom = 10.dp)
                            )

                            OutlinedTextField(
                                value = billingSearchText,
                                onValueChange = { billingSearchText = it },
                                placeholder = { Text(text("searchFarmerPlaceholder")) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF065F46)
                                )
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                items(customersList.filter {
                                    it.name.contains(billingSearchText, ignoreCase = true) ||
                                            it.village.contains(billingSearchText, ignoreCase = true)
                                }) { c ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color.White, RoundedCornerShape(10.dp))
                                            .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                                            .clickable { ledgerDetailsCustomer = c }
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(c.name, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                            Text(
                                                "Village: ${c.village} • Phone: ${c.phone}",
                                                fontSize = 10.sp,
                                                color = Color.Gray
                                            )
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                "₹${c.debt}",
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Black,
                                                color = if (c.debt > 0) Color.Red else Color.Gray,
                                                modifier = Modifier.padding(end = 4.dp)
                                            )
                                            Icon(
                                                Icons.Default.ChevronRight,
                                                contentDescription = "Details",
                                                tint = Color.Gray
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Detailed Profile view
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Text(
                                text = "← Back to Farmer list",
                                color = Color(0xFF059669),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable { ledgerDetailsCustomer = null }
                            )

                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = activeCust.name,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Text(
                                        "Village: ${activeCust.village} • Phone: ${activeCust.phone}",
                                        fontSize = 11.sp,
                                        color = Color.Gray
                                    )

                                    Spacer(modifier = Modifier.height(14.dp))

                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFFFEF2F2), RoundedCornerShape(10.dp))
                                            .border(1.dp, Color(0xFFFCA5A5), RoundedCornerShape(10.dp))
                                            .padding(14.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = text("activeDebt"),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF991B1B)
                                            )
                                            Text(
                                                text = "₹${activeCust.debt}",
                                                fontSize = 22.sp,
                                                fontWeight = FontWeight.Black,
                                                color = Color(0xFFB91C1C)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                billSelectedCustomer = activeCust
                                                selectedTab = "sell"
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46))
                                        ) {
                                            Text("Settle via New Bill", fontSize = 11.sp)
                                        }

                                        if (activeCust.debt > 0) {
                                            Button(
                                                onClick = { showSettleDueDialog = true },
                                                modifier = Modifier.weight(1f),
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                                            ) {
                                                Text(text("collectPaymentBtn"), fontSize = 11.sp)
                                            }
                                        }
                                    }
                                }
                            }

                            // Accounts ledgers history
                            Text(
                                text = text("linkedVouchers"),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Gray
                            )

                            val customerSales = salesList.filter { it.customerId == activeCust.id }
                            if (customerSales.isEmpty()) {
                                Text(
                                    "No bills registered for this customer yet.",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                            } else {
                                customerSales.forEach { sale ->
                                    val isRec = sale.id.startsWith("REC")
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color.White, RoundedCornerShape(8.dp))
                                            .border(1.dp, Color(0xFFF3F4F6), RoundedCornerShape(8.dp))
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                if (isRec) "💵 DEBT PAYOUT COLLECTED" else "🛒 SALE CUSTOMER BILL",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(sale.date, fontSize = 9.sp, color = Color.Gray)
                                            if (sale.notes.isNotEmpty()) {
                                                Text(
                                                    "Note: ${sale.notes}",
                                                    fontSize = 9.sp,
                                                    color = Color.LightGray
                                                )
                                            }
                                        }
                                        Text(
                                            text = if (isRec) "-₹${sale.amountPaid}" else "+₹${sale.totalAmount}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isRec) Color(0xFF059669) else Color(0xFFB91C1C)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal Dialog implementations

    // 1. Enroll Farmer Dialog Box
    if (showRegisterFarmerDialog) {
        var newFarmerName by remember { mutableStateOf("") }
        var newFarmerPhone by remember { mutableStateOf("") }
        var newFarmerVillage by remember { mutableStateOf("") }

        Dialog(onDismissRequest = { showRegisterFarmerDialog = false }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = text("quickRegisterFarmer"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black
                    )

                    OutlinedTextField(
                        value = newFarmerName,
                        onValueChange = { newFarmerName = it },
                        label = { Text("Farmer Name *") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newFarmerPhone,
                        onValueChange = { newFarmerPhone = it },
                        label = { Text("Phone Number") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newFarmerVillage,
                        onValueChange = { newFarmerVillage = it },
                        label = { Text("Village") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = { showRegisterFarmerDialog = false }) {
                            Text("Cancel", color = Color.Gray)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (newFarmerName.trim().isEmpty()) {
                                    Toast
                                        .makeText(
                                            context,
                                            "Please enter farmer name",
                                            Toast.LENGTH_SHORT
                                        )
                                        .show()
                                    return@Button
                                }
                                val newCust = Customer(
                                    id = "cust-${System.currentTimeMillis()}",
                                    name = newFarmerName.trim(),
                                    phone = newFarmerPhone.trim()
                                        .ifEmpty { "N/A" },
                                    village = newFarmerVillage.trim().ifEmpty { "Local" },
                                    totalSpent = 0,
                                    debt = 0,
                                    lastActive = SimpleDateFormat(
                                        "yyyy-MM-dd",
                                        Locale.getDefault()
                                    ).format(Date())
                                )
                                customersList.add(0, newCust)
                                billSelectedCustomer = newCust
                                syncToLocalStorage()
                                showRegisterFarmerDialog = false
                                Toast
                                    .makeText(
                                        context,
                                        "Farmer registered successfully!",
                                        Toast.LENGTH_SHORT
                                    )
                                    .show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46))
                        ) {
                            Text("Save")
                        }
                    }
                }
            }
        }
    }

    // 2. Stock Replenishment Dialog Box
    if (showStockInDialog && selectedStockInProduct != null) {
        val prod = selectedStockInProduct!!
        var supplyQty by remember { mutableStateOf("") }

        Dialog(onDismissRequest = {
            showStockInDialog = false
            selectedStockInProduct = null
        }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = text("quickStockInBtn"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(prod.name, fontSize = 12.sp, color = Color.Gray)

                    OutlinedTextField(
                        value = supplyQty,
                        onValueChange = { supplyQty = it },
                        label = { Text("New Supply Qty to Add *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = {
                            showStockInDialog = false
                            selectedStockInProduct = null
                        }) {
                            Text("Cancel", color = Color.Gray)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                val added = supplyQty.toIntOrNull() ?: 0
                                if (added <= 0) {
                                    Toast
                                        .makeText(
                                            context,
                                            "Enter valid stock quantity",
                                            Toast.LENGTH_SHORT
                                        )
                                        .show()
                                    return@Button
                                }

                                val mainIdx = productsList.indexOfFirst { it.id == prod.id }
                                if (mainIdx != -1) {
                                    val original = productsList[mainIdx]
                                    original.stock += added
                                    productsList[mainIdx] = original
                                    syncToLocalStorage()
                                }

                                showStockInDialog = false
                                selectedStockInProduct = null
                                Toast
                                    .makeText(
                                        context,
                                        "Stock updated successfully!",
                                        Toast.LENGTH_SHORT
                                    )
                                    .show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46))
                        ) {
                            Text("Save")
                        }
                    }
                }
            }
        }
    }

    // 3. Settle Outstandings Dialog Box
    if (showSettleDueDialog && ledgerDetailsCustomer != null) {
        val cust = ledgerDetailsCustomer!!
        var moneyRecText by remember { mutableStateOf("") }
        var settleChannel by remember { mutableStateOf("cash") }

        Dialog(onDismissRequest = { showSettleDueDialog = false }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = text("debtSettleTitle"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        "Collector: ${cust.name} (Max Outstanding: ₹${cust.debt})",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )

                    OutlinedTextField(
                        value = moneyRecText,
                        onValueChange = { moneyRecText = it },
                        label = { Text(text("paybackAmtRec")) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("cash" to "Cash Box", "upi" to "UPI QR code").forEach { (v, lbl) ->
                            val isSel = settleChannel == v
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        color = if (isSel) Color(0xFFECFDF5) else Color(0xFFF3F4F6),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .border(
                                        width = 1.dp,
                                        color = if (isSel) Color(0xFF059669) else Color.Transparent,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .clickable { settleChannel = v }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = lbl,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSel) Color(0xFF047857) else Color.DarkGray
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = { showSettleDueDialog = false }) {
                            Text("Cancel", color = Color.Gray)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                val amtCollected = moneyRecText.toIntOrNull() ?: 0
                                if (amtCollected <= 0) {
                                    Toast
                                        .makeText(
                                            context,
                                            "Enter a valid settlement amount",
                                            Toast.LENGTH_SHORT
                                        )
                                        .show()
                                    return@Button
                                }
                                if (amtCollected > cust.debt) {
                                    Toast
                                        .makeText(
                                            context,
                                            "Collected amount exceeds outstanding debt!",
                                            Toast.LENGTH_SHORT
                                        )
                                        .show()
                                    return@Button
                                }

                                val cIdx = customersList.indexOfFirst { it.id == cust.id }
                                if (cIdx != -1) {
                                    val original = customersList[cIdx]
                                    original.debt = Math.max(0, original.debt - amtCollected)
                                    original.lastActive = SimpleDateFormat(
                                        "yyyy-MM-dd",
                                        Locale.getDefault()
                                    ).format(Date())
                                    customersList[cIdx] = original
                                    ledgerDetailsCustomer = original
                                }

                                // Create payback logged rsc voucher
                                salesList.add(
                                    0,
                                    Sale(
                                        id = "REC-${System.currentTimeMillis()}",
                                        customerId = cust.id,
                                        customerName = cust.name,
                                        items = emptyList(),
                                        totalAmount = 0,
                                        amountPaid = amtCollected,
                                        paymentMethod = settleChannel,
                                        date = SimpleDateFormat(
                                            "yyyy-MM-dd",
                                            Locale.getDefault()
                                        ).format(Date()),
                                        notes = "Udhaari cash recovery pay scheme voucher via $settleChannel"
                                    )
                                )

                                syncToLocalStorage()
                                showSettleDueDialog = false
                                Toast
                                    .makeText(
                                        context,
                                        "Outstandings reduced by ₹$amtCollected successfully!",
                                        Toast.LENGTH_LONG
                                    )
                                    .show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                        ) {
                            Text("Settle Now")
                        }
                    }
                }
            }
        }
    }
}
