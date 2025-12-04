// Open Food Facts API Service
// Free, open-source database with millions of verified products

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  ingredients_text: string;
  ingredients_text_en: string;
  allergens_tags: string[];
  additives_tags: string[];
  nutriscore_grade: string;
  nova_group: number; // 1-4, 4 being ultra-processed
  image_url: string;
  categories: string;
  labels: string;
  nutrition_grades: string;
}

export interface OFFSearchResult {
  found: boolean;
  product?: OpenFoodFactsProduct;
  source: 'barcode' | 'search';
}

const OFF_API_BASE = 'https://world.openfoodfacts.org';

// Look up product by barcode
export async function lookupByBarcode(barcode: string): Promise<OFFSearchResult> {
  try {
    const response = await fetch(`${OFF_API_BASE}/api/v0/product/${barcode}.json`);
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
          additives_tags: data.product.additives_tags || [],
          nutriscore_grade: data.product.nutriscore_grade || '',
          nova_group: data.product.nova_group || 0,
          image_url: data.product.image_url || '',
          categories: data.product.categories || '',
          labels: data.product.labels || '',
          nutrition_grades: data.product.nutrition_grades || '',
        },
        source: 'barcode',
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('Open Food Facts barcode lookup error:', error);
    return { found: false };
  }
}

// Search for product by name
export async function searchByName(query: string): Promise<OFFSearchResult> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${OFF_API_BASE}/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=5`
    );
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      // Find the best match (first result with ingredients)
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
          additives_tags: bestMatch.additives_tags || [],
          nutriscore_grade: bestMatch.nutriscore_grade || '',
          nova_group: bestMatch.nova_group || 0,
          image_url: bestMatch.image_url || '',
          categories: bestMatch.categories || '',
          labels: bestMatch.labels || '',
          nutrition_grades: bestMatch.nutrition_grades || '',
        },
        source: 'search',
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('Open Food Facts search error:', error);
    return { found: false };
  }
}

// Extract barcode from image using pattern matching
export function extractBarcodeFromText(text: string): string | null {
  // Look for common barcode patterns (UPC-A, EAN-13, etc.)
  const barcodePatterns = [
    /\b(\d{13})\b/, // EAN-13
    /\b(\d{12})\b/, // UPC-A
    /\b(\d{8})\b/,  // EAN-8
  ];
  
  for (const pattern of barcodePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Format additives for display
export function formatAdditives(additives: string[]): string[] {
  return additives.map(additive => {
    // Convert "en:e150d" to "E150d (Caramel color)"
    const code = additive.replace('en:', '').toUpperCase();
    return code;
  });
}

// Get NOVA group description
export function getNovaDescription(novaGroup: number): string {
  switch (novaGroup) {
    case 1:
      return 'Unprocessed or minimally processed';
    case 2:
      return 'Processed culinary ingredients';
    case 3:
      return 'Processed foods';
    case 4:
      return 'Ultra-processed foods';
    default:
      return 'Processing level unknown';
  }
}
