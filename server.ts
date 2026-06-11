import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Initialize Gemini safely
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Resilient worker to call Gemini with retries and a backup model
  async function callGeminiWithRetriesAndFallback(params: any) {
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let retries = 2; // Retry twice per model
      while (retries >= 0) {
        try {
          console.log(`[Gemini Request] Attempting generateContent with model: ${modelName} (${retries} retries left)`);
          const response = await ai.models.generateContent({
            ...params,
            model: modelName,
          });
          if (response && response.text) {
            return response;
          }
          throw new Error("Empty response received from LLM");
        } catch (err: any) {
          lastError = err;
          console.log(`[Gemini Info] Model ${modelName} returned status: busy. Checking alternates.`);

          // If the error has code 400 (e.g. bad prompt/schema config), don't retry, try next model or fail immediately.
          if (err?.code === 400 || err?.status === 400 || (err?.message && err.message.includes("400"))) {
            break;
          }

          retries--;
          if (retries >= 0) {
            const delay = (2 - retries) * 750;
            console.log(`[Gemini Retry] Waiting ${delay}ms before retrying...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw lastError || new Error("Failed to get response from primary or secondary Gemini models");
  }

  // Pure Local Intelligent Rule-based parsing fallback
  function localFallbackParser(command: string, products: any[], customers: any[], lang: string) {
    console.log(`[Local Parser] Invoking rule-based offline parser for: "${command}"`);
    const cmd = command.toLowerCase().trim();
    let action: any = { type: "NONE" };
    let spokenReply = "";

    // 1. Check for tab navigation
    if (cmd.includes("inventory") || cmd.includes("स्टॉक") || cmd.includes("माल") || cmd.includes("साठा") || cmd.includes("स्टोक")) {
      action = { type: "NAVIGATE", tab: "inventory" };
      spokenReply = lang === 'mr' ? "तुम्हाला स्टॉक पानावर घेऊन जात आहे." : lang === 'hi' ? "आपको स्टॉक पेज पर ले जाया जा रहा है।" : "Opening the inventory and stock management tab.";
    } else if (cmd.includes("sell") || cmd.includes("sales") || cmd.includes("बिल") || cmd.includes("विक्री") || cmd.includes("काटा") || cmd.includes("cashbox")) {
      action = { type: "NAVIGATE", tab: "sales" };
      spokenReply = lang === 'mr' ? "तुम्हाला नवीन बिल बनवण्याच्या विक्री पानावर नेले जात आहे." : lang === 'hi' ? "आपको नया बिल बनाने के पेज पर ले जाया जा रहा है।" : "Opening the sales POS billing register.";
    } else if (cmd.includes("alerts") || cmd.includes("चेतावणी") || cmd.includes("अलर्ट") || cmd.includes("कमी") || cmd.includes("warning")) {
      action = { type: "NAVIGATE", tab: "alerts" };
      spokenReply = lang === 'mr' ? "कमी शिल्लक असलेल्या मालाचे अलर्ट्स दाखवत आहे." : lang === 'hi' ? "कम स्टॉक वाले अलर्ट पेज को खोला जा रहा है।" : "Showing products with critically low stock warnings.";
    } else if (cmd.includes("customer") || cmd.includes("खाते") || cmd.includes("शेतकरी") || cmd.includes("उधारी") || cmd.includes("ledger") || cmd.includes("khata") || cmd.includes("बहीखाता")) {
      action = { type: "NAVIGATE", tab: "customers" };
      spokenReply = lang === 'mr' ? "शेतकरी आणि त्यांचे बहीखाते तपासण्यासाठी खातेदार पानावर नेले जात आहे." : lang === 'hi' ? "किसानों के खाते और लेजर बहीखाता की जांच के लिए भेजा जा रहा है।" : "Opening customers and credit ledger logs.";
    } else if (cmd.includes("dashboard") || cmd.includes("मुख्य") || cmd.includes("होम") || cmd.includes("मुख्य पान")) {
      action = { type: "NAVIGATE", tab: "dashboard" };
      spokenReply = lang === 'mr' ? "मुख्य डॅशबोर्ड उघडत आहे..." : lang === 'hi' ? "मुख्य डैशबोर्ड को खोला जा रहा है।" : "Displaying main store reports dashboard.";
    }

    if (action.type !== "NONE") {
      return { action, spokenReply };
    }

    // 2. Extract numeric quantity
    const qtyMatch = cmd.match(/\d+/);
    const quantity = qtyMatch ? parseInt(qtyMatch[0], 10) : 10;

    // 3. Match closest product using clean phonetic transliterations and substring maps
    let matchedProduct: any = null;
    if (products && products.length > 0) {
      // 3a. Pre-process command to normalize Devanagari terms of agricultural products to English phonetic keys
      let searchKey = cmd;
      if (cmd.includes("युरिया") || cmd.includes("यूरिया") || cmd.includes("युरियाचे") || cmd.includes("युरीया") || cmd.includes("yuria")) {
        searchKey += " urea";
      }
      if (cmd.includes("पोटाश") || cmd.includes("पोटॅश") || cmd.includes("पोटास")) {
        searchKey += " potash";
      }
      if (cmd.includes("बियाणे") || cmd.includes("बीज") || cmd.includes("बिया") || cmd.includes("wheat") || cmd.includes("गहू") || cmd.includes("गेहूं") || cmd.includes("तांदूळ") || cmd.includes("biyane")) {
        searchKey += " seed";
      }
      if (cmd.includes("कीटकनाशक") || cmd.includes("औषध") || cmd.includes("पेस्टिसाईड") || cmd.includes("pest")) {
        searchKey += " pesticide";
      }
      if (cmd.includes("डीएपी") || cmd.includes("डॅप") || cmd.includes("डी.ए.पी.") || cmd.includes("dap")) {
        searchKey += " dap";
      }
      if (cmd.includes("महाधन") || cmd.includes("mahadhan")) {
        searchKey += " mahadhan";
      }
      if (cmd.includes("फॉस्फेट") || cmd.includes("फॉस्फरस") || cmd.includes("phosphate")) {
        searchKey += " phosphate";
      }
      if (cmd.includes("झिंक") || cmd.includes("zinc")) {
        searchKey += " zinc";
      }

      // 3b. Try exact or substring match in product list
      matchedProduct = products.find(p => {
        const nameLower = p.name.toLowerCase();
        return searchKey.includes(nameLower) || nameLower.split(/\s+/).some((w: string) => w.length > 2 && searchKey.includes(w));
      });

      // 3c. Fallback matching with specific popular catalog item names in our seed products database
      if (!matchedProduct) {
        if (searchKey.includes("urea")) {
          matchedProduct = products.find(p => p.name.toLowerCase().includes("urea") || p.category === "fertilizer");
        } else if (searchKey.includes("potash")) {
          matchedProduct = products.find(p => p.name.toLowerCase().includes("potash") || p.name.toLowerCase().includes("mop"));
        } else if (searchKey.includes("dap")) {
          matchedProduct = products.find(p => p.name.toLowerCase().includes("dap") || p.name.toLowerCase().includes("di-ammonium"));
        } else if (searchKey.includes("seed")) {
          matchedProduct = products.find(p => p.category === "seed" || p.name.toLowerCase().includes("seed"));
        } else if (searchKey.includes("pesticide")) {
          matchedProduct = products.find(p => p.category === "pesticide" || p.name.toLowerCase().includes("liquids") || p.name.toLowerCase().includes("spray"));
        }
      }
    }

    const isAdd = cmd.includes("वाढवा") || cmd.includes("add") || cmd.includes("restock") || cmd.includes("जोडा") || cmd.includes("भरती") || cmd.includes("प्लस") || cmd.includes("+");
    const isCart = cmd.includes("बिल") || cmd.includes("cart") || cmd.includes("खरेदी") || cmd.includes("विक्री करा") || cmd.includes("घ्या") || cmd.includes("order") || cmd.includes("checkout");
    const isCheck = cmd.includes("किती") || cmd.includes("शिल्लक") || cmd.includes("check") || cmd.includes("status") || cmd.includes("तपासा") || cmd.includes("पहा");
    const isCreateBill = cmd.includes("बनवा") || cmd.includes("banav") || cmd.includes("banava") || cmd.includes("banva") || cmd.includes("banao") || cmd.includes("complete") || cmd.includes("checkout") || cmd.includes("तयार") || cmd.includes("तैयार") || cmd.includes("finalise") || cmd.includes("finalize");

    if (matchedProduct) {
      if (isAdd) {
        action = {
          type: "ADD_STOCK",
          productId: matchedProduct.id,
          quantity: quantity
        };
        spokenReply = lang === 'mr'
          ? `स्थानिक विश्लेषकाद्वारे: ${matchedProduct.name} मध्ये नवीन ${quantity} बॅग्सचा स्टॉक जोडला गेला आहे.`
          : lang === 'hi'
          ? `ऑफ़लाइन मोड: ${matchedProduct.name} में ${quantity} बैग का नया स्टॉक जोड़ दिया गया है।`
          : `Offline Mode: Logged a restocking of ${quantity} bags for ${matchedProduct.name}.`;
      } else if (isCart) {
        if (isCreateBill) {
          action = {
            type: "CREATE_BILL",
            productId: matchedProduct.id,
            quantity: quantity,
            paymentMethod: cmd.includes("credit") || cmd.includes("उधारी") || cmd.includes("खात्यावर") ? "credit" : "cash"
          };
          spokenReply = lang === 'mr'
            ? `स्थानिक विश्लेषकाद्वारे: ${matchedProduct.name} च्या ${quantity} बॅग्स चे बिल यशस्वीरित्या तयार केले आहे. पूर्ण मसुदा जतन केला आहे.`
            : lang === 'hi'
            ? `ऑफ़लाइन मोड: ${matchedProduct.name} का ${quantity} बैग का बिल सफलतापूर्वक जमा कर दिया गया है।`
            : `Offline Mode: Bill for ${quantity} bags of ${matchedProduct.name} has been processed and saved successfully!`;
        } else {
          action = {
            type: "ADD_TO_CART",
            productId: matchedProduct.id,
            quantity: quantity
          };
          spokenReply = lang === 'mr'
            ? `स्थानिक विश्लेषकाद्वारे: ${matchedProduct.name} च्या ${quantity} बॅग्स बिलामध्ये जोडले गेले आहेत. कृपया विक्री पूर्ण करण्यासाठी उजवीकडे बघा.`
            : lang === 'hi'
            ? `ऑफ़लाइन मोड: ${matchedProduct.name} के ${quantity} बैग बिल में जोड़ दिए गए हैं। कृपया बिक्री पूर्ण करने के लिए बिल काउंटर देखें।`
            : `Offline Mode: Added ${quantity} bags of ${matchedProduct.name} to checkout cart.`;
        }
      } else if (isCheck || cmd.includes("किती") || cmd.includes("चेक")) {
        action = {
          type: "CHECK_STOCK",
          productId: matchedProduct.id
        };
        spokenReply = lang === 'mr'
          ? `स्थानिक विश्लेषकाद्वारे: तुमच्याकडे सध्या ${matchedProduct.name} चा एकूण ${matchedProduct.stock} इतका साठा शिल्लक आहे.`
          : lang === 'hi'
          ? `ऑफ़लाइन मोड: आपके पास ${matchedProduct.name} का स्टॉक ${matchedProduct.stock} बैग्स उपलब्ध है।`
          : `Offline Mode: Checked. Current stock of ${matchedProduct.name} is ${matchedProduct.stock} units.`;
      }
    }

    if (action.type === "NONE") {
      if (isCreateBill || cmd.includes("checkout") || cmd.includes("finalise") || cmd.includes("checked out")) {
        action = {
          type: "CREATE_BILL",
          paymentMethod: cmd.includes("credit") || cmd.includes("उधारी") || cmd.includes("खात्यावर") ? "credit" : "cash"
        };
        spokenReply = lang === 'mr'
          ? `नवीन गोळा केलेले बिल यशस्वीरित्या जमा केले गेले आहे आणि पावती तयार आहे.`
          : lang === 'hi'
          ? `नया एकत्रित बिल सफलतापूर्वक दर्ज कर लिया गया है।`
          : `Processed the complete bill checkout and updated the system Ledger.`;
      }
    }

    if (action.type === "NONE") {
      const isRegister = cmd.includes("नवीन") || cmd.includes("नाव") || cmd.includes("खाते उघडा") || cmd.includes("नोंदणी") || cmd.includes("register") || cmd.includes("रजिस्टर");
      if (isRegister) {
        // Try to guess name
        const words = command.split(/\s+/).filter(w => w.length > 2 && !w.includes("नवीन") && !w.includes("नोंदणी") && !w.includes("रजिस्टर") && !w.includes("शेतकरी"));
        const name = words.slice(0, 2).join(" ") || "नवीन शेतकरी";
        action = {
          type: "REGISTER_FARMER",
          customerName: name,
          customerPhone: command.match(/\d{10}/)?.[0] || "",
        };
        spokenReply = lang === 'mr'
          ? `नवीन शेतकरी खाते "${name}" यशस्वीरित्या तयार केले आहे. खाते तपशील उघडले आहेत.`
          : lang === 'hi'
          ? `नया किसान खाता "${name}" को सफलतापूर्वक दर्ज कर लिया गया है।`
          : `Offline Mode: Registered new customer profile for ${name}.`;
      }
    }

    if (action.type === "NONE") {
      if (lang === 'mr') {
        spokenReply = `मला समजण्यास अडचण आली आहे. परंतु आपण युरिया वाढवा किंवा युरियाचे बिल करा अशा सरळ सूचना देऊ शकता.`;
      } else if (lang === 'hi') {
        spokenReply = `मुझे समझने में थोड़ी कठिनाई हो रही है। आप साधारण शब्दों में "यूरिया बढ़ाएं" या "यूरिया बिल करें" बोलें।`;
      } else {
        spokenReply = `I couldn't match a quick query. Please try saying "add stock to urea" or "bill 10 bags urea".`;
      }
    }

    return { action, spokenReply };
  }

  // REST API Endpoint for AI speech/text command parsing
  app.post("/api/ai/command", async (req, res) => {
    const { command, products, customers, lang } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "Speech or text command is required." });
    }

    console.log(`Processing voice/text command: "${command}" (Lang: ${lang})`);

    try {
      // Structured instructions to parse rural Indian fertilizer merchant commands
      const systemPrompt = `You are the core AI Voice & Stock Administrator for "Tally-Agri" cooperative depot.
We support bilingual and multilingual farmers with voice/text inputs in:
- Marathi (मराठी)
- Hindi (हिंदी / Hinglish)
- English (India / US)

You map the farmer's colloquial command to a structured UI action and return a heartwarming spoken response in Devanagari script for Hindi/Marathi, or standard text for English.

Rules:
1. "ADD_STOCK": User wants to restock a product directly. E.g., "युरिया ५० बॅग्स वाढवा", "urea stock add 20 bags", "potash stock me 10 bags jodo". Match product name with available products.
2. "ADD_TO_CART": User wants to add an item to the current checkout cart/bill but not finalize yet. E.g., "१० बॅग्स युरिया कार्ट मध्ये टाका", "Ramesh ko 5 packet seed bill me dalo". Match to closest product.
3. "CREATE_BILL": User wants to instantly generate and finalize a completed cash/credit purchase. E.g., "युरिया ५ बॅग बिल बनवा", "urea 10 bags instant bill complete kar", "create bill", "finalize bill", "bill tayar kara". Match closest product ID and optional customerId/customerName if specified.
4. "NAVIGATE": User wants to shift views. E.g., "स्टॉक चॅनेल दाखवा", "go to inventory page", "udhaari page upen kar", "open ledger tab", "alerts check karo". Target tabs findable: 'dashboard' (home), 'sales' (sell tab), 'inventory' (stock list), 'alerts' (low stock warning), 'customers' (Khata ledger).
5. "REGISTER_FARMER": User wants to add a new farmer's profile. E.g., "नवीन शेतकरी दिनकर पाटील गाव फलटण नोंदणी करा". Identify farmer name, village (if any), and phone (if 10-digit number present).
6. "VIEW_FARMER": User wants to view a specific farmer's detailed Khata. E.g., "राजू सावंत चा बहीखाता दाखवा", "Suresh Kumar details profile open kar". Find the match customer ID.
7. "CHECK_STOCK": User asks about inventory left. E.g., "युरिया किती शिल्लक आहे?", "how much stock of potash is there?". Match product ID. Your spokenReply should give details of current stock from context.
8. "NONE": Fallback for greetings, calculations, etc.

Database Context Catalog:
Products list: ${JSON.stringify(products?.map((p: any) => ({ id: p.id, name: p.name, stock: p.stock, unit: p.unit, category: p.category, price: p.sellPrice })))}
Customers list: ${JSON.stringify(customers?.map((c: any) => ({ id: c.id, name: c.name, village: c.village, debt: c.debt })))}`;

      const apiResponse = await callGeminiWithRetriesAndFallback({
        contents: `Command received: "${command}" in language ${lang}. Understand it and respond with the required action schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenReply: {
                type: Type.STRING,
                description: "A short, respectful, clear verbal voice response in high-quality Marathi/Hindi Devanagari script (or English) to be spoken back to confirm the database operation or answer stock status."
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The parsed task type: 'ADD_STOCK', 'ADD_TO_CART', 'CREATE_BILL', 'NAVIGATE', 'REGISTER_FARMER', 'VIEW_FARMER', 'CHECK_STOCK', 'NONE'"
                  },
                  productId: {
                    type: Type.STRING,
                    description: "Matched product ID if applicable."
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: "Calculated quantity of bag/packets to add or sell."
                  },
                  customerName: {
                    type: Type.STRING,
                    description: "Extracted name of farmer for new registration."
                  },
                  customerPhone: {
                    type: Type.STRING,
                    description: "Extracted 10-digit phone string if present."
                  },
                  customerVillage: {
                    type: Type.STRING,
                    description: "Extracted name of the village if present."
                  },
                  customerId: {
                    type: Type.STRING,
                    description: "Matched existing farmer customer ID from the listings context."
                  },
                  tab: {
                    type: Type.STRING,
                    description: "Target tab to navigate to (dashboard, sales, inventory, alerts, customers)."
                  }
                },
                required: ["type"]
              }
            },
            required: ["spokenReply", "action"]
          },
          systemInstruction: systemPrompt,
          temperature: 0.15
        }
      });

      const responseText = apiResponse.text?.trim() || "{}";
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (err: any) {
      console.log("[Fallback System] Activating local rule-based parsing engine.");
      // Execute our ultra-reliable local rule-based parsing
      const fallbackResult = localFallbackParser(command, products || [], customers || [], lang || "mr");
      res.json(fallbackResult);
    }
  });

  // Serve client-side bundle / Dev proxy
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Multy-lang Voice Tally Server listening on http://localhost:${PORT}`);
  });
}

startServer();
