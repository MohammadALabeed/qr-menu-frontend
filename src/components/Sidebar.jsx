import { useState } from "react";

function Sidebar({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  cartCount,
  setIsCartOpen,
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const [isHoveredToggle, setIsHoveredToggle] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // إذا كنا على الموبايل، سنعرض شريط سفلي متكامل ومطور
  if (isMobile) {
    return (
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "75px",
          backgroundColor: "rgba(15, 22, 38, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
          padding: "0 15px",
        }}
      >
        {/* زر المنيو */}
        <button
          onClick={() => setActiveTab("menu")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "menu" ? "#10b981" : "#94a3b8",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            flex: 1,
          }}
        >
          <span style={{ fontSize: "18px" }}>🍽️</span>
          {lang === "ar" ? "المنيو" : "Menu"}
        </button>

        {/* زر من نحن - تم إضافته للموبايل */}
        <button
          onClick={() => setActiveTab("about")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "about" ? "#10b981" : "#94a3b8",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            flex: 1,
          }}
        >
          <span style={{ fontSize: "18px" }}>✨</span>
          {lang === "ar" ? "من نحن" : "About"}
        </button>

        {/* زر السلة المركزي المشع */}
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            background: "#10b981",
            border: "none",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          🛒 ({cartCount})
        </button>

        {/* زر تغيير اللغة الذكي */}
        <div style={{ position: "relative", flex: 1, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "18px" }}>🌐</span>
            {lang === "ar" ? "English" : "العربية"}
          </button>
          {showLangDropdown && (
            <div
              style={{
                position: "absolute",
                bottom: "55px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#0f1626",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 200,
                minWidth: "120px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              <button
                onClick={() => {
                  setLang("ar");
                  setShowLangDropdown(false);
                }}
                style={{
                  background: lang === "ar" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  border: "none",
                  color: lang === "ar" ? "#10b981" : "#94a3b8",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                🇸🇦 العربية
              </button>
              <button
                onClick={() => {
                  setLang("en");
                  setShowLangDropdown(false);
                }}
                style={{
                  background: lang === "en" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  border: "none",
                  color: lang === "en" ? "#10b981" : "#94a3b8",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                🇬🇧 English
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // الـ Sidebar الخاص بالشاشات الكبيرة (الكمبيوتر والتابلت) - يبقى كما هو تماماً
  return (
    <aside
      style={{
        width: isSidebarOpen ? "280px" : "80px",
        backgroundColor: "#0f1626",
        borderRight: lang === "en" ? "1px solid #1e293b" : "none",
        borderLeft: lang === "ar" ? "1px solid #1e293b" : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "30px 20px",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        height: "100vh",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* زر الفتح والإغلاق التفاعلي */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onMouseEnter={() => setIsHoveredToggle(true)}
        onMouseLeave={() => setIsHoveredToggle(false)}
        style={{
          position: "absolute",
          top: "35px",
          left: lang === "en" ? (isSidebarOpen ? "260px" : "60px") : "auto",
          right: lang === "ar" ? (isSidebarOpen ? "260px" : "60px") : "auto",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "#10b981",
          border: "2px solid #070a13",
          color: "#ffffff",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 150,
          transition: "all 0.3s ease",
          boxShadow: isHoveredToggle ? "0 0 15px #10b981" : "none",
          transform: isHoveredToggle ? "scale(1.1)" : "scale(1)",
        }}
      >
        {isSidebarOpen ? (
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>✕</span>
        ) : (
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>☰</span>
        )}
      </button>

      <div>
        {/* اللوجو والاسم العام للمطعم */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "15px", 
          marginBottom: "50px", 
          overflow: "hidden",
          paddingTop: "20px",
        }}>
          <div style={{
            width: "45px", height: "45px", borderRadius: "12px", 
            backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981",
            display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px", flexShrink: 0
          }}>
            🌊
          </div>
          {isSidebarOpen && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>
                View Restaurant
              </span>
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold", marginTop: "2px" }}>
                PREMIUM QR
              </span>
            </div>
          )}
        </div>

        {/* أزرار التصفح لتبويب المنيو ومعلومات المطعم */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("menu")}
            style={{
              display: "flex", alignItems: "center", gap: "15px", width: "100%", padding: "14px",
              borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "700",
              backgroundColor: activeTab === "menu" ? "rgba(16, 185, 129, 0.1)" : "transparent",
              color: activeTab === "menu" ? "#10b981" : "#94a3b8",
              justifyContent: isSidebarOpen ? "flex-start" : "center",
              transition: "all 0.2s ease"
            }}
          >
            <span>🍔</span>
            {isSidebarOpen && (lang === "ar" ? "قائمة الطعام" : "Food Menu")}
          </button>

          <button
            onClick={() => setActiveTab("about")}
            style={{
              display: "flex", alignItems: "center", gap: "15px", width: "100%", padding: "14px",
              borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "700",
              backgroundColor: activeTab === "about" ? "rgba(16, 185, 129, 0.1)" : "transparent",
              color: activeTab === "about" ? "#10b981" : "#94a3b8",
              justifyContent: isSidebarOpen ? "flex-start" : "center",
              transition: "all 0.2s ease"
            }}
          >
            <span>✨</span>
            {isSidebarOpen && (lang === "ar" ? "من نحن؟" : "About Us")}
          </button>
        </div>
      </div>

      {/* الأزرار السفلية (اللغة والسلة) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {/* زر تغيير اللغة الذكي */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            style={{
              display: "flex", alignItems: "center", gap: "15px", width: "100%", padding: "12px",
              borderRadius: "12px", border: "1px solid #1e293b", backgroundColor: "#070a13",
              color: "#f3f4f6", cursor: "pointer", fontSize: "14px", fontWeight: "600",
              justifyContent: isSidebarOpen ? "flex-start" : "center",
            }}
          >
            <span>🌐</span>
            {isSidebarOpen && (
              <span>
                {lang === "ar" ? "English" : "العربية"}
              </span>
            )}
          </button>
          {showLangDropdown && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: lang === "ar" ? "auto" : "0",
                right: lang === "ar" ? "0" : "auto",
                marginBottom: "8px",
                backgroundColor: "#0f1626",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 200,
                minWidth: isSidebarOpen ? "160px" : "140px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              <button
                onClick={() => {
                  setLang("ar");
                  setShowLangDropdown(false);
                }}
                style={{
                  background: lang === "ar" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  border: "none",
                  color: lang === "ar" ? "#10b981" : "#94a3b8",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  textAlign: lang === "ar" ? "right" : "left",
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                🇸🇦 العربية
              </button>
              <button
                onClick={() => {
                  setLang("en");
                  setShowLangDropdown(false);
                }}
                style={{
                  background: lang === "en" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  border: "none",
                  color: lang === "en" ? "#10b981" : "#94a3b8",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  textAlign: lang === "ar" ? "right" : "left",
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                🇬🇧 English
              </button>
            </div>
          )}
        </div>

        {/* زر السلة */}
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: "15px", width: "100%", padding: "14px",
            borderRadius: "14px", border: "none", backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#10b981", cursor: "pointer", fontSize: "15px", fontWeight: "700",
            justifyContent: isSidebarOpen ? "flex-start" : "center",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.1)"
          }}
        >
          <span>🛒</span>
          {isSidebarOpen && (
            <span>
              {lang === "ar" ? "السلة" : "My Cart"} ({cartCount})
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;