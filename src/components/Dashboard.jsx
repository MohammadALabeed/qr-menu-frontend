import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard() {
  // --- حالات نظام تسجيل الدخول ---
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- حالات لوحة التحكم الأصلية ---
  const [activeSubTab, setActiveSubTab] = useState("live-orders");
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "مأكولات", image_url: "" });
  const [avgRating, setAvgRating] = useState("0");

  // --- حالة تعديل وجبة معينة (الزر المضاف حديثاً) ---
  const [editingItem, setEditingItem] = useState(null);

  // --- حالات إعدادات المتجر العامة الجديدة ---
  const [settings, setSettings] = useState({
    restaurant_name: "",
    about_text: "",
    logo_url: "",
    facebook_url: "",
    instagram_url: "",
    working_hours: ""
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ text: "", type: "" });

  // مرجع لحفظ كائن الـ socket الحالي لمنع التكرار
  const socketRef = useRef(null);

  // دالة تشغيل الصوت للتنبيهات
  const playNotificationSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch(() => console.log("تنبيه: يحتاج تفاعل من المستخدم أولاً لتشغيل الصوت"));
  };

  // تسجيل الخروج
  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken("");
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // دالة موحدة ومختصرة للقيام بطلبات الـ HTTP المحمية بالتوكن
  const authenticatedFetch = useCallback((endpoint, options = {}) => {
    if (!token) return Promise.reject("No token available");

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers
    };

    return fetch(`${API_URL}${endpoint}`, { ...options, headers })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          throw new Error("Unauthorized access - logged out");
        }
        return res.json();
      });
  }, [token, handleLogout]);

  // معالج تسجيل الدخول
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.message || "بيانات الدخول غير صحيحة ❌");
      }
    })
    .catch((err) => {
      console.error("Login error:", err);
      setLoginError("حدث خطأ أثناء الاتصال بالسيرفر 🖥️");
    });
  };

  // معالج جلب المنيو
  const triggerMenuFetch = useCallback(() => {
    authenticatedFetch("/api/admin/menu")
      .then((data) => setMenu(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching menu:", err));
  }, [authenticatedFetch]);

  // 1. تأثير جلب البيانات الأساسية عند تحديث التوكن
  useEffect(() => {
    if (!token) return;

    // جلب الإعدادات العامة
    authenticatedFetch("/api/admin/settings")
      .then((data) => {
        if (data) {
          setSettings({
            restaurant_name: data.restaurant_name || "",
            about_text: data.about_text || "",
            logo_url: data.logo_url || "",
            facebook_url: data.facebook_url || "",
            instagram_url: data.instagram_url || "",
            working_hours: data.working_hours || ""
          });
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));

    // جلب الطلبات
    authenticatedFetch("/api/admin/orders")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching orders:", err));

    // جلب التقييمات
    authenticatedFetch("/api/admin/feedback")
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching feedback:", err));

    // جلب متوسط التقييم
    authenticatedFetch("/api/admin/analytics/rating")
      .then((data) => {
        if (data && data.success) setAvgRating(data.averageRating);
      })
      .catch((err) => console.error("Error fetching ratings:", err));

    triggerMenuFetch();
  }, [token, triggerMenuFetch, authenticatedFetch]);

  // 2. تأثير الـ Socket المؤمن والمربوط بالتوكن وحالة تسجيل الدخول
  useEffect(() => {
    if (!token) return;

    socketRef.current = io(API_URL, {
      auth: { token: token }
    });

    const socketInstance = socketRef.current;

    socketInstance.on("new_order_received", (newOrder) => {
      playNotificationSound();
      setOrders((prev) => [newOrder, ...prev]);
    });

    socketInstance.on("order_status_updated", ({ id, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status } : o))
      );
    });

    socketInstance.on("order_archived", ({ id }) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    });

    return () => {
      socketInstance.off("new_order_received");
      socketInstance.off("order_status_updated");
      socketInstance.off("order_archived");
      socketInstance.disconnect();
    };
  }, [token]);

  const updateOrderStatus = (orderId, newStatus) => {
    authenticatedFetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    })
    .catch((err) => console.error("Error updating order status:", err));
  };

  const handleArchiveOrder = (orderId) => {
    authenticatedFetch(`/api/admin/orders/${orderId}/archive`, {
      method: "PUT"
    })
    .then((data) => {
      if (data && data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    })
    .catch((err) => console.error("Error archiving order:", err));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("الرجاء ملء اسم الوجبة وسعرها ⚠️");

    authenticatedFetch("/api/admin/menu", {
      method: "POST",
      body: JSON.stringify(newItem)
    })
    .then(() => {
      triggerMenuFetch();
      setNewItem({ name: "", price: "", category: "مأكولات", image_url: "" });
    })
    .catch((err) => console.error("Error adding item:", err));
  };

  // دالة إرسال التحديث الفعلي للوجبة المعدلة (تحديث السعر أو الصورة أو الاسم)
  const handleUpdateItem = (e) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price) return alert("الرجاء ملء اسم الوجبة وسعرها ⚠️");

    // نرسل التعديل للباك إند عبر مسار الـ ID الخاص بالوجبة
    authenticatedFetch(`/api/admin/menu/${editingItem.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editingItem.name,
        price: editingItem.price,
        category: editingItem.category,
        image_url: editingItem.image_url
      })
    })
    .then(() => {
      triggerMenuFetch();
      setEditingItem(null); // إغلاق واجهة التعديل المنبثقة بنجاح
    })
    .catch((err) => console.error("Error updating menu item:", err));
  };

  const handleToggleAvailable = (id, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    authenticatedFetch(`/api/admin/menu/${id}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ is_available: nextStatus })
    })
    .then(() => triggerMenuFetch())
    .catch((err) => console.error("Error toggling availability:", err));
  };

  const deleteItem = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الوجبة نهائياً؟ 🚨")) {
      authenticatedFetch(`/api/admin/menu/${id}`, { 
        method: "DELETE"
      })
      .then(() => triggerMenuFetch())
      .catch((err) => console.error("Error deleting item:", err));
    }
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMessage({ text: "", type: "" });

    authenticatedFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    })
    .then((data) => {
      setSettingsLoading(false);
      if (data && data.success) {
        setSettingsMessage({ text: "🟢 تم تحديث الإعدادات العامة بنجاح واقتدار!", type: "success" });
      } else {
        setSettingsMessage({ text: "❌ فشل تحديث الإعدادات!", type: "error" });
      }
    })
    .catch((err) => {
      console.error("Error updating settings:", err);
      setSettingsLoading(false);
      setSettingsMessage({ text: "❌ حدث خطأ أثناء الاتصال بالسيرفر!", type: "error" });
    });
  };

  // دالة مساعدة لعرض التصنيف بشكل سليم حتى لو كان هناك تشوه في ترميز الـ DB لعربيتك
  const formatCategory = (cat) => {
    if (!cat || cat.includes("??")) return "وجبات رئيسية";
    return cat;
  };

  // --- 1. عرض واجهة تسجيل الدخول إذا لم يتوفر التوكن ---
  if (!token) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", backgroundColor: "#070a13", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Tajawal, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: "rgba(15, 22, 38, 0.9)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "40px", borderRadius: "24px", maxWidth: "400px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "10px", marginTop: 0 }}>لوحة تحكم الإدارة 👑</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px", textAlign: "center" }}>برجاء إدخال بيانات الأدمن للمتابعة</p>
          
          {loginError && <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "10px", borderRadius: "10px", marginBottom: "15px", fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>{loginError}</div>}
          
          <input type="text" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: "100%", padding: "14px", borderRadius: "12px", backgroundColor: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", marginBottom: "15px", boxSizing: "border-box" }} />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "14px", borderRadius: "12px", backgroundColor: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", marginBottom: "25px", boxSizing: "border-box" }} />
          
          <button type="submit" style={{ width: "100%", padding: "14px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)" }}>دخول لوحة التحكم 🚀</button>
        </form>
      </div>
    );
  }

  // --- 2. عرض لوحة التحكم الكاملة إذا كان التوكن موجوداً ---
  return (
    <div dir="rtl" style={{ minHeight: "100vh", backgroundColor: "#070a13", color: "#f3f4f6", padding: "30px", fontFamily: "Tajawal, sans-serif" }}>
      
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#ffffff", margin: 0 }}>شاشة المطبخ والإدارة 👑</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setActiveSubTab("live-orders")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "live-orders" ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "live-orders" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "live-orders" ? "#34d399" : "#cbd5e1" }}>
            🔥 الطلبات ({Array.isArray(orders) ? orders.filter(o => o.status !== "completed").length : 0})
          </button>
          <button onClick={() => setActiveSubTab("menu-manage")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "menu-manage" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "menu-manage" ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "menu-manage" ? "#60a5fa" : "#cbd5e1" }}>
            🍽️ إدارة المنيو ({Array.isArray(menu) ? menu.length : 0})
          </button>
          <button onClick={() => setActiveSubTab("feedback-log")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "feedback-log" ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "feedback-log" ? "rgba(251, 191, 36, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "feedback-log" ? "#fbbf24" : "#cbd5e1" }}>
            📣 التقييمات ({Array.isArray(feedbacks) ? feedbacks.length : 0})
          </button>
          <button onClick={() => setActiveSubTab("general-settings")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "general-settings" ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "general-settings" ? "rgba(168, 85, 247, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "general-settings" ? "#c084fc" : "#cbd5e1" }}>
            ⚙️ الإعدادات العامة
          </button>
          
          <button onClick={handleLogout} style={{ padding: "10px 15px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: "1px solid rgba(239, 68, 68, 0.4)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171" }}>
            🚪 خروج
          </button>
        </div>
      </header>

      {/* 1. تبويب الطلبات الحية */}
      {activeSubTab === "live-orders" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {Array.isArray(orders) && orders.map((order) => (
            <div key={order.id} style={{ backgroundColor: "rgba(15, 22, 38, 0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "20px", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <span>طاولة: {order.table_number}</span>
                <span style={{ color: order.status === "pending" ? "#f87171" : "#34d399" }}>
                   {order.status === "pending" ? "⏳ معلق" : "✅ مكتمل"}
                </span>
              </div>
              <ul style={{ paddingRight: "15px" }}>
                {Array.isArray(order.items) && order.items.map((item, index) => (
                  <li key={index}>{item.item_name} x{item.quantity}</li>
                ))}
              </ul>
              {order.status === "pending" && (
                <button onClick={() => updateOrderStatus(order.id, "completed")} style={{ width: "100%", padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "10px", cursor: "pointer", border: "none", fontWeight: "bold" }}>
                  👨‍🍳 تم التجهيز
                </button>
              )}
              {order.status === "completed" && (
                <button onClick={() => handleArchiveOrder(order.id)} style={{ width: "100%", padding: "10px", backgroundColor: "#4b5563", color: "#fff", borderRadius: "10px", cursor: "pointer", border: "none", fontWeight: "bold", marginTop: "10px" }}>
                  📦 نقل إلى الأرشيف
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. تبويب إدارة المنيو */}
      {activeSubTab === "menu-manage" && (
        <div>
          <form onSubmit={handleAddItem} style={{ backgroundColor: "rgba(15, 22, 38, 0.7)", border: "1px solid rgba(255,255,255,0.06)", padding: "25px", borderRadius: "20px", marginBottom: "30px" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#fff" }}>✨ إضافة وجبة جديدة للمنيو</h3>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
              <input value={newItem.name} placeholder="اسم الوجبة" style={{ padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <input value={newItem.price} placeholder="السعر ($)" style={{ padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: "100px" }} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              <input value={newItem.image_url} placeholder="رابط صورة الوجبة" style={{ padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", flex: 1, minWidth: "200px" }} onChange={e => setNewItem({...newItem, image_url: e.target.value})} />
              <select value={newItem.category} style={{ padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="مأكولات">وجبات رئيسية</option>
                <option value="مقبلات">مقبلات</option>
                <option value="مشروبات">مشروبات</option>
              </select>
              <button type="submit" style={{ padding: "12px 25px", backgroundColor: "#10b981", color: "#fff", border: "none", cursor: "pointer", borderRadius: "8px", fontWeight: "bold" }}>إضافة الوجبة</button>
            </div>
          </form>

          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "rgba(15, 22, 38, 0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>
                <th style={{ padding: "15px" }}>الصورة</th>
                <th>اسم الوجبة</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>الحالة (التوفر)</th>
                <th>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(menu) && menu.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "15px" }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: "55px", height: "55px", borderRadius: "10px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: "13px" }}>بدون صورة</span>
                    )}
                  </td>
                  <td style={{ fontWeight: "bold" }}>{item.name}</td>
                  <td><span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", fontSize: "14px" }}>{formatCategory(item.category)}</span></td>
                  <td style={{ color: "#34d399", fontWeight: "bold" }}>{item.price} $</td>
                  <td>
                    <button onClick={() => handleToggleAvailable(item.id, item.is_available)} style={{ padding: "6px 14px", borderRadius: "8px", cursor: "pointer", border: "none", fontWeight: "bold", backgroundColor: item.is_available === 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: item.is_available === 1 ? "#34d399" : "#f87171" }}>
                      {item.is_available === 1 ? "🟢 متوفر" : "🔴 غير متوفر"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {/* زر التعديل المضاف حديثاً بستايل متناسق مع الواجهة */}
                      <button onClick={() => setEditingItem(item)} style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>تعديل</button>
                      <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- الواجهة المنبثقة (Modal) الخاصة بتعديل الوجبة --- */}
      {editingItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <form onSubmit={handleUpdateItem} style={{ backgroundColor: "rgba(15, 22, 38, 0.95)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "30px", borderRadius: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.6)", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#fff", textAlign: "center" }}>🛠️ تعديل بيانات الوجبة</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>اسم الوجبة:</label>
                <input type="text" value={editingItem.name} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", boxSizing: "border-box" }} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>السعر ($):</label>
                <input type="number" step="0.01" value={editingItem.price} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", boxSizing: "border-box" }} onChange={e => setEditingItem({...editingItem, price: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>رابط صورة الوجبة:</label>
                <input type="text" value={editingItem.image_url || ""} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", boxSizing: "border-box" }} onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>التصنيف:</label>
                <select value={editingItem.category} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", boxSizing: "border-box" }} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                  <option value="مأكولات">وجبات رئيسية</option>
                  <option value="مقبلات">مقبلات</option>
                  <option value="مشروبات">مشروبات</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>حفظ التعديلات</button>
                <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: "12px", backgroundColor: "#4b5563", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>إلغاء</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. تبويب التقييمات */}
      {activeSubTab === "feedback-log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="stars-analytics-card" style={{ backgroundColor: "rgba(15, 22, 38, 0.9)", color: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffc107" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>🌟 متوسط تقييم المطعم العام</h3>
            <p style={{ fontSize: "28px", fontWeight: "bold", color: "#ffc107", margin: 0 }}>{avgRating} / 5</p>
          </div>
          {Array.isArray(feedbacks) && feedbacks.map(fb => (
            <div key={fb.id} style={{ padding: "15px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                طاولة {fb.table_number}: {fb.comment} {fb.rating && `(التقييم: ${fb.rating} ⭐)`}
            </div>
          ))}
        </div>
      )}

      {/* 4. تبويب الشاشة الجديدة للإعدادات العامة */}
      {activeSubTab === "general-settings" && (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <form onSubmit={handleUpdateSettings} style={{ backgroundColor: "rgba(15, 22, 38, 0.8)", border: "1px solid rgba(168, 85, 247, 0.2)", padding: "30px", borderRadius: "24px", boxShadow: "0 15px 30px rgba(0,0,0,0.4)" }}>
            <h3 style={{ margin: "0 0 25px 0", color: "#fff", fontSize: "22px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>⚙️ إعدادات المتجر والمطعم العامة</h3>
            
            {settingsMessage.text && (
              <div style={{ backgroundColor: settingsMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: settingsMessage.type === "success" ? "#34d399" : "#f87171", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "15px", fontWeight: "bold", textAlign: "center" }}>
                {settingsMessage.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>اسم المطعم:</label>
                <input type="text" value={settings.restaurant_name} onChange={(e) => setSettings({...settings, restaurant_name: e.target.value})} required style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>نص صفحة من نحن (وصف المطعم):</label>
                <textarea rows="4" value={settings.about_text} onChange={(e) => setSettings({...settings, about_text: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box", resize: "vertical" }}></textarea>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>رابط اللوجو / صورة المطعم الأساسية:</label>
                <input type="text" value={settings.logo_url} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} placeholder="https://example.com/logo.png" style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>رابط فيسبوك:</label>
                  <input type="text" value={settings.facebook_url} onChange={(e) => setSettings({...settings, facebook_url: e.target.value})} placeholder="https://facebook.com/..." style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>رابط إنستغرام:</label>
                  <input type="text" value={settings.instagram_url} onChange={(e) => setSettings({...settings, instagram_url: e.target.value})} placeholder="https://instagram.com/..." style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#cbd5e1" }}>ساعات العمل:</label>
                <input type="text" value={settings.working_hours} onChange={(e) => setSettings({...settings, working_hours: e.target.value})} placeholder="مثال: 12:00 PM - 12:00 AM" style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "#070a13", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", boxSizing: "border-box" }} />
              </div>

              <button type="submit" disabled={settingsLoading} style={{ width: "100%", padding: "14px", backgroundColor: "#a855f7", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px", boxShadow: "0 10px 20px rgba(168, 85, 247, 0.2)", transition: "all 0.2s" }}>
                {settingsLoading ? "⏳ جاري حفظ التعديلات..." : "💾 حفظ كافة التعديلات والإعدادات"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default Dashboard;