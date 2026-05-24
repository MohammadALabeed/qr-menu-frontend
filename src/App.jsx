import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CartSlider from "./components/CartSlider";
import FoodCard from "./components/FoodCard";

// قراءة رابط السيرفر من ملف الـ .env مع رابط احتياطي ذكي لضمان استقرار التطبيق
// استبدل السطر القديم بهذا السطر المباشر:
const API_BASE_URL = "https://backend-virid-kappa-61.vercel.app";

function App() {
  const [lang, setLang] = useState("ar");
  const [activeTab, setActiveTab] = useState("menu");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState({
    vegetarianOnly: false,
    spicyOnly: false,
  });

  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. حالة لإدارة رسائل التوست المنبثقة الأنيقة
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // دالة لإظهار التوست وتصريفه تلقائياً بعد 4 ثوانٍ
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // 2. إدارة رقم الطاولة التفاعلي وحالة شاشة الترحيب
  const [tableNumberState, setTableNumberState] = useState(() => {
    if (typeof window !== "undefined") {
      const queryParams = new URLSearchParams(window.location.search);
      const urlTable = queryParams.get("table");
      if (urlTable) {
        localStorage.setItem("qr_table_number", urlTable);
        sessionStorage.setItem("table_number", urlTable);
        return urlTable;
      }
      return localStorage.getItem("qr_table_number") || sessionStorage.getItem("table_number") || "";
    }
    return "";
  });

  const [inputTable, setInputTable] = useState("");

  const [cart, setCart] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("qr_menu_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth : 1024;
  });

  // جلب المنيو الديناميكي من الباك أند وتنسيقه ليدعم نظام اللغتين والحقول المختلفة بقاعدة البيانات
  useEffect(() => {
    let isMounted = true;

    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/menu`);
        const data = await response.json();
        
        if (isMounted) {
          // تنسيق البيانات القادمة من قاعدة البيانات لتطابق هيكل الفرونت إند تماماً
          const formattedData = data.map((item) => {
            const parseField = (field, fallback) => {
              try {
                return typeof field === 'string' && (field.startsWith('{') || field.startsWith('[')) 
                  ? JSON.parse(field) 
                  : field;
              } catch {
                return fallback;
              }
            };

            const nameObj = parseField(item.name, { ar: item.name, en: item.name });
            const ingredientsObj = parseField(item.ingredients, { ar: [], en: [] });

            return {
              id: item.id,
              name: typeof nameObj === 'object' ? nameObj : { ar: item.name, en: item.name },
              price: parseFloat(item.price),
              category: item.category ? item.category.toLowerCase() : "all",
              ingredients: typeof ingredientsObj === 'object' ? ingredientsObj : { ar: [], en: [] },
              imageUrl: item.image_url || item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", 
              calories: item.calories || 0,
              isVegetarian: item.is_vegetarian === 1 || item.is_vegetarian === true || item.isVegetarian === true,
              isSpicy: item.is_spicy === 1 || item.is_spicy === true || item.isSpicy === true
            };
          });

          setMenuItems(formattedData);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ خطأ في جلب المنيو الديناميكي ومواءمة البيانات:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("qr_menu_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Urbanist:wght@400;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const categories = [
    { id: "all", label: { ar: "الكل 🍽️", en: "All 🍽️" } },
    { id: "burgers", label: { ar: "برجر 🍔", en: "Burgers 🍔" } },
    { id: "pizza", label: { ar: "بيتزا 🍕", en: "Pizza 🍕" } },
    { id: "appetizers", label: { ar: "مقبلات 🍟", en: "Appetizers 🍟" } },
    { id: "drinks", label: { ar: "مشروبات 🥤", en: "Drinks 🥤" } },
  ];

  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesVegetarian = !filters.vegetarianOnly || item.isVegetarian;
    const matchesSpicy = !filters.spicyOnly || item.isSpicy;
    return matchesCategory && matchesVegetarian && matchesSpicy;
  });

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    showToast(lang === "ar" ? "📥 تم إضافة الوجبة للسلة" : "📥 Item added to cart", "success");
  };

  const decreaseQuantity = (itemId) => {
    const existingItem = cart.find((item) => item.id === itemId);
    if (!existingItem) return;
    
    if (existingItem.quantity === 1) {
      setCart(cart.filter((item) => item.id !== itemId));
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      );
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find((item) => item.id === itemId);
    if (existingItem) {
      setCart(cart.filter((item) => item.id !== itemId));
    }
  };

  const cartTotal = cart
    .reduce((total, item) => total + item.price * item.quantity, 0)
    .toFixed(2);

  const getTableNumber = () => {
    return tableNumberState || "1";
  };

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (!inputTable.trim()) return;
    const finalTable = inputTable.trim();
    localStorage.setItem("qr_table_number", finalTable);
    sessionStorage.setItem("table_number", finalTable);
    setTableNumberState(finalTable);
    showToast(lang === "ar" ? `👑 أهلاً بك! تم تثبيت طاولة رقم ${finalTable}` : `👑 Welcome! Table ${finalTable} set.`, "success");
  };

  const sendOrderToBackend = async () => {
    if (cart.length === 0) {
      showToast(
        lang === "ar" ? "⚠️ يجب اختيار وجبة واحدة على الأقل قبل إرسال الطلب!" : "⚠️ You must select at least one item before ordering!", 
        "error"
      );
      return;
    }

    const tableNumber = getTableNumber();

    const orderData = {
      table_number: tableNumber,
      total_price: parseFloat(cartTotal),
      items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price, 
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          lang === "ar"
            ? `🛎️ تم إرسال طلبك للمطبخ بنجاح! طاولة رقم (${tableNumber}) قيد التحضير الفوري.`
            : `🛎️ Your order has been sent to the kitchen successfully for Table (${tableNumber})!`,
          "success"
        );
        setCart([]);
        setIsCartOpen(false);
      } else {
        showToast(
          lang === "ar"
            ? `❌ فشل إرسال الطلب: ${data.message}`
            : `❌ Failed to send order: ${data.message}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending order to backend:", error);
      showToast(
        lang === "ar"
          ? "❌ حدث خطأ أثناء الاتصال بالسيرفر. تأكد أن الباك أند شغال!"
          : "❌ Server connection error. Make sure backend is running!",
        "error"
      );
    }
  };

  const sendFeedbackToBackend = async (e) => {
    e.preventDefault();
    
    const tableNumber = getTableNumber();

    const feedbackData = {
      table_number: tableNumber,
      rating: rating,
      comment: feedbackText,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          lang === "ar"
            ? "❤️ تم إرسال تقييمك ورأيك للإدارة بنجاح! شكراً لك."
            : "❤️ Thank you! Your feedback has been submitted successfully.",
          "success"
        );
        setFeedbackText("");
        setRating(5);
      } else {
        showToast(
          lang === "ar"
            ? `❌ فشل الإرسال: ${data.message}`
            : `❌ Failed to submit feedback: ${data.message}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      showToast(
        lang === "ar"
          ? "❌ حدث خطأ أثناء الاتصال بالسيرفر. تأكد أن الباك أند شغال!"
          : "❌ Server connection error. Make sure backend is running!",
        "error"
      );
    }
  };

  if (!tableNumberState) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#070a13",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: lang === "ar" ? "'Tajawal', sans-serif" : "'Urbanist', sans-serif",
        padding: "20px",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden" 
      }} dir={lang === "ar" ? "rtl" : "ltr"}>
        <div style={{
          backgroundColor: "rgba(15, 22, 38, 0.9)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          padding: "40px 30px",
          borderRadius: "28px",
          maxWidth: "450px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box"
        }}>
          <h1 style={{ color: "#ffffff", fontSize: "28px", marginBottom: "10px", fontWeight: "700" }}>
            {lang === "ar" ? "أهلاً بك في مطعم الفيو ✨" : "Welcome to View ✨"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "15px", marginBottom: "30px" }}>
            {lang === "ar" ? "الرجاء إدخال رقم الطاولة الخاصة بك لبدء استكشاف المنيو والطلب" : "Please enter your table number to explore the menu and order"}
          </p>
          <form onSubmit={handleSaveTable} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="number"
              placeholder={lang === "ar" ? "رقم الطاولة..." : "Table Number..."}
              value={inputTable}
              onChange={(e) => setInputTable(e.target.value)}
              required
              min="1"
              style={{
                padding: "14px",
                borderRadius: "16px",
                backgroundColor: "#070a13",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                fontSize: "16px",
                textAlign: "center",
                outline: "none",
                transition: "all 0.25s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.border = "1px solid #10b981"}
              onBlur={(e) => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
            />
            <button type="submit" style={{
              padding: "14px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "16px",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(16, 185, 129, 0.25)"
            }}>
              {lang === "ar" ? "دخول واستكشاف المنيو 🚀" : "Enter Menu 🚀"}
            </button>
          </form>
          <button 
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ backgroundColor: "transparent", border: "none", color: "#34d399", marginTop: "20px", cursor: "pointer", fontWeight: "600" }}
          >
            {lang === "ar" ? "English 🌐" : "العربية 🌐"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="main-app-container"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        backgroundColor: "#070a13",
        color: "#f3f4f6",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        fontFamily: lang === "ar" ? "'Tajawal', sans-serif" : "'Urbanist', sans-serif",
        transition: "all 0.3s ease",
        position: "relative",
        width: "100%", 
        overflowX: "hidden", 
        boxSizing: "border-box"
      }}
    >
      {/* الـ Toast Notification المدمج والمنبثق */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          backgroundColor: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          fontWeight: "700",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backdropFilter: "blur(8px)",
          border: toast.type === "success" ? "1px solid #34d399" : "1px solid #f87171"
        }}>
          {toast.message}
        </div>
      )}

      <Sidebar
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.length}
        setIsCartOpen={setIsCartOpen}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main
        className="main-content-area main-content"
        style={{
          flexGrow: 1,
          padding: isMobile ? "16px 16px 100px 16px" : "40px",
          overflowY: "auto",
          overflowX: "hidden", 
          minHeight: isMobile ? "calc(100vh - 70px)" : "100vh",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {activeTab === "menu" && (
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <header style={{ marginBottom: "30px", width: "100%" }}>
              <h1
                style={{
                  fontSize: isMobile ? "24px" : "36px",
                  fontWeight: "700",
                  color: "#ffffff",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                  textShadow: "0 10px 30px rgba(16, 185, 129, 0.18)",
                }}
              >
                {lang === "ar"
                  ? "استكشف نكهاتنا الملكية 🍽️"
                  : "Explore Our Flavors 🍽️"}
              </h1>
              <div style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "6px 14px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "bold",
                color: "#34d399"
              }}>
                {lang === "ar" ? `📍 طاولة رقم: ${getTableNumber()}` : `📍 Table: ${getTableNumber()}`}
              </div>
            </header>

            {/* سكرول التصنيفات الأفقي */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                overflowX: "auto",
                paddingBottom: "10px",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                maxWidth: "100%",
                boxSizing: "border-box"
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "12px 22px",
                    borderRadius: "999px",
                    border:
                      activeCategory === cat.id
                        ? "1px solid rgba(16, 185, 129, 0.8)"
                        : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor:
                      activeCategory === cat.id
                        ? "rgba(16, 185, 129, 0.16)"
                        : "rgba(255,255,255,0.04)",
                    color: activeCategory === cat.id ? "#d1fae5" : "#cbd5e1",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    transition: "all 0.25s ease",
                    boxShadow:
                      activeCategory === cat.id
                        ? "0 0 25px rgba(16, 185, 129, 0.22)"
                        : "none",
                    textShadow:
                      activeCategory === cat.id
                        ? "0 0 4px rgba(16, 185, 129, 0.35)"
                        : "none",
                  }}
                >
                  {cat.label[lang]}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    vegetarianOnly: !filters.vegetarianOnly,
                  })
                }
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: filters.vegetarianOnly
                    ? "1px solid rgba(16, 185, 129, 0.75)"
                    : "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: filters.vegetarianOnly
                    ? "rgba(16, 185, 129, 0.18)"
                    : "rgba(255,255,255,0.04)",
                  color: filters.vegetarianOnly ? "#d1fae5" : "#cbd5e1",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  transition: "all 0.25s ease",
                  boxShadow: filters.vegetarianOnly
                    ? "0 8px 24px rgba(16, 185, 129, 0.12)"
                    : "none",
                }}
              >
                🌱 {lang === "ar" ? "نباتي" : "Vegetarian"}
              </button>
              <button
                onClick={() =>
                  setFilters({ ...filters, spicyOnly: !filters.spicyOnly })
                }
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: filters.spicyOnly
                    ? "1px solid rgba(239, 68, 68, 0.75)"
                    : "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: filters.spicyOnly
                    ? "rgba(239, 68, 68, 0.18)"
                    : "rgba(255,255,255,0.04)",
                  color: filters.spicyOnly ? "#fecaca" : "#cbd5e1",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  transition: "all 0.25s ease",
                  boxShadow: filters.spicyOnly
                    ? "0 8px 24px rgba(239, 68, 68, 0.12)"
                    : "none",
                }}
              >
                🌶️ {lang === "ar" ? "حار" : "Spicy"}
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                جاري تحميل نكهاتنا الفاخرة من قاعدة البيانات... 🕒
              </p>
            ) : filteredMenu.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                لا توجد وجبات في هذا التصنيف حالياً.
              </p>
            ) : (
              <div
                className="grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : isTablet
                      ? "1fr 1fr"
                      : "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "25px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                {filteredMenu.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    lang={lang}
                    addToCart={addToCart}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div
            style={{
              maxWidth: "800px",
              display: "flex",
              flexDirection: "column",
              gap: "25px",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <h1 style={{ fontSize: "32px", fontWeight: "700" }}>
              {lang === "ar" ? "حكايتنا الفاخرة ✨" : "Our Luxury Story ✨"}
            </h1>
            <section
              style={{
                backgroundColor: "rgba(15, 22, 38, 0.7)",
                backdropFilter: "blur(12px)",
                padding: "25px",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                lineHeight: "1.7",
                color: "#cbd5e1",
              }}
            >
              <p style={{ margin: 0 }}>
                {lang === "ar"
                  ? "تأسس مطعم 'الفيو' لتقديم نكهات برجر غنية تُطهى بعناية تامة على اللهب المباشر مع أجواء بحرية ساحرة وراقية."
                  : "View merged fire-grilled burger classics with serene waterfront energy."}
              </p>
            </section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "20px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(15, 22, 38, 0.7)",
                  backdropFilter: "blur(12px)",
                  padding: "20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <h3 style={{ color: "#10b981", marginTop: 0 }}>
                  🕒 {lang === "ar" ? "أوقات العمل" : "Hours"}
                </h3>
                <p style={{ margin: 0, color: "#94a3b8" }}>
                  12:00 PM - 1:00 AM
                </p>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(15, 22, 38, 0.7)",
                  backdropFilter: "blur(12px)",
                  padding: "20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <h3 style={{ color: "#10b981", marginTop: 0 }}>
                  📍 {lang === "ar" ? "موقعنا" : "Location"}
                </h3>
                <p style={{ margin: 0, color: "#94a3b8" }}>
                  {lang === "ar"
                    ? "جادة الكورنيش، الرصيف الملكي"
                    : "Corniche Blvd, Royal Pier"}
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(15, 22, 38, 0.7)",
                backdropFilter: "blur(12px)",
                padding: "30px",
                borderRadius: "28px",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                marginTop: "15px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  marginTop: 0,
                  color: "#ffffff",
                }}
              >
                {lang === "ar"
                  ? "يسعدنا سماع رأيك و شكاويك 📣"
                  : "We Value Your Feedback & Complaints 📣"}
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  marginTop: "-5px",
                  marginBottom: "20px",
                }}
              >
                {lang === "ar"
                  ? "رأيك يساعدنا على تقديم تجربة ملكية تليق بك."
                  : "Your feedback helps us provide a royal dining experience."}
              </p>

              <form
                onSubmit={sendFeedbackToBackend}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      fontSize: "15px",
                      color: "#cbd5e1",
                    }}
                  >
                    {lang === "ar"
                      ? "تقييمك للمطبخ والخدمة:"
                      : "Rate our food & service:"}
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        style={{
                          fontSize: "30px",
                          cursor: "pointer",
                          transition: "transform 0.15s ease",
                          transform:
                            (hoveredRating || rating) >= star
                              ? "scale(1.2)"
                              : "scale(1)",
                          color:
                            (hoveredRating || rating) >= star
                              ? "#fbbf24"
                              : "#334155",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      fontSize: "15px",
                      color: "#cbd5e1",
                    }}
                  >
                    {lang === "ar"
                      ? "اكتب تعليقك أو شكواك هنا:"
                      : "Write your comment or complaint:"}
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "أخبرنا بملاحظاتك بكل صراحة..."
                        : "Tell us your honest feedback..."
                    }
                    required
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "16px",
                      backgroundColor: "rgba(7, 10, 19, 0.6)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#ffffff",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      outline: "none",
                      resize: "none",
                      transition: "all 0.25s ease",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) =>
                      (e.target.style.border = "1px solid #10b981")
                    }
                    onBlur={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(255,255,255,0.08)")
                    }
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    alignSelf: lang === "ar" ? "flex-start" : "flex-end",
                    padding: "12px 28px",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "15px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.target.style.opacity = "1")}
                >
                  {lang === "ar" ? "إرسال الملاحظات 🚀" : "Submit Feedback 🚀"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <CartSlider
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        lang={lang}
        cart={cart}
        decreaseQuantity={decreaseQuantity}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        sendOrderToWhatsApp={sendOrderToBackend} 
        isMobile={isMobile}
      />
    </div>
  );
}

export default App;