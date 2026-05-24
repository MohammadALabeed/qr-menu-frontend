import { useState, useEffect } from "react";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(API_URL);

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

  // دالة تشغيل الصوت للتنبيهات
  const playNotificationSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch(() => console.log("تنبيه: يحتاج تفاعل للتشغيل"));
  };

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
      if (data.success) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
        // تفريغ الحقول
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

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
  };

  // دالة جلب المنيو الخارجية (لإعادة الاستخدام عند الإضافة أو الحذف أو التعديل)
  const fetchMenuData = () => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/menu`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) return handleLogout();
        return res.json();
      })
      .then((data) => setMenu(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching menu:", err));
  };

  // 1. تأثير جلب البيانات الأساسية عند تحديث التوكن
  useEffect(() => {
    if (!token) return;

    // جلب الطلبات
    fetch(`${API_URL}/api/admin/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) return handleLogout();
        return res.json();
      })
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching orders:", err));

    // جلب التقييمات والتعليقات
    fetch(`${API_URL}/api/admin/feedback`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) return handleLogout();
        return res.json();
      })
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching feedback:", err));

    // جلب متوسط تقييم النجوم
    fetch(`${API_URL}/api/admin/analytics/rating`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAvgRating(data.averageRating);
      })
      .catch((err) => console.error("Error fetching ratings:", err));

    // جلب بيانات المنيو
    fetch(`${API_URL}/api/admin/menu`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) return handleLogout();
        return res.json();
      })
      .then((data) => setMenu(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching menu:", err));

  }, [token]);

  // 2. تأثير الـ Socket المستقر (يشتغل مرة واحدة فقط مع الـ Clean up)
  useEffect(() => {
    socket.on("new_order_received", (newOrder) => {
      playNotificationSound();
      setOrders((prev) => [newOrder, ...prev]);
    });

    socket.on("order_status_updated", ({ id, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status } : o))
      );
    });

    socket.on("order_archived", ({ id }) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    });

    return () => {
      socket.off("new_order_received");
      socket.off("order_status_updated");
      socket.off("order_archived");
    };
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus }),
    }).catch((err) => console.error("Error:", err));
  };

  const handleArchiveOrder = (orderId) => {
    fetch(`${API_URL}/api/admin/orders/${orderId}/archive`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    })
    .catch((err) => console.error("Error archiving order:", err));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("الرجاء ملء اسم الوجبة وسعرها ⚠️");

    fetch(`${API_URL}/api/admin/menu`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newItem)
    })
    .then((res) => res.json())
    .then(() => {
      fetchMenuData();
      setNewItem({ name: "", price: "", category: "مأكولات", image_url: "" });
    })
    .catch((err) => console.error("Error:", err));
  };

  const handleToggleAvailable = (id, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    fetch(`${API_URL}/api/admin/menu/${id}/toggle`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ is_available: nextStatus })
    })
    .then(() => fetchMenuData())
    .catch((err) => console.error("Error:", err));
  };

  const deleteItem = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الوجبة نهائياً؟ 🚨")) {
      fetch(`${API_URL}/api/admin/menu/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(() => fetchMenuData())
      .catch((err) => console.error("Error:", err));
    }
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => setActiveSubTab("live-orders")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "live-orders" ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "live-orders" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "live-orders" ? "#34d399" : "#cbd5e1" }}>
            🔥 الطلبات ({orders.filter(o => o.status !== "completed").length})
          </button>
          <button onClick={() => setActiveSubTab("menu-manage")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "menu-manage" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "menu-manage" ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "menu-manage" ? "#60a5fa" : "#cbd5e1" }}>
            🍽️ إدارة المنيو ({menu.length})
          </button>
          <button onClick={() => setActiveSubTab("feedback-log")} style={{ padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: activeSubTab === "feedback-log" ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.08)", backgroundColor: activeSubTab === "feedback-log" ? "rgba(251, 191, 36, 0.15)" : "rgba(255,255,255,0.04)", color: activeSubTab === "feedback-log" ? "#fbbf24" : "#cbd5e1" }}>
            📣 التقييمات ({feedbacks.length})
          </button>
          
          {/* زر تسجيل الخروج */}
          <button onClick={handleLogout} style={{ padding: "10px 15px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: "1px solid rgba(239, 68, 68, 0.4)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171" }}>
            🚪 خروج
          </button>
        </div>
      </header>

      {/* 1. تبويب الطلبات الحية */}
      {activeSubTab === "live-orders" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {orders.map((order) => (
            <div key={order.id} className={order.status === "pending" ? "new-order-card" : ""} style={{ backgroundColor: "rgba(15, 22, 38, 0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "20px", transition: "all 0.3s ease" }}>
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
              {menu.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "15px" }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: "55px", height: "55px", borderRadius: "10px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: "13px" }}>بدون صورة</span>
                    )}
                  </td>
                  <td style={{ fontWeight: "bold" }}>{item.name}</td>
                  <td><span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", fontSize: "14px" }}>{item.category}</span></td>
                  <td style={{ color: "#34d399", fontWeight: "bold" }}>{item.price} $</td>
                  <td>
                    <button onClick={() => handleToggleAvailable(item.id, item.is_available)} style={{ padding: "6px 14px", borderRadius: "8px", cursor: "pointer", border: "none", fontWeight: "bold", backgroundColor: item.is_available === 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: item.is_available === 1 ? "#34d399" : "#f87171" }}>
                      {item.is_available === 1 ? "🟢 متوفر" : "🔴 غير متوفر"}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. تبويب التقييمات */}
      {activeSubTab === "feedback-log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="stars-analytics-card" style={{ backgroundColor: "rgba(15, 22, 38, 0.9)", color: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffc107" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>🌟 متوسط تقييم المطعم العام</h3>
            <p style={{ fontSize: "28px", fontWeight: "bold", color: "#ffc107", margin: 0 }}>{avgRating} / 5</p>
          </div>
          {feedbacks.map(fb => (
            <div key={fb.id} style={{ padding: "15px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                طاولة {fb.table_number}: {fb.comment} {fb.rating && `(التقييم: ${fb.rating} ⭐)`}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Dashboard;