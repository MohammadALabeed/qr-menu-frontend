function CartSlider({
  isCartOpen,
  setIsCartOpen,
  lang,
  cart = [], // قيمة افتراضية مصفوفة لمنع الانهيار
  decreaseQuantity,
  addToCart, // الدالة الممررة
  removeFromCart,
  cartTotal,
  sendOrderToBackend, 
  isMobile,
}) {
  // إذا كانت السلة مغلقة، لا تعرض شيئاً
  if (!isCartOpen) return null;

  // دالة وسيطة لضمان إرسال الطلب ثم إغلاق السلة بأمان وبدون أخطاء
  const handleCheckout = async () => {
    if (typeof sendOrderToBackend === 'function') {
      const isSuccess = await sendOrderToBackend();
      if (isSuccess) {
        setIsCartOpen(false); 
      }
    } else {
      console.error("🚨 دالة sendOrderToBackend غير ممررة بشكل صحيح للسلة!");
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulseCartButton { 
          0%, 100% { transform: translateY(0); box-shadow: 0 18px 40px rgba(16,185,129,0.24); } 
          50% { transform: translateY(-1px); box-shadow: 0 22px 48px rgba(16,185,129,0.32); } 
        }
        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
      
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: isMobile ? 0 : (lang === "en" ? "auto" : 0),
          right: isMobile ? 0 : (lang === "ar" ? "auto" : 0),
          width: isMobile ? "100%" : "400px",
          background: "rgba(12, 18, 35, 0.95)", 
          backdropFilter: "blur(20px)",
          borderLeft: lang === "en" ? "1px solid rgba(255,255,255,0.08)" : "none",
          borderRight: lang === "ar" ? "1px solid rgba(255,255,255,0.08)" : "none",
          boxShadow: "0 32px 90px rgba(0,0,0,0.45)",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 9999, 
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* هيدر السلة */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              🛒 {lang === "ar" ? "سلة طلباتك" : "Your Cart"}
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* قائمة عناصر السلة */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              overflowY: "auto",
              flexGrow: 1,
              maxHeight: cart.length === 0 ? "none" : "65vh",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  height: "60vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "64px", animation: "pulseIcon 2.5s infinite ease-in-out" }}>🛍️</div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                  {lang === "ar" ? "سلتك فارغة حالياً" : "Your cart is empty"}
                </h3>
                <p style={{ color: "#64748b", margin: 0, fontSize: "14px", maxWidth: "260px", lineHeight: "1.5" }}>
                  {lang === "ar"
                    ? "قم بإضافة أطباقك المفضلة من المنيو لتظهر هنا"
                    : "Add your favorite delicious dishes from the menu to get started"}
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    background: "rgba(15, 22, 38, 0.92)",
                    padding: "16px",
                    borderRadius: "22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name && item.name[lang] ? item.name[lang] : ""}
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "14px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "15px",
                        color: "#f8fafc",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.name && item.name[lang] ? item.name[lang] : ""}
                    </h4>
                    <span style={{ fontSize: "13px", color: "#a7f3d0", fontWeight: "700" }}>
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>

                  {/* أزرار التحكم بالكمية المحمية */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "rgba(255,255,255,0.04)",
                      padding: "6px 10px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <button
                      onClick={() => typeof decreaseQuantity === 'function' && decreaseQuantity(item.id)}
                      style={{
                        width: "28px", height: "28px", display: "grid", placeItems: "center",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px", color: "#f8fafc", cursor: "pointer", fontSize: "16px", fontWeight: "700"
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", minWidth: "22px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      // حماية الزر: إذا كانت دالة addToCart غير موجودة، نمنع الانهيار تماماً ولا نطلب دالة مجهولة
                      onClick={() => typeof addToCart === 'function' ? addToCart(item) : console.warn("addToCart missing")}
                      style={{
                        width: "28px", height: "28px", display: "grid", placeItems: "center",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px", color: "#f8fafc", cursor: "pointer", fontSize: "16px", fontWeight: "700"
                      }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => typeof removeFromCart === 'function' && removeFromCart(item.id)}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "18px" }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* منطقة حساب المجموع والزر */}
        {cart.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", fontSize: "17px", fontWeight: "700", color: "#e2e8f0" }}>
              <span>{lang === "ar" ? "المجموع:" : "Total:"}</span>
              <span style={{ color: "#a7f3d0" }}>${cartTotal}</span>
            </div>
            <button
              onClick={handleCheckout}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, rgba(16,185,129,1), rgba(72,187,120,0.92), rgba(20, 122, 77, 0.95))",
                color: "#ffffff",
                border: "none",
                borderRadius: "18px",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "15px",
                letterSpacing: "0.04em",
                boxShadow: "0 18px 40px rgba(16,185,129,0.22)",
                animation: "pulseCartButton 2.8s ease-in-out infinite",
              }}
            >
              👨‍🍳 {lang === "ar" ? "إرسال الطلب الفوري للمطبخ" : "Send Order to Kitchen"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartSlider;