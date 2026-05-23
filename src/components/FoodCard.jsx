import { useState } from "react";

function FoodCard({ item, lang, addToCart, isMobile }) {
  // حالة لمعرفة ما إذا كان مؤشر الماوس فوق الكرت لإظهار تأثير التوهج النيوني الفاخر
  const [isHovered, setIsHovered] = useState(false);

  // 🛠️ تحسين استخراج النصوص ليكون مرناً (يدعم لو كان الحقل Object لغات أو String مباشر)
  const title = typeof item.name === "object" 
    ? (item.name?.[lang] || item.name?.["ar"] || "") 
    : (item.name || "");

  // 🛠️ تحسين معالجة المكونات لضمان عدم حدوث خطأ لو كانت نصاً مباشراً أو مصفوفة داخل كائن
  let ingredientsList = "";
  if (item.ingredients) {
    if (typeof item.ingredients === "object" && !Array.isArray(item.ingredients)) {
      ingredientsList = item.ingredients[lang] ? item.ingredients[lang].join(" • ") : "";
    } else if (Array.isArray(item.ingredients)) {
      ingredientsList = item.ingredients.join(" • ");
    } else {
      ingredientsList = item.ingredients; // إذا كانت نصاً مباشراً قادماً من الباكيند
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "rgba(12, 18, 35, 0.82)",
        backdropFilter: "blur(18px)",
        borderRadius: "28px",
        overflow: "hidden",
        border: isHovered
          ? "1px solid rgba(16, 185, 129, 0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isHovered
          ? "0 24px 80px rgba(16, 185, 129, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.08)"
          : "0 18px 45px rgba(0, 0, 0, 0.25)",
        transform: isHovered
          ? "translateY(-8px) scale(1.01)"
          : "translateY(0) scale(1)",
        transition:
          "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border 0.35s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%", /* يضمن ثبات طول الكروت بجانب بعضها */
      }}
    >
      {/* منطقة الصورة والسعرات */}
      <div style={{ position: "relative", overflow: "hidden", height: isMobile ? "180px" : "200px", background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt="" /* ترك الـ alt فارغ هنا يمنع تكرار اسم الوجبة إذا لم تتحمل الصورة */
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.5s ease, filter 0.5s ease",
              filter: isHovered
                ? "brightness(1.05) contrast(1.02)"
                : "brightness(0.96) contrast(1)",
            }}
            onError={(e) => {
              e.target.style.display = 'none'; // إخفاء الأيقونة المكسورة تماماً والاعتماد على الخلفية المتدرجة
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: "14px",
            [lang === "ar" ? "right" : "left"]: "14px",
            background: "rgba(10, 20, 34, 0.9)",
            backdropFilter: "blur(10px)",
            padding: "8px 16px",
            borderRadius: "999px",
            fontSize: "12px",
            letterSpacing: "0.02em",
            color: "#a7f3d0",
            fontWeight: "800",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            boxShadow: "0 0 24px rgba(16, 185, 129, 0.15)",
            zIndex: 10,
          }}
        >
          🔥 {item.calories} {lang === "ar" ? "سعرة" : "Cal"}
        </div>
      </div>

      {/* تفاصيل الوجبة */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              margin: 0,
              color: "#ffffff",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              margin: "8px 0 0 0",
              lineHeight: "1.5",
            }}
          >
            {ingredientsList}
          </p>
        </div>

        {/* السعر وزر الإضافة */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "15px",
          }}
        >
          <span
            style={{ fontSize: "22px", fontWeight: "700", color: "#10b981" }}
          >
            {/* 🛠️ حماية إضافية لتأمين الدالة toFixed في حال كان السعر قادماً كنص من قاعدة البيانات */}
            ${Number(item.price || 0).toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(item)}
            style={{
              padding: "10px 18px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "14px",
              transition: "all 0.2s ease",
              boxShadow: isHovered
                ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                : "none",
            }}
          >
            {lang === "ar" ? "إضافة 🛒" : "Add 🛒"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodCard;