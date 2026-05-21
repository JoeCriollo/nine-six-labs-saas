/**
 * MASTER DIMENSIONS BRAIN (Based on Deep Research)
 * Standardizing on Inches for high-precision volumetric calculation.
 */

interface Dimensions {
  length: number;
  width: number;
  height: number;
  category: string;
}

const DIMENSIONS_LIBRARY: Record<string, Dimensions> = {
  // Proteins (Tubs/Botes)
  "protein-5lb-standard": { length: 8.00, width: 8.00, height: 10.75, category: "Proteína" }, // ON Gold, etc.
  "protein-5lb-compact": { length: 6.00, width: 6.00, height: 10.75, category: "Proteína" },  // Dymatize ISO100
  "protein-4lb-standard": { length: 7.80, width: 7.75, height: 10.90, category: "Proteína" }, // MuscleTech, Perfect Sports
  "protein-2lb-standard": { length: 5.90, width: 5.90, height: 9.95, category: "Proteína" },
  
  // Proteins (Pouches/Bolsas)
  "protein-bag-10lb": { length: 14.70, width: 12.40, height: 5.50, category: "Proteína" },
  "protein-bag-5lb": { length: 8.90, width: 15.40, height: 4.30, category: "Proteína" },
  "protein-bag-1kg": { length: 5.90, width: 10.60, height: 3.50, category: "Proteína" },
  "protein-bag-11lb": { length: 11.80, width: 21.60, height: 5.50, category: "Proteína" },

  // Mass Gainers
  "mass-gainer-12lb": { length: 14.17, width: 11.97, height: 5.91, category: "Otros" }, // Serious Mass

  // Creatines
  "creatine-600g": { length: 4.05, width: 4.05, height: 6.65, category: "Creatina" },
  "creatine-400g": { length: 4.05, width: 4.05, height: 6.20, category: "Creatina" },
  "creatine-300g": { length: 3.80, width: 3.80, height: 5.00, category: "Creatina" },

  // Pre-workouts
  "pre-workout-30serv": { length: 3.62, width: 3.58, height: 5.79, category: "Pre-Work" },
  
  // Thermogenics (Burners)
  "burner-100caps": { length: 2.56, width: 2.52, height: 5.43, category: "Quemadores" },
  "burner-60caps": { length: 1.75, width: 1.75, height: 3.50, category: "Quemadores" },

  // Vitamins
  "vitamins-optimen": { length: 2.99, width: 2.99, height: 6.06, category: "Vitaminas" },
  "vitamins-animalpak": { length: 4.05, width: 4.05, height: 7.05, category: "Vitaminas" },
  "vitamins-standard": { length: 2.50, width: 2.50, height: 5.00, category: "Vitaminas" },

  // Default fallback
  "vitamins-vitaform": { length: 2.56, width: 2.56, height: 4.41, category: "Vitaminas" },
  "default": { length: 4.00, width: 4.00, height: 6.00, category: "Otros" }
};

export function findBestDimensions(brand: string, name: string, size: string): Dimensions {
  const b = brand.toLowerCase();
  const n = name.toLowerCase();
  const s = size.toLowerCase();

  // 1. Specific Product Matches (Highest Precision)
  if (b.includes("dymatize") || n.includes("iso100")) {
    if (s.includes("5")) return DIMENSIONS_LIBRARY["protein-5lb-compact"];
  }
  
  if (n.includes("serious mass") || n.includes("mass gainer")) {
    if (s.includes("12") || s.includes("10")) return DIMENSIONS_LIBRARY["mass-gainer-12lb"];
  }

  if (b.includes("animal") && n.includes("pak")) {
    return DIMENSIONS_LIBRARY["vitamins-animalpak"];
  }

  if (n.includes("opti-men") || n.includes("opti-women")) {
    return DIMENSIONS_LIBRARY["vitamins-optimen"];
  }

  // 2. Size/Category Matches
  // Proteins
  if (s.includes("11 lb") || s.includes("10 lb")) {
    return DIMENSIONS_LIBRARY["protein-bag-10lb"];
  }
  if (s.includes("5 lb") || s.includes("5lb")) {
    return DIMENSIONS_LIBRARY["protein-5lb-standard"];
  }
  if (s.includes("4 lb") || s.includes("4lb")) {
    return DIMENSIONS_LIBRARY["protein-4lb-standard"];
  }
  if (s.includes("2 lb") || s.includes("2lb") || s.includes("2.2") || s.includes("1 kg") || s.includes("1kg")) {
    // Check if it's a bag (common for MyProtein 2.2lb)
    if (b.includes("myprotein") || n.includes("impact")) return DIMENSIONS_LIBRARY["protein-bag-1kg"];
    return DIMENSIONS_LIBRARY["protein-2lb-standard"];
  }

  // Creatines
  if (n.includes("creatine") || n.includes("creatina")) {
    if (s.includes("600")) return DIMENSIONS_LIBRARY["creatine-600g"];
    if (s.includes("400")) return DIMENSIONS_LIBRARY["creatine-400g"];
    return DIMENSIONS_LIBRARY["creatine-300g"];
  }

  // Pre-works
  if (n.includes("pre-workout") || n.includes("c4") || n.includes("nitraflex") || n.includes("curse")) {
    return DIMENSIONS_LIBRARY["pre-workout-30serv"];
  }

  // Burners
  if (n.includes("lipo") || n.includes("hydroxycut") || n.includes("burner")) {
    if (s.includes("100")) return DIMENSIONS_LIBRARY["burner-100caps"];
    return DIMENSIONS_LIBRARY["burner-60caps"];
  }

  // Fallback by Category Keywords
  if (n.includes("whey") || n.includes("protein") || n.includes("proteina")) return DIMENSIONS_LIBRARY["protein-5lb-standard"];
  if (n.includes("vitamin") || n.includes("multi")) return DIMENSIONS_LIBRARY["vitamins-standard"];

  return DIMENSIONS_LIBRARY["default"];
}
