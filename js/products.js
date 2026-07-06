const PRODUCTS = [
  {
    id: "ecovero-linen-shirt",
    name: "Ecovero Linen Utility Shirt",
    category: "Top",
    description: "A lightweight, breathable utility shirt crafted from 60% Organic Linen and 40% Lenzing™ Ecovero™ viscose. Biodegradable and dyed with non-toxic, organic plant extracts.",
    image: "assets/linen_shirt_card.png",
    overlayImage: "assets/linen_shirt_overlay.png",
    material: "60% Organic Linen, 40% Lenzing Ecovero",
    waterUsage: 120, // Liters used (vs 2700 standard)
    waterSavings: 95, // % savings
    carbonFootprint: 1.2, // kg CO2 (vs 8.2 standard)
    carbonSavings: 85, // % savings
    ecoRating: "A+",
    careGuide: "Wash cold on gentle cycle. Hang dry in shade. Iron low if needed. Avoid bleach.",
    color: "#4f772d" // Forest Green
  },
  {
    id: "recycled-cotton-tee",
    name: "Zero-Waste Recycled Tee",
    category: "Top",
    description: "An everyday classic tee made entirely from pre-consumer cotton waste and organic cotton fibers. Unbleached natural cream color, saving thousands of gallons of water.",
    image: "assets/cotton_tee_card.png",
    overlayImage: "assets/cotton_tee_overlay.png",
    material: "50% Recycled Cotton, 50% Certified Organic Cotton",
    waterUsage: 80, // Liters
    waterSavings: 97, // % savings
    carbonFootprint: 0.9, // kg CO2
    carbonSavings: 89, // % savings
    ecoRating: "A++",
    careGuide: "Machine wash cold with like colors. Air dry flat to save energy. Do not dry clean.",
    color: "#f5ebe0" // Cream
  },
  {
    id: "hemp-utility-jacket",
    name: "Hemp Canvas Utility Jacket",
    category: "Top",
    description: "A durable, weather-resistant workwear jacket made from pure industrial hemp fibers. Hemp grows without pesticides and absorbs 4x more CO2 than typical trees.",
    image: "assets/hemp_jacket_card.png",
    overlayImage: "assets/hemp_jacket_overlay.png",
    material: "100% Organic Industrial Hemp Canvas",
    waterUsage: 220, // Liters
    waterSavings: 85, // % savings
    carbonFootprint: -1.1, // Net negative carbon footprint (carbon sink)
    carbonSavings: 113, // % savings
    ecoRating: "A+++",
    careGuide: "Spot clean when possible. Machine wash cold inside out. Tumble dry low or air dry.",
    color: "#6b705c" // Olive/Sage
  },
  {
    id: "organic-denim-dress",
    name: "Upcycled Denim Wrap Dress",
    category: "Dress",
    description: "A versatile wrap dress created from post-consumer recycled denim jeans and certified organic cotton. Refitted and reinforced with organic tencel sewing threads.",
    image: "assets/denim_dress_card.png",
    overlayImage: "assets/denim_dress_overlay.png",
    material: "70% Upcycled Cotton Denim, 30% Organic Cotton",
    waterUsage: 350, // Liters (vs 8000 for standard denim)
    waterSavings: 95, // % savings
    carbonFootprint: 2.8, // kg CO2
    carbonSavings: 72, // % savings
    ecoRating: "A",
    careGuide: "Wash only when necessary. Cold wash inside out. Line dry. Indigo color may fade naturally.",
    color: "#2a6f97" // Indigo Blue
  },
  {
    id: "tencel-wrap-dress",
    name: "Tencel Flow Wrap Dress",
    category: "Dress",
    description: "An elegant, silky-soft dress made from Lyocell Tencel™ sourced from sustainably managed eucalyptus forests. Processed in a closed-loop system recycling 99% of solvent and water.",
    image: "assets/wrap_dress_card.png",
    overlayImage: "assets/wrap_dress_overlay.png",
    material: "100% Eucalyptus Lyocell (Tencel)",
    waterUsage: 150, // Liters
    waterSavings: 92, // % savings
    carbonFootprint: 1.4, // kg CO2
    carbonSavings: 83, // % savings
    ecoRating: "A+",
    careGuide: "Hand wash cold or dry clean with eco-solvents. Dry flat in shade. Do not wring or twist.",
    color: "#bc6c25" // Rust Orange
  }
];
