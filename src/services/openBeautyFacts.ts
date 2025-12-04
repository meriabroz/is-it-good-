// Open Beauty Facts API Service
// Free, open-source database for cosmetics and body care products

export interface OpenBeautyFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  ingredients_text: string;
  ingredients_text_en: string;
  allergens_tags: string[];
  image_url: string;
  categories: string;
  labels: string;
}

export interface OBFSearchResult {
  found: boolean;
  product?: OpenBeautyFactsProduct;
  source: 'barcode' | 'search';
}

const OBF_API_BASE = 'https://world.openbeautyfacts.org';

// Known body product red flag ingredients
export const BODY_RED_FLAGS = [
  { pattern: /paraben/i, name: 'Parabens', description: 'Potential hormone disruptors linked to health concerns' },
  { pattern: /phthalate/i, name: 'Phthalates', description: 'Hormone-disrupting chemicals often hidden in "fragrance"' },
  { pattern: /dmdm hydantoin|quaternium-15|imidazolidinyl urea|diazolidinyl urea/i, name: 'Formaldehyde Releasers', description: 'Can release carcinogenic formaldehyde over time' },
  { pattern: /sodium lauryl sulfate|sodium laureth sulfate|\bsls\b|\bsles\b/i, name: 'Sulfates (SLS/SLES)', description: 'Harsh detergents that can irritate skin and strip natural oils' },
  { pattern: /\bfragrance\b|\bparfum\b/i, name: 'Synthetic Fragrance', description: 'Umbrella term that can hide hundreds of undisclosed chemicals' },
  { pattern: /oxybenzone/i, name: 'Oxybenzone', description: 'Chemical sunscreen ingredient linked to hormone disruption and coral reef damage' },
  { pattern: /triclosan/i, name: 'Triclosan', description: 'Antibacterial agent linked to hormone disruption and antibiotic resistance' },
  { pattern: /\bpeg-/i, name: 'PEG Compounds', description: 'Can be contaminated with carcinogenic impurities' },
  { pattern: /mineral oil|petrolatum|petroleum/i, name: 'Mineral Oil/Petrolatum', description: 'Petroleum-derived ingredients that can clog pores and contain impurities' },
  { pattern: /\btalc\b/i, name: 'Talc', description: 'May be contaminated with asbestos; linked to respiratory issues' },
];

export const BODY_WATCH_OUTS = [
  { pattern: /dimethicone|cyclomethicone|siloxane/i, name: 'Silicones', description: 'Can build up on skin/hair; not harmful but may affect product performance' },
  { pattern: /alcohol denat|denatured alcohol/i, name: 'Drying Alcohols', description: 'Can be drying and irritating, especially for sensitive skin' },
  { pattern: /phenoxyethanol/i, name: 'Phenoxyethanol', description: 'Generally safe preservative but can irritate sensitive skin' },
  { pattern: /retinol|retinoid|retinoic/i, name: 'Retinol', description: 'Effective but not recommended during pregnancy; can cause sensitivity' },
  { pattern: /essential oil|tea tree|lavender oil|eucalyptus/i, name: 'Essential Oils', description: 'Natural but can be sensitizing for some skin types' },
];

export const BODY_GOOD_STUFF = [
  'ceramides', 'aloe', 'glycerin', 'niacinamide', 'shea', 'squalane', 
  'hyaluronic acid', 'fragrance-free', 'vitamin e', 'jojoba', 'argan',
  'coconut oil', 'rosehip', 'green tea', 'centella', 'cica', 'peptides'
];

// Look up product by barcode
export async function lookupByBarcode(barcode: string): Promise<OBFSearchResult> {
  try {
    const response = await fetch(`${OBF_API_BASE}/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return {
        found: true,
        product: {
          code: data.product.code,
          product_name: data.product.product_name || data.product.product_name_en || 'Unknown',
          brands: data.product.brands || '',
          ingredients_text: data.product.ingredients_text || data.product.ingredients_text_en || '',
          ingredients_text_en: data.product.ingredients_text_en || data.product.ingredients_text || '',
          allergens_tags: data.product.allergens_tags || [],
          image_url: data.product.image_url || '',
          categories: data.product.categories || '',
          labels: data.product.labels || '',
        },
        source: 'barcode',
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('Open Beauty Facts barcode lookup error:', error);
    return { found: false };
  }
}

// Search for product by name
export async function searchByName(query: string): Promise<OBFSearchResult> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${OBF_API_BASE}/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=5`
    );
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const bestMatch = data.products.find((p: any) => p.ingredients_text || p.ingredients_text_en) 
        || data.products[0];
      
      return {
        found: true,
        product: {
          code: bestMatch.code,
          product_name: bestMatch.product_name || bestMatch.product_name_en || query,
          brands: bestMatch.brands || '',
          ingredients_text: bestMatch.ingredients_text || bestMatch.ingredients_text_en || '',
          ingredients_text_en: bestMatch.ingredients_text_en || bestMatch.ingredients_text || '',
          allergens_tags: bestMatch.allergens_tags || [],
          image_url: bestMatch.image_url || '',
          categories: bestMatch.categories || '',
          labels: bestMatch.labels || '',
        },
        source: 'search',
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('Open Beauty Facts search error:', error);
    return { found: false };
  }
}

// Analyze ingredients for red flags and watch-outs
export function analyzeBodyIngredients(ingredients: string): {
  redFlags: { name: string; description: string }[];
  watchOuts: { name: string; description: string }[];
  goodStuff: string[];
} {
  const redFlags: { name: string; description: string }[] = [];
  const watchOuts: { name: string; description: string }[] = [];
  const goodStuff: string[] = [];
  
  const ingredientsLower = ingredients.toLowerCase();
  
  // Check for red flags
  for (const flag of BODY_RED_FLAGS) {
    if (flag.pattern.test(ingredients)) {
      redFlags.push({ name: flag.name, description: flag.description });
    }
  }
  
  // Check for watch-outs
  for (const watchOut of BODY_WATCH_OUTS) {
    if (watchOut.pattern.test(ingredients)) {
      watchOuts.push({ name: watchOut.name, description: watchOut.description });
    }
  }
  
  // Check for good stuff
  for (const good of BODY_GOOD_STUFF) {
    if (ingredientsLower.includes(good.toLowerCase())) {
      goodStuff.push(good.charAt(0).toUpperCase() + good.slice(1));
    }
  }
  
  return { redFlags, watchOuts, goodStuff };
}
