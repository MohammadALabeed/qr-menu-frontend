// تحديث الرابط ليتجه إلى سيرفر Vercel الفعلي الخاص بك بدلاً من لوكال هوسط
const API_URL = "https://backend-virid-kappa-61.vercel.app/api/menu";

/**
 * دالة لجلب المنيو من قاعدة البيانات وتحويلها إلى الهيكل الذي يفهمه الـ Frontend
 */
export const fetchMenuData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // التحقق من أن البيانات القادمة هي مصفوفة لمنع خطأ t.map is not a function
    const menuArray = Array.isArray(data) ? data : [];

    // تحويل البيانات القادمة من الداتابيز لتطابق هيكل اللغتين (AR / EN) في الفرونت إند
    return menuArray.map(item => {
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
        price: parseFloat(item.price) || 0,
        category: item.category ? item.category.toLowerCase() : "all",
        ingredients: typeof ingredientsObj === 'object' ? ingredientsObj : { ar: [], en: [] },
        imageUrl: item.image_url || item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", 
        calories: item.calories || 0,
        isVegetarian: item.is_vegetarian === 1 || item.isVegetarian === true,
        isSpicy: item.is_spicy === 1 || item.is_spicy === true
      };
    });

  } catch (error) {
    console.error("❌ فشل في جلب المنيو من السيرفر، تم تشغيل البيانات الاحتياطية:", error);
    return fallbackMenuData;
  }
};

// البيانات الاحتياطية (تظهر فقط لو السيرفر طافئ)
const fallbackMenuData = [
  {
    id: 1,
    name: { ar: "كلاسيك تشيز برجر 🍔", en: "Classic Cheeseburger 🍔" },
    price: 8.99,
    category: "burgers",
    ingredients: {
      ar: ["شريحة لحم بقري", "جبنة شيدر", "خس", "طماطم", "بصل", "مخلل", "خبز بريوش"],
      en: ["Beef patty", "Cheddar cheese", "Lettuce", "Tomato", "Onion", "Pickles", "Brioche bun"]
    },
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600",
    calories: 550,
    isVegetarian: false,
    isSpicy: false
  },
  {
    id: 2,
    name: { ar: "بيتزا مارغريتا 🍕", en: "Margherita Pizza 🍕" },
    price: 12.99,
    category: "pizza",
    ingredients: {
      ar: ["صلصة طماطم ملكية", "جبنة موزاريللا طازجة", "ريحان طازج", "زيت زيتون بكر", "عجينة إيطالية"],
      en: ["Tomato sauce", "Fresh mozzarella", "Fresh basil", "Olive oil", "Pizza dough"]
    },
    imageUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=600",
    calories: 700,
    isVegetarian: true,
    isSpicy: false
  }
];