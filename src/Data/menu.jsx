const menuData = [
  {
    id: 1,
    name: {
      ar: "كلاسيك تشيز برجر 🍔",
      en: "Classic Cheeseburger 🍔"
    },
    price: 8.99,
    category: "burgers", // يجب أن تطابق الـ id في categories بملف App.jsx
    ingredients: {
      ar: ["شريحة لحم بقري", "جبنة شيدر", "خس", "طماطم", "بصل", "مخلل", "خبز بريوش"],
      en: ["Beef patty", "Cheddar cheese", "Lettuce", "Tomato", "Onion", "Pickles", "Brioche bun"]
    },
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop", // رابط صورة برجر احترافية عالية الدقة
    calories: 550,
    isVegetarian: false,
    isSpicy: false
  },
  {
    id: 2,
    name: {
      ar: "بيتزا مارغريتا 🍕",
      en: "Margherita Pizza 🍕"
    },
    price: 12.99,
    category: "pizza",
    ingredients: {
      ar: ["صلصة طماطم ملكية", "جبنة موزاريللا طازجة", "ريحان طازج", "زيت زيتون بكر", "عجينة إيطالية"],
      en: ["Tomato sauce", "Fresh mozzarella", "Fresh basil", "Olive oil", "Pizza dough"]
    },
    imageUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=600&auto=format&fit=crop", // رابط صورة بيتزا احترافية عالية الدقة
    calories: 700,
    isVegetarian: true,
    isSpicy: false
  },
  {
    id: 3,
    name: {
      ar: "أصابع الموزاريلا المقرمشة 🍟",
      en: "Crunchy Mozzarella Sticks 🍟"
    },
    price: 5.49,
    category: "appetizers",
    ingredients: {
      ar: ["أصابع جبنة موزاريللا", "بقسماط متبل", "صلصة المارينارا الحارة"],
      en: ["Mozzarella cheese sticks", "Seasoned breadcrumbs", "Spicy marinara sauce"]
    },
    imageUrl: "https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?q=80&w=600&auto=format&fit=crop",
    calories: 420,
    isVegetarian: true,
    isSpicy: true
  },
  {
    id: 4,
    name: {
      ar: "موهيتو الفراولة الانتعاش 🥤",
      en: "Strawberry Mojito 🥤"
    },
    price: 3.99,
    category: "drinks",
    ingredients: {
      ar: ["فراولة طازجة", "نعناع", "ليمون", "صودا", "ثلج مجروش"],
      en: ["Fresh strawberries", "Mint", "Lime", "Soda", "Crushed ice"]
    },
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop",
    calories: 150,
    isVegetarian: true,
    isSpicy: false
  }
];

export default menuData;