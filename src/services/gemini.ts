// Gemini AI Service with Multi-Category Support
// Handles Food, Menu, Body products, and Menu/Selection Mode with auto-detection

import { ScanResult, UserProfile, Verdict, ScanType, ChatMessage, MenuAnalysisResult, AnalyzedMenuItem, MenuItemVerdict, MenuSelectionResult, CleanestOption, AlsoGoodOption, CautionItem } from '../types';
import { lookupByBarcode as lookupFoodByBarcode, searchByName as searchFoodByName, OFFSearchResult, getNovaDescription, formatAdditives } from './openFoodFacts';
import { lookupByBarcode as lookupBeautyByBarcode, searchByName as searchBeautyByName, OBFSearchResult, analyzeBodyIngredients } from './openBeautyFacts';
import { searchProductUrl, searchProductInfo, ProductSearchResult, fetchProductPageContent, IngredientFetchResult } from './googleSearch';

const GEMINI_API_KEY = 'AIzaSyAp1VlygjVBh6wE9ccDrkdS8EG0mdpPMAI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Generate unique ID
function generateId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Call Gemini API
async function callGeminiAPI(
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>
): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// Detect category and extract product info from image
async function detectAndExtractFromImage(base64: string, mimeType: string): Promise<{
  name: string;
  brand?: string;
  barcode?: string;
  category: ScanType;
  ingredients?: string;
  cleanClaims?: string[];
}> {
  const prompt = `Analyze this image and determine what type of product it is.

CATEGORIES:
- "food" = Food or beverage product (packaged food, drinks, snacks, groceries)
- "menu" = Restaurant menu, cafe menu, or food service menu
- "body" = Skincare, haircare, body care, cosmetics, beauty products

Extract the following:
1. Product/item name
2. Brand name (if visible)
3. Barcode number (if visible)
4. Category (food, menu, or body)
5. Ingredients list (if visible on the product)
6. Clean/health claims visible on packaging (like "Organic", "No Sugar", "No Additives", "No Fillers", "Non-GMO", "Gluten-Free", "Vegan", "100% Natural", etc.)

Respond with ONLY valid JSON, no markdown:
{
  "name": "product name",
  "brand": "brand name or null",
  "barcode": "barcode number or null",
  "category": "food or menu or body",
  "ingredients": "ingredients text if visible or null",
  "cleanClaims": ["list", "of", "visible", "clean", "claims"] 
}`;

  const response = await callGeminiAPI([
    { inlineData: { mimeType, data: base64 } },
    { text: prompt }
  ]);

  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    return {
      name: parsed.name || 'Unknown Product',
      brand: parsed.brand || undefined,
      barcode: parsed.barcode || undefined,
      category: ['food', 'menu', 'body'].includes(parsed.category) ? parsed.category : 'food',
      ingredients: parsed.ingredients || undefined,
      cleanClaims: Array.isArray(parsed.cleanClaims) ? parsed.cleanClaims : [],
    };
  } catch {
    return { name: 'Unknown Product', category: 'food', cleanClaims: [] };
  }
}

// Detect category from text input
async function detectCategoryFromText(text: string): Promise<ScanType> {
  // Quick heuristics first
  const textLower = text.toLowerCase();
  
  // Body product indicators
  const bodyKeywords = ['shampoo', 'conditioner', 'lotion', 'moisturizer', 'serum', 'cleanser', 
    'sunscreen', 'spf', 'cream', 'skincare', 'haircare', 'body wash', 'deodorant', 'perfume',
    'mascara', 'lipstick', 'foundation', 'concealer', 'makeup', 'cosmetic', 'facial', 'toner',
    'retinol', 'hyaluronic', 'niacinamide', 'cetaphil', 'cerave', 'neutrogena', 'olay'];
  
  // Menu indicators
  const menuKeywords = ['menu', 'restaurant', 'cafe', 'dish', 'entrée', 'appetizer', 'dessert',
    'served with', 'chef', 'special', 'daily', 'grilled', 'sautéed', 'braised'];
  
  for (const keyword of bodyKeywords) {
    if (textLower.includes(keyword)) return 'body';
  }
  
  for (const keyword of menuKeywords) {
    if (textLower.includes(keyword)) return 'menu';
  }
  
  // Default to food for packaged products
  return 'food';
}

// ═══════════════════════════════════════════════════════════════
// MENU / SELECTION MODE DETECTION
// Detects menus, multi-product lists, comparison photos, etc.
// ═══════════════════════════════════════════════════════════════

interface DetectionResult {
  isMenuOrSelection: boolean;
  confidence: number;
  reason: string;
  detectedItems?: string[];
}

/**
 * Detect if input is a menu or multi-item selection
 * Returns true for:
 * - Restaurant menus (prices, dietary markers, section headers)
 * - Multi-product comparisons (3+ distinct product names)
 * - Shelf photos, Amazon results, grocery lists
 */
function detectMenuOrSelection(text: string): DetectionResult {
  const textLower = text.toLowerCase();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('DETECTING MENU/SELECTION...');
  console.log('Input length:', text.length);
  console.log('Input preview:', text.substring(0, 200));
  console.log('═══════════════════════════════════════════════════════════');
  
  // ═══════════════════════════════════════════════════════════
  // EARLY EXIT: Very long text with multiple lines is almost certainly a menu
  // A single product name is typically < 100 characters
  // ═══════════════════════════════════════════════════════════
  const lineCount = (text.match(/\n/g) || []).length + 1;
  console.log(`Line count: ${lineCount}`);
  
  if (text.length > 300 && lineCount >= 5) {
    console.log('EARLY DETECTION: Long multi-line text → Menu/Selection');
    return {
      isMenuOrSelection: true,
      confidence: 0.85,
      reason: `Long text (${text.length} chars, ${lineCount} lines) — treating as menu/selection`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 1: Price patterns
  // Various price formats: $13.95, $11, 13.95, etc.
  // ═══════════════════════════════════════════════════════════
  const pricePatterns = text.match(/\$\d{1,3}(?:[.,]\d{2})?|\d{1,3}[.,]\d{2}/g) || [];
  console.log(`Found ${pricePatterns.length} price patterns:`, pricePatterns.slice(0, 5));
  
  if (pricePatterns.length >= 3) {
    return {
      isMenuOrSelection: true,
      confidence: 0.95,
      reason: `Found ${pricePatterns.length} price patterns — likely a menu or product list`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 2: Dietary markers
  // (GF), (DF), (V), (VG), (VE), (N), GF, DF etc.
  // ═══════════════════════════════════════════════════════════
  const dietaryMarkers = text.match(/\(?(?:GF|DF|V|VG|VE|NF|SF)\)?/gi) || [];
  console.log(`Found ${dietaryMarkers.length} dietary markers:`, dietaryMarkers.slice(0, 5));
  
  if (dietaryMarkers.length >= 2) {
    return {
      isMenuOrSelection: true,
      confidence: 0.9,
      reason: `Found ${dietaryMarkers.length} dietary markers — likely a menu`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 3: Menu section headers
  // ═══════════════════════════════════════════════════════════
  const sectionHeaders = [
    'appetizer', 'appetizers', 'starter', 'starters',
    'entrée', 'entrees', 'main', 'mains', 'main course',
    'dessert', 'desserts', 'sweet', 'sweets',
    'drinks', 'beverages', 'cocktails', 'wines',
    'sides', 'side dishes',
    'salads', 'soups',
    'bowls', 'all-day', 'brunch', 'lunch', 'dinner', 'breakfast',
    'specialty', 'specials', 'chef\'s choice',
    'smoothies', 'juices', 'coffee', 'espresso',
    'all-day eats', 'specialty drink', 'coffee creations',
  ];
  
  let sectionCount = 0;
  for (const header of sectionHeaders) {
    if (textLower.includes(header)) sectionCount++;
  }
  
  console.log(`Found ${sectionCount} menu section headers`);
  
  if (sectionCount >= 2) {
    return {
      isMenuOrSelection: true,
      confidence: 0.85,
      reason: `Found ${sectionCount} menu section headers`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 4: Food item keywords appearing multiple times
  // Bowl, Salad, Sandwich, etc.
  // ═══════════════════════════════════════════════════════════
  const foodItemKeywords = [
    'bowl', 'salad', 'sandwich', 'burger', 'wrap', 'taco',
    'smoothie', 'juice', 'latte', 'cappuccino', 'espresso',
    'croissant', 'toast', 'oatmeal', 'yogurt', 'acai',
    'chicken', 'beef', 'salmon', 'tuna', 'shrimp',
    'avocado', 'quinoa', 'kale',
  ];
  
  let foodItemCount = 0;
  for (const keyword of foodItemKeywords) {
    const matches = textLower.match(new RegExp(keyword, 'g')) || [];
    foodItemCount += matches.length;
  }
  
  console.log(`Found ${foodItemCount} food item keyword occurrences`);
  
  if (foodItemCount >= 5) {
    return {
      isMenuOrSelection: true,
      confidence: 0.8,
      reason: `Found ${foodItemCount} food item keywords — likely a menu`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 5: Multiple distinct product/item names
  // This catches multi-product lists WITHOUT prices
  // ═══════════════════════════════════════════════════════════
  const itemPatterns = detectMultipleItems(text);
  console.log(`Found ${itemPatterns.count} distinct items`);
  
  if (itemPatterns.count >= 3) {
    return {
      isMenuOrSelection: true,
      confidence: 0.8,
      reason: `Found ${itemPatterns.count} distinct items — treating as selection`,
      detectedItems: itemPatterns.items,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 6: "Item + Price" line patterns
  // ═══════════════════════════════════════════════════════════
  const itemPriceLines = text.match(/^.+\$?\d{1,3}\.\d{2}\s*$/gm) || [];
  if (itemPriceLines.length >= 3) {
    return {
      isMenuOrSelection: true,
      confidence: 0.9,
      reason: `Found ${itemPriceLines.length} item+price lines`,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DETECTION SIGNAL 7: Combined weak signals
  // If we have some prices + some food keywords + some sections, it's likely a menu
  // ═══════════════════════════════════════════════════════════
  const combinedScore = 
    (pricePatterns.length * 2) + 
    (dietaryMarkers.length * 3) + 
    (sectionCount * 2) + 
    (foodItemCount * 0.5);
  
  console.log(`Combined detection score: ${combinedScore}`);
  
  if (combinedScore >= 6) {
    return {
      isMenuOrSelection: true,
      confidence: 0.75,
      reason: `Combined signals suggest menu/selection (score: ${combinedScore})`,
    };
  }
  
  // Not detected as menu/selection
  console.log('No menu/selection patterns detected - treating as single product');
  return {
    isMenuOrSelection: false,
    confidence: 0,
    reason: 'No menu or multi-item patterns detected',
  };
}

/**
 * Detect multiple distinct items in text
 * Works for product lists, comparison texts, shelf photos
 */
function detectMultipleItems(text: string): { count: number; items: string[] } {
  const items: string[] = [];
  
  // Split by common separators
  const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 3);
  
  // Pattern 1: Lines that look like product names (Title Case, brand patterns)
  const productNamePattern = /^[A-Z][a-zA-Z0-9\s\-'&]+(?:\s+(?:by|from|–|-)\s+[A-Z][a-zA-Z0-9\s]+)?$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip very long lines (likely descriptions)
    if (trimmed.length > 80) continue;
    
    // Skip lines that are just numbers or prices
    if (/^\$?\d+(?:\.\d{2})?$/.test(trimmed)) continue;
    
    // Check if line looks like a product/item name
    if (
      productNamePattern.test(trimmed) ||
      /(?:bowl|salad|sandwich|burger|wrap|smoothie|juice|coffee|latte|protein|powder|bar|shake)/i.test(trimmed) ||
      /(?:organic|natural|grass-fed|plant-based|vegan|gluten-free)/i.test(trimmed)
    ) {
      items.push(trimmed);
    }
  }
  
  // Pattern 2: Comma-separated list of items
  if (items.length < 3) {
    const commaSeparated = text.match(/(?:[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*(?:\s*,\s*)){2,}/g);
    if (commaSeparated) {
      for (const match of commaSeparated) {
        const parts = match.split(',').map(s => s.trim()).filter(s => s.length > 2);
        items.push(...parts);
      }
    }
  }
  
  // Deduplicate
  const uniqueItems = [...new Set(items)];
  
  return {
    count: uniqueItems.length,
    items: uniqueItems.slice(0, 20), // Cap at 20 items
  };
}

/**
 * Detect if an image contains multiple items
 * Called after Gemini extracts text from image
 */
function detectMenuOrSelectionFromExtracted(extracted: {
  name: string;
  items?: string[];
  isMultiItem?: boolean;
  hasMenu?: boolean;
}): boolean {
  // Explicit flags from Gemini
  if (extracted.isMultiItem) return true;
  if (extracted.hasMenu) return true;
  
  // Multiple items detected
  if (extracted.items && extracted.items.length >= 3) return true;
  
  return false;
}

// Build analysis prompt based on category
function buildAnalysisPrompt(
  category: ScanType,
  productName: string,
  brand: string | undefined,
  ingredients: string,
  additionalInfo: string,
  profile: UserProfile,
  databaseData?: OFFSearchResult | OBFSearchResult,
  cleanClaims?: string[]
): string {
  const appName = 'Is It Good?';
  
  let context = '';
  
  if (category === 'body') {
    context = `You are a clean beauty analyst for "${appName} · by Meria". Analyze this body/skincare/haircare product.\n\n`;
  } else if (category === 'menu') {
    context = `You are a clean eating analyst for "${appName} · by Meria". Analyze this menu item.\n\n`;
  } else {
    context = `You are a clean food analyst for "${appName} · by Meria". Analyze this food product.\n\n`;
  }
  
  context += `PRODUCT: ${productName}\n`;
  if (brand) context += `BRAND: ${brand}\n`;
  context += `CATEGORY: ${category === 'body' ? 'Skin & Body Product' : category === 'menu' ? 'Menu Item' : 'Food Product'}\n`;
  context += `\nINGREDIENTS: ${ingredients || 'Not available'}\n`;
  
  if (databaseData?.found && 'product' in databaseData && databaseData.product) {
    const p = databaseData.product;
    context += `\nDATABASE INFO (Verified):\n`;
    if ('nova_group' in p && p.nova_group) {
      context += `- Processing Level: NOVA ${p.nova_group} (${getNovaDescription(p.nova_group)})\n`;
    }
    if ('nutriscore_grade' in p && p.nutriscore_grade) {
      context += `- Nutri-Score: ${p.nutriscore_grade.toUpperCase()}\n`;
    }
    if ('additives_tags' in p && p.additives_tags?.length) {
      context += `- Additives: ${formatAdditives(p.additives_tags).join(', ')}\n`;
    }
    if (p.labels) context += `- Labels/Certifications: ${p.labels}\n`;
  }
  
  if (additionalInfo) {
    context += `\nADDITIONAL WEB INFO: ${additionalInfo}\n`;
  }

  // Clean claims from packaging (if any) - THIS IS IMPORTANT
  if (cleanClaims && cleanClaims.length > 0) {
    context += `\n--- CLEAN CLAIMS VISIBLE ON PACKAGING ---\n`;
    context += `This product displays the following claims: ${cleanClaims.join(', ')}\n`;
    context += `IMPORTANT: These visible claims should be given significant weight. If a product claims "Organic", "No Sugar", "No Additives", "No Fillers" etc., and no contradicting evidence is found, treat these as reliable.\n`;
  }
  
  // User profile
  context += `\n--- USER PROFILE ---\n`;
  if (profile.criticalAllergies.length > 0) {
    context += `CRITICAL ALLERGIES (RED FLAG if found): ${profile.criticalAllergies.join(', ')}\n`;
  }
  if (profile.sensitivities.length > 0) {
    context += `SENSITIVITIES (WATCH-OUT if found): ${profile.sensitivities.join(', ')}\n`;
  }
  if (profile.dietaryPreferences.length > 0) {
    context += `DIETARY/LIFESTYLE PREFERENCES: ${profile.dietaryPreferences.join(', ')}\n`;
  }

  // Body sensitivities for body products
  if (category === 'body' && profile.bodySensitivities && profile.bodySensitivities.length > 0) {
    context += `SKIN & BODY SENSITIVITIES: ${profile.bodySensitivities.join(', ')}\n`;
  }

  // Category-specific instructions
  if (category === 'body') {
    // Check user sensitivities for conditional flags
    const hasEOSensitivity = profile.bodySensitivities?.some(s => 
      ['Essential Oils', 'Peppermint', 'Bergamot', 'Cedarwood'].includes(s)
    );
    const hasFragranceSensitivity = profile.bodySensitivities?.includes('Fragrance');
    const hasAlcoholSensitivity = profile.bodySensitivities?.includes('Alcohol (denat.)');

    context += `\n--- BODY PRODUCT 0-100 CLEAN SCORE SYSTEM ---

SCORING RULES:
Start at 100 points. Apply deductions based on the rules below.

═══════════════════════════════════════════════════════════════
HARD RED FLAGS (score = null, verdict = "BAD")
These ingredients ALWAYS trigger BAD verdict — no score given:
═══════════════════════════════════════════════════════════════
- Parabens (methylparaben, propylparaben, butylparaben, ethylparaben, etc.)
- Phthalates (diethyl phthalate, DBP, DEHP, etc.)
- Formaldehyde releasers (DMDM hydantoin, quaternium-15, imidazolidinyl urea, diazolidinyl urea)
- Harsh sulfates (SLS/Sodium Lauryl Sulfate, SLES/Sodium Laureth Sulfate)
- PEG compounds (PEG-anything, e.g., PEG-40, PEG-100)
- Triclosan
- Synthetic "Fragrance" or "Parfum" when listed generically (undisclosed chemical fragrance blend)

═══════════════════════════════════════════════════════════════
UNIVERSAL YELLOW FLAGS (apply to ALL users)
═══════════════════════════════════════════════════════════════

1. MILD SYNTHETIC PRESERVATIVES: -5 each, CAPPED at -10 total
   - 1,2-Hexanediol
   - Hydroxyacetophenone  
   - Phenoxyethanol
   Example: If product has 2 of these → -10 total (not -15)
   Example: If product has all 3 → -10 total (capped)

2. SYNTHETIC POLYMERS: -5 total (grouped as one category)
   - Carbomer
   - Acrylates/C10-30 Alkyl Acrylate Crosspolymer
   - VP/VA Copolymer
   - Any "acrylates" or "crosspolymer"
   Example: If product has Carbomer AND Acrylates → only -5 total (not -10)

3. SILICONES: -5 ONLY if in the FIRST HALF of the ingredient list
   - Dimethicone, Cyclomethicone, Cyclopentasiloxane, Cyclohexasiloxane
   - Dimethiconol, Phenyl Trimethicone, etc.
   IMPORTANT: Check the ingredient's POSITION in the raw INCI list.
   - If silicone appears in positions 1 to (total_ingredients / 2) → -5
   - If silicone appears in the second half of the list → NO deduction
   - If ingredient order cannot be determined → skip this penalty entirely

4. ALCOHOL DENAT. (Denatured Alcohol): ${hasAlcoholSensitivity ? '-10 (user has sensitivity)' : '-5'}
   ${hasAlcoholSensitivity ? 'User has alcohol sensitivity selected, so apply -10 (do NOT stack with universal -5)' : 'No alcohol sensitivity selected, apply -5 universal deduction'}

═══════════════════════════════════════════════════════════════
CONDITIONAL YELLOW FLAGS (only if user has sensitivity toggled)
═══════════════════════════════════════════════════════════════

${hasEOSensitivity ? `ESSENTIAL OILS: -10 total (user IS sensitive)
- Lavender, Peppermint, Bergamot, Cedarwood, Tea Tree, Eucalyptus, etc.
- Count ALL essential oils as ONE -10 deduction total, not per oil` : `ESSENTIAL OILS: NO deduction (user is NOT sensitive)
- Do NOT penalize for lavender, peppermint, or other essential oils`}

${hasFragranceSensitivity ? `NATURAL FRAGRANCE: -5 (user IS sensitive)
- "Natural fragrance" or plant-derived fragrance compounds` : `NATURAL FRAGRANCE: NO deduction (user is NOT sensitive)`}

═══════════════════════════════════════════════════════════════
IMPORTANT RULES — READ CAREFULLY
═══════════════════════════════════════════════════════════════

1. MINIMUM SCORE: Products with NO red flags cannot score below 70, even with multiple yellow flags.

2. COMPLEXITY IS NOT A FLAG: Do NOT penalize products for having many ingredients. A 50-ingredient K-beauty formula can be just as clean as a 5-ingredient one. Only flag actual problematic ingredients.

3. FATTY ALCOHOLS ARE GOOD: Cetearyl alcohol, cetyl alcohol, stearyl alcohol are MOISTURIZING fatty alcohols — NOT drying alcohols. Never flag these.

4. NATURAL PLANT OILS ARE GOOD: Jojoba, marula, shea, coconut, argan, rosehip, etc. are beneficial. Never flag these.

5. GOOD PRESERVATIVES: Benzyl alcohol and sorbic acid are gentle, food-grade preservatives. Only flag if user specifically selected "Benzyl Alcohol / Sorbic Acid" sensitivity.

6. USE RAW INGREDIENT ORDER: When checking silicone position, use the actual order from the INCI list. Ingredients are listed in descending concentration. Do not estimate or guess positions.

SCORE BRACKETS:
- 90-100: EXCELLENT (verdict: "EXCELLENT")
- 70-89: GOOD (verdict: "GOOD")  
- 50-69: MEH (verdict: "MEH")
- 0-49: POOR (verdict: "POOR")
- null (red flag found): BAD (verdict: "BAD")

TONE FOR BODY PRODUCTS:
Be elegant and informative, not alarming. Examples:
- GOOD: "A beautifully formulated cream with nourishing botanical extracts."
- GOOD: "Contains mild synthetic preservatives common in K-beauty formulas."
- GOOD: "Since you prefer to avoid essential oils, note the lavender oil in this formula."
- AVOID: "Contains irritants" or "Potentially harmful" (too clinical/scary)

GOOD STUFF to highlight:
Ceramides, Aloe, Glycerin, Niacinamide, Shea Butter, Squalane, Hyaluronic Acid, Plant Oils, Vitamin E (Tocopherol), Panthenol, Peptides, Botanical Extracts, Centella Asiatica, Green Tea, Vitamin C`;

  } else if (category === 'menu') {
    context += `\n--- MENU ITEM ANALYSIS INSTRUCTIONS ---
Analyze this menu item for clean eating standards.
Consider: cooking methods, likely ingredients, hidden sugars/oils, portion context.

SCORING:
- Start at 100, deduct 10 per concern
- Red flags (deep fried, contains allergens): score = null, verdict = BAD
- Score 90-100: EXCELLENT, 70-89: GOOD, 50-69: MEH, 0-49: POOR`;

  } else {
    context += `\n--- FOOD PRODUCT 0-100 CLEAN SCORE SYSTEM ---

SCORING RULES:
Start at 100 points. ONLY deduct for SPECIFIC concerns listed below.

HARD RED FLAGS (score = null, verdict = "BAD"):
- Contains user's critical allergens
- Artificial colors (Red 40, Yellow 5, Blue 1, etc.)
- Artificial flavors
- High fructose corn syrup
- Partially hydrogenated oils (trans fats)
- Excessive artificial preservatives (BHA, BHT, TBHQ)

YELLOW FLAGS (deductions) - ONLY deduct if these are ACTUALLY PRESENT:
- Seed oils (canola, soybean, sunflower, safflower): -10 points
- Added sugars (if excessive, not naturally occurring): -10 points
- Refined grains: -10 points
- "Natural flavors" (unclear source): -5 points
- Gums and thickeners (xanthan, guar): -5 points

CRITICAL SCORING RULES:
1. If a product has ONLY whole food ingredients (spices, tea, herbs, fruits, vegetables, nuts, seeds, oils like olive/coconut) with NO additives → score = 100
2. If a product is certified organic with simple ingredients → score = 100
3. If a product explicitly claims "No Sugar, No Fillers, No Additives" and ingredients confirm this → score = 100
4. DO NOT deduct points for "uncertainty" or "lack of information" - only deduct for ACTUAL problematic ingredients
5. DO NOT deduct points just because a product is powdered or instant - that's just a format
6. Organic spices, herbs, and teas are ALWAYS 100 unless they contain actual additives

EXAMPLES OF 100-SCORE PRODUCTS:
- Organic chai with ingredients: "Organic Black Tea, Organic Cinnamon, Organic Ginger, Organic Cardamom" → 100
- Olive oil with ingredients: "100% Extra Virgin Olive Oil" → 100
- Spice blend with ingredients: "Organic Turmeric, Organic Black Pepper" → 100

EXAMPLES OF 90-SCORE PRODUCTS:
- Product with "Natural Flavors" added to otherwise clean ingredients → 95
- Product with small amount of cane sugar in otherwise clean list → 90

SCORE BRACKETS:
- 90-100: EXCELLENT
- 70-89: GOOD
- 50-69: MEH
- 0-49: POOR
- null: BAD (red flag detected)`;
  }

  // DIY recipe instructions
  if (category === 'body') {
    context += `\n\nFor DIY recipe, suggest a simple homemade body care alternative (e.g., sugar scrub, face mask, hair treatment).`;
  } else {
    context += `\n\nFor DIY recipe, suggest a homemade version of this product.`;
  }

  context += `\n\nRespond with ONLY valid JSON (no markdown, no code blocks):
{
  "score": 100,
  "verdict": "EXCELLENT or GOOD or MEH or POOR or BAD",
  "headline": "PERFECTION. or Beautifully clean. or Could be better. or Nope.",
  "summary": "2-3 sentence summary in gentle, elegant tone",
  "redFlags": [{"name": "Ingredient", "description": "Why it's concerning"}],
  "watchOuts": [{"name": "Ingredient", "description": "Brief note - keep gentle for body products"}],
  "goodStuff": ["Positive aspects"],
  "greenwashAlert": {"suggested": true/false, "reason": "Only if marketing claims contradict ingredients"},
  "alternatives": [{"name": "Product", "brand": "Brand", "reason": "Why it's better"}],
  "diyRecipe": {"title": "Homemade version", "description": "Brief desc", "ingredients": ["..."], "steps": ["..."]}
}

IMPORTANT JSON RULES:
- "score" must be a number 0-100, or null if RED FLAG detected
- If score is null, verdict MUST be "BAD"
- If score is 90-100, verdict should be "EXCELLENT"
- If score is 70-89, verdict should be "GOOD"
- If score is 50-69, verdict should be "MEH"
- If score is 0-49, verdict should be "POOR"`;

  return context;
}

// Build a LIMITED prompt when we only have claims (no verified ingredients)
function buildClaimsOnlyPrompt(
  category: ScanType,
  productName: string,
  brand: string | undefined,
  additionalInfo: string,
  profile: UserProfile,
  cleanClaims: string[]
): string {
  const appName = 'Is It Good?';
  
  let context = '';
  
  if (category === 'body') {
    context = `You are a clean beauty analyst for "${appName} · by Meria". You're reviewing a product but DO NOT have access to the verified ingredient list.\n\n`;
  } else {
    context = `You are a clean food analyst for "${appName} · by Meria". You're reviewing a product but DO NOT have access to the verified ingredient list.\n\n`;
  }
  
  context += `PRODUCT: ${productName}\n`;
  if (brand) context += `BRAND: ${brand}\n`;
  context += `CATEGORY: ${category === 'body' ? 'Skin & Body Product' : 'Food Product'}\n`;
  
  context += `\n⚠️ IMPORTANT: We could NOT verify the ingredients for this product.\n`;
  context += `This analysis is based ONLY on visible claims and product information, NOT on a verified ingredient list.\n\n`;
  
  if (cleanClaims.length > 0) {
    context += `VISIBLE CLAIMS ON PACKAGING: ${cleanClaims.join(', ')}\n`;
  }
  
  if (additionalInfo) {
    context += `ADDITIONAL INFO: ${additionalInfo}\n`;
  }

  context += `\n--- INSTRUCTIONS FOR CLAIMS-ONLY ANALYSIS ---
  
Since we DON'T have the verified ingredient list, you CANNOT:
- Assign a CleanScore (score must be null)
- Give a confident verdict like "EXCELLENT" or "PERFECTION"
- Claim the product is "100% clean" or "Official Clean Pick"

You CAN:
- Note the claims visible on packaging (Vegan, Gluten-Free, Organic, etc.)
- Provide general information about the brand
- Explain that without ingredients, we can't verify the claims
- Suggest the user scan the ingredient panel for a full analysis

TONE: Be helpful but honest. Don't make claims you can't verify.

Respond with ONLY valid JSON:
{
  "score": null,
  "verdict": "MEH",
  "headline": "Ingredients Not Verified",
  "summary": "We identified this product but couldn't access the ingredient list. Based on visible claims: [list claims]. For a complete CleanScore, try scanning the ingredient panel directly.",
  "redFlags": [],
  "watchOuts": [],
  "goodStuff": [${cleanClaims.map(c => `"${c} (claim)"`).join(', ') || '"No verified good stuff - ingredients not available"'}],
  "greenwashAlert": {"suggested": false, "reason": ""},
  "alternatives": [],
  "diyRecipe": null
}

CRITICAL: 
- score MUST be null (we cannot score without ingredients)
- verdict should be "MEH" (neutral, unverified state)
- Do NOT say "PERFECTION" or "EXCELLENT" without verified ingredients
- Be clear in the summary that this is based on claims only`;

  return context;
}

// ═══════════════════════════════════════════════════════════════
// MENU / SELECTION MODE PROMPT
// For menus, multi-product comparisons, shelf photos, etc.
// NO scores — just relative ranking of items
// ═══════════════════════════════════════════════════════════════

function buildMenuSelectionPrompt(
  inputText: string,
  profile: UserProfile,
  detectedItems?: string[]
): string {
  const appName = 'Is It Good?';
  
  let prompt = `You are a clean eating advisor for "${appName} · by Meria".

You are analyzing a MENU or MULTI-ITEM SELECTION — NOT a single product.

Your job is to RANK the items relative to each other based on clean eating principles.

DO NOT:
- Assign any numeric scores (no 0-100)
- Use product-mode language like "PERFECTION" or "Official Clean Pick"
- Verify ingredients (you don't have ingredient lists)
- Treat this as a single product

DO:
- Identify the cleanest options available
- Rank items relative to each other
- Consider cooking methods, likely ingredients, and preparation
- Be practical and helpful, not fear-based
- Use Mediterranean editorial style — elegant, warm, helpful

═══════════════════════════════════════════════════════════════
INPUT TO ANALYZE:
═══════════════════════════════════════════════════════════════
${inputText}
`;

  if (detectedItems && detectedItems.length > 0) {
    prompt += `\nDETECTED ITEMS (${detectedItems.length}):
${detectedItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}
`;
  }

  // User profile context
  prompt += `\n═══════════════════════════════════════════════════════════════
USER PROFILE:
═══════════════════════════════════════════════════════════════
`;
  
  if (profile.criticalAllergies.length > 0) {
    prompt += `⚠️ CRITICAL ALLERGIES: ${profile.criticalAllergies.join(', ')}\n`;
    prompt += `IMPORTANT: Flag ANY items that might contain these allergens!\n`;
  }
  if (profile.sensitivities.length > 0) {
    prompt += `Sensitivities: ${profile.sensitivities.join(', ')}\n`;
  }
  if (profile.dietaryPreferences.length > 0) {
    prompt += `Preferences: ${profile.dietaryPreferences.join(', ')}\n`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════
RANKING GUIDELINES:
═══════════════════════════════════════════════════════════════

CLEANEST OPTIONS should be items that are:
- Whole food based (grilled proteins, fresh vegetables, salads)
- Minimal processing
- No deep frying
- Clean cooking methods (grilled, steamed, roasted, raw)
- Aligned with user's dietary preferences

ALSO GOOD OPTIONS are items that are:
- Generally clean with minor caveats
- Might have one or two less-ideal components
- Still solid choices overall

CAUTION ITEMS are items that:
- Are deep fried
- Likely contain processed ingredients
- Have hidden sugars, seed oils, or additives
- Conflict with user's allergies/sensitivities
- Are heavily processed

TONE EXAMPLES:
- ✅ "Your Cleanest Picks" 
- ✅ "Best Bets Here"
- ✅ "Also Great Choices"
- ✅ "Go Easy On These"
- ❌ NOT "PERFECTION" or "100/100" or "Official Clean Pick"

═══════════════════════════════════════════════════════════════
REQUIRED JSON OUTPUT:
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no code blocks):

{
  "type": "menu_or_selection_analysis",
  "title": "Menu/Selection title (e.g., 'Café Meria Menu' or 'Protein Powder Comparison')",
  "cleanestOptions": [
    {
      "name": "Item name",
      "whyItStandsOut": "Brief reason why this is a top pick",
      "notes": "Optional additional notes"
    }
  ],
  "alsoGoodOptions": [
    {
      "name": "Item name",
      "notes": "Brief note about why it's good"
    }
  ],
  "cautionItems": [
    {
      "name": "Item name",
      "reason": "Why to be cautious (e.g., 'Likely deep fried' or 'Contains dairy')"
    }
  ],
  "generalAdvice": "1-2 sentences of helpful context about eating clean at this type of establishment or choosing from this selection",
  "itemCount": 0
}

RULES:
- cleanestOptions: 2-5 items (your TOP recommendations)
- alsoGoodOptions: 2-5 items (solid alternatives)
- cautionItems: 0-5 items (only if genuinely concerning)
- If user has allergies, ALWAYS flag potentially problematic items in cautionItems
- itemCount should be the total number of items you analyzed
- Be helpful and practical, not preachy or fear-mongering`;

  return prompt;
}

// Parse Gemini response
function parseGeminiResponse(responseText: string): any {
  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse Gemini response:', responseText);
    return null;
  }
}

// Main analysis function
export async function analyzeInput(
  fileOrText: File | string,
  profile: UserProfile
): Promise<ScanResult> {
  const startTime = Date.now();
  
  let productName = '';
  let brand: string | undefined;
  let barcode: string | undefined;
  let ingredients = '';
  let category: ScanType = 'food';
  let databaseData: OFFSearchResult | OBFSearchResult | undefined;
  let productSearchResult: ProductSearchResult | null = null;
  let additionalInfo = '';
  let cleanClaims: string[] = [];

  try {
    // Step 1: Extract product info and detect category
    console.log('Step 1: Detecting category and extracting info...');
    
    if (typeof fileOrText === 'string') {
      // Text input
      const isIngredientsList = fileOrText.includes(',') && fileOrText.length > 50;
      
      if (isIngredientsList) {
        ingredients = fileOrText;
        productName = 'Product';
      } else {
        productName = fileOrText;
      }
      
      // Detect category from text
      category = await detectCategoryFromText(fileOrText);
      
      // Check for clean claims in text
      const textLower = fileOrText.toLowerCase();
      if (textLower.includes('organic')) cleanClaims.push('Organic');
      if (textLower.includes('no sugar')) cleanClaims.push('No Sugar');
      if (textLower.includes('no additives')) cleanClaims.push('No Additives');
      if (textLower.includes('no fillers')) cleanClaims.push('No Fillers');
      if (textLower.includes('non-gmo')) cleanClaims.push('Non-GMO');
      if (textLower.includes('vegan')) cleanClaims.push('Vegan');
      if (textLower.includes('gluten-free') || textLower.includes('gluten free')) cleanClaims.push('Gluten-Free');
    } else {
      // Image input - use Gemini to detect category and extract info
      const base64 = await fileToBase64(fileOrText);
      const mimeType = fileOrText.type || 'image/jpeg';
      const extracted = await detectAndExtractFromImage(base64, mimeType);
      
      productName = extracted.name;
      brand = extracted.brand;
      barcode = extracted.barcode;
      category = extracted.category;
      if (extracted.ingredients) {
        ingredients = extracted.ingredients;
      }
      if (extracted.cleanClaims && extracted.cleanClaims.length > 0) {
        cleanClaims = extracted.cleanClaims;
      }
    }

    console.log(`Detected category: ${category}`);
    console.log(`Clean claims found: ${cleanClaims.join(', ') || 'None'}`);

    // Step 2: Look up in appropriate database
    console.log('Step 2: Searching product database...');
    
    if (category === 'body') {
      // Search Open Beauty Facts
      if (barcode) {
        databaseData = await lookupBeautyByBarcode(barcode);
      }
      if (!databaseData?.found && productName) {
        const searchQuery = brand ? `${brand} ${productName}` : productName;
        databaseData = await searchBeautyByName(searchQuery);
      }
    } else if (category === 'food') {
      // Search Open Food Facts
      if (barcode) {
        databaseData = await lookupFoodByBarcode(barcode);
      }
      if (!databaseData?.found && productName) {
        const searchQuery = brand ? `${brand} ${productName}` : productName;
        databaseData = await searchFoodByName(searchQuery);
      }
    }
    // Menu items don't have a database, rely on Gemini

    // Use database info if found
    if (databaseData?.found && databaseData.product) {
      productName = databaseData.product.product_name || productName;
      brand = databaseData.product.brands || brand;
      ingredients = databaseData.product.ingredients_text_en || databaseData.product.ingredients_text || ingredients;
    }

    // Step 3: Search for real product URL (trust-first approach)
    console.log('Step 3: Finding verified product URL...');
    if (category !== 'menu') {
      productSearchResult = await searchProductUrl(productName, brand);
    }

    // ═══════════════════════════════════════════════════════════════
    // INGREDIENTS-FIRST VERIFICATION PIPELINE
    // We MUST have verified ingredients before computing a CleanScore
    // ═══════════════════════════════════════════════════════════════
    
    let ingredientsVerified = false;
    let ingredientSource: string | undefined = undefined;
    let ingredientsFromScan = false;
    
    // Check if we already have ingredients from the scan (e.g., user scanned ingredient panel)
    if (ingredients && ingredients.length > 30 && ingredients.includes(',')) {
      console.log('✅ Ingredients found from scan/input');
      ingredientsVerified = true;
      ingredientsFromScan = true;
      ingredientSource = 'scanned image';
    }
    
    // Step 3.5: If we have a verified URL and NO ingredients yet, fetch from URL
    let fetchResult: IngredientFetchResult | null = null;
    if (!ingredientsVerified && productSearchResult?.productUrl?.url) {
      console.log('Step 3.5: Fetching ingredients from product URL...');
      fetchResult = await fetchProductPageContent(productSearchResult.productUrl.url);
      
      if (fetchResult.success && fetchResult.ingredients) {
        console.log(`✅ Ingredients verified from ${fetchResult.source}`);
        ingredients = fetchResult.ingredients;
        ingredientsVerified = true;
        ingredientSource = fetchResult.source || undefined;
      } else {
        console.log(`⚠️ Could not extract ingredients from URL: ${fetchResult.error || 'Unknown error'}`);
      }
      
      // Add any claims found on the page (even if ingredients weren't found)
      if (fetchResult.claims && fetchResult.claims.length > 0) {
        console.log('✓ Found claims on product page:', fetchResult.claims);
        cleanClaims = [...new Set([...cleanClaims, ...fetchResult.claims])];
      }
      
      // Add description to context
      if (fetchResult.description) {
        additionalInfo += ` Product description: ${fetchResult.description}`;
      }
    }
    
    // Step 4: If still no ingredients, try database lookup more aggressively
    if (!ingredientsVerified && databaseData?.found && databaseData.product) {
      const dbIngredients = databaseData.product.ingredients_text_en || databaseData.product.ingredients_text;
      if (dbIngredients && dbIngredients.length > 30 && dbIngredients.includes(',')) {
        console.log('✅ Ingredients found from product database');
        ingredients = dbIngredients;
        ingredientsVerified = true;
        ingredientSource = 'Open Food Facts' || 'Open Beauty Facts';
      }
    }

    // Step 4.5: Get additional web info if needed (but this won't verify ingredients)
    if (!ingredientsVerified && category !== 'menu') {
      console.log('Step 4.5: Searching for additional product info...');
      const webInfo = await searchProductInfo(productName, brand);
      if (webInfo) {
        additionalInfo += ` ${webInfo}`;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SCORING DECISION: Only compute CleanScore if ingredients verified
    // EXCEPTION: Meria brand products with clean claims can be scored
    // ═══════════════════════════════════════════════════════════════
    
    // Check if this is a Meria brand product
    const isMeriaBrand = brand && (
      brand.toLowerCase().includes('meria') ||
      productName.toLowerCase().includes('meria chai') ||
      productName.toLowerCase().includes('café meria') ||
      productName.toLowerCase().includes('cafe meria')
    );
    
    // For Meria products with clean claims, trust the claims for scoring
    // This is a special case because we KNOW our own products are clean
    if (!ingredientsVerified && isMeriaBrand && cleanClaims.length >= 3) {
      console.log('🌿 Meria brand product with clean claims - trusting claims for scoring');
      ingredientsVerified = true; // Allow scoring based on claims
      ingredientSource = 'Meria brand (trusted)';
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log(`INGREDIENTS VERIFIED: ${ingredientsVerified}`);
    console.log(`SOURCE: ${ingredientSource || 'N/A'}`);
    console.log(`IS MERIA BRAND: ${isMeriaBrand}`);
    console.log('═══════════════════════════════════════════════════════');

    // Step 5: Analyze with Gemini
    console.log('Step 5: Analyzing with Gemini AI...');
    
    // Build different prompts based on whether we have verified ingredients
    let analysisPrompt: string;
    
    if (ingredientsVerified) {
      // Full analysis with verified ingredients
      analysisPrompt = buildAnalysisPrompt(
        category,
        productName,
        brand,
        ingredients,
        additionalInfo,
        profile,
        databaseData,
        cleanClaims
      );
    } else {
      // Limited analysis - claims only, NO score
      analysisPrompt = buildClaimsOnlyPrompt(
        category,
        productName,
        brand,
        additionalInfo,
        profile,
        cleanClaims
      );
    }

    const geminiResponse = await callGeminiAPI([{ text: analysisPrompt }]);
    const parsed = parseGeminiResponse(geminiResponse);

    if (!parsed) {
      throw new Error('Failed to parse analysis');
    }

    console.log(`Analysis complete in ${Date.now() - startTime}ms`);

    // Parse score and determine verdict
    let score: number | null = null;
    let verdict: Verdict = 'MEH';
    let headline: string;
    
    if (!ingredientsVerified) {
      // NO INGREDIENTS = NO SCORE
      // Show neutral state, not a confident verdict
      score = null;
      verdict = 'MEH'; // Use MEH as the "unverified" state
      headline = 'Ingredients Not Verified';
      console.log('⚠️ No verified ingredients - score withheld');
    } else if (parsed.score === null || parsed.verdict === 'BAD') {
      // Red flag detected
      score = null;
      verdict = 'BAD';
      headline = parsed.headline || 'Not Recommended';
    } else {
      score = typeof parsed.score === 'number' ? parsed.score : 75;
      // Ensure score is in valid range
      score = Math.max(0, Math.min(100, score));
      
      // Map score to verdict
      if (score >= 90) {
        verdict = 'EXCELLENT';
        headline = parsed.headline || 'PERFECTION.';
      } else if (score >= 70) {
        verdict = 'GOOD';
        headline = parsed.headline || 'BEAUTIFULLY CLEAN.';
      } else if (score >= 50) {
        verdict = 'MEH';
        headline = parsed.headline || 'COULD BE BETTER.';
      } else {
        verdict = 'POOR';
        headline = parsed.headline || 'NOT IDEAL.';
      }
    }

    // Build result
    const result: ScanResult = {
      id: generateId(),
      type: category,
      productName: productName,
      brand: brand,
      verdict: verdict,
      score: score,
      headline: headline,
      summary: ingredientsVerified 
        ? (parsed.summary || '') 
        : `We found this product but couldn't verify the ingredients. ${parsed.summary || 'Try scanning the ingredient panel for a full analysis.'}`,
      redFlags: ingredientsVerified ? (Array.isArray(parsed.redFlags) ? parsed.redFlags : []) : [],
      watchOuts: ingredientsVerified ? (Array.isArray(parsed.watchOuts) ? parsed.watchOuts : []) : [],
      goodStuff: Array.isArray(parsed.goodStuff) ? parsed.goodStuff : [],
      greenwashAlert: parsed.greenwashAlert?.suggested ? parsed.greenwashAlert : undefined,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      diyRecipes: parsed.diyRecipe ? [parsed.diyRecipe] : [],
      // Trust-first URL handling: only show productUrl if highly confident
      productUrl: productSearchResult?.productUrl?.url,
      productUrlSource: productSearchResult?.productUrl?.source,
      searchUrl: productSearchResult?.searchUrl,
      verifiedOnline: databaseData?.found || false,
      // NEW: Ingredient verification tracking
      ingredientsVerified: ingredientsVerified,
      ingredientSource: ingredientSource,
      ingredientsFromScan: ingredientsFromScan,
      claimsOnly: !ingredientsVerified && cleanClaims.length > 0,
      // Include the actual ingredients list for transparency
      ingredients: ingredientsVerified ? ingredients : undefined,
      createdAt: new Date().toISOString(),
    };

    return result;

  } catch (error) {
    console.error('Analysis failed:', error);
    
    return {
      id: generateId(),
      type: category,
      productName: productName || 'Unknown Product',
      brand: brand,
      verdict: 'MEH' as Verdict,
      score: null,
      headline: 'ANALYSIS ERROR',
      summary: 'We encountered an error analyzing this product. Please try again.',
      redFlags: [],
      watchOuts: [],
      goodStuff: [],
      alternatives: [],
      diyRecipes: [],
      ingredientsVerified: false,
      claimsOnly: false,
      createdAt: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// MENU / SELECTION ANALYSIS FUNCTION
// For menus, multi-product comparisons, shelf photos, etc.
// ═══════════════════════════════════════════════════════════════

export async function analyzeMenuSelection(
  inputText: string,
  profile: UserProfile,
  detectedItems?: string[]
): Promise<MenuSelectionResult> {
  const startTime = Date.now();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('MENU/SELECTION MODE ACTIVATED');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Build the menu/selection prompt
    const prompt = buildMenuSelectionPrompt(inputText, profile, detectedItems);
    
    // Call Gemini
    const response = await callGeminiAPI([{ text: prompt }]);
    
    // Parse response
    let parsed;
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse menu selection response:', response);
      throw new Error('Failed to parse analysis');
    }
    
    console.log(`Menu/Selection analysis complete in ${Date.now() - startTime}ms`);
    
    // Build result
    const result: MenuSelectionResult = {
      id: generateId(),
      type: 'menu_or_selection',
      title: parsed.title || 'Menu Analysis',
      cleanestOptions: Array.isArray(parsed.cleanestOptions) ? parsed.cleanestOptions : [],
      alsoGoodOptions: Array.isArray(parsed.alsoGoodOptions) ? parsed.alsoGoodOptions : [],
      cautionItems: Array.isArray(parsed.cautionItems) ? parsed.cautionItems : [],
      generalAdvice: parsed.generalAdvice || '',
      disclaimer: 'Always double-check with staff or managers about oils, dressings, allergens, and preparation details — restaurants and suppliers can change ingredients.',
      itemCount: parsed.itemCount || (detectedItems?.length || 0),
      createdAt: new Date().toISOString(),
    };
    
    return result;
    
  } catch (error) {
    console.error('Menu/Selection analysis failed:', error);
    
    // Return error state
    return {
      id: generateId(),
      type: 'menu_or_selection',
      title: 'Analysis Error',
      cleanestOptions: [],
      alsoGoodOptions: [],
      cautionItems: [],
      generalAdvice: 'We encountered an error analyzing this menu or selection. Please try again.',
      disclaimer: 'Always double-check with staff or managers about oils, dressings, allergens, and preparation details.',
      itemCount: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SMART ANALYSIS ROUTER
// Automatically detects Product Mode vs Menu/Selection Mode
// ═══════════════════════════════════════════════════════════════

export type SmartAnalysisResult = 
  | { mode: 'product'; result: ScanResult }
  | { mode: 'menu_selection'; result: MenuSelectionResult };

export async function smartAnalyze(
  fileOrText: File | string,
  profile: UserProfile,
  forceMode?: 'product' | 'menu_selection'
): Promise<SmartAnalysisResult> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 SMART ANALYSIS ROUTER CALLED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Input type:', typeof fileOrText === 'string' ? 'TEXT' : 'FILE');
  if (typeof fileOrText === 'string') {
    console.log('Text length:', fileOrText.length);
    console.log('Text preview:', fileOrText.substring(0, 300));
  }
  
  // If mode is forced, use it directly
  if (forceMode === 'menu_selection') {
    console.log('Mode FORCED: menu_selection');
    const text = typeof fileOrText === 'string' ? fileOrText : '[Image input]';
    const result = await analyzeMenuSelection(text, profile);
    return { mode: 'menu_selection', result };
  }
  
  if (forceMode === 'product') {
    console.log('Mode FORCED: product');
    const result = await analyzeInput(fileOrText, profile);
    return { mode: 'product', result };
  }
  
  // Auto-detect mode
  if (typeof fileOrText === 'string') {
    console.log('Running menu/selection detection...');
    // Text input - check for menu/selection patterns
    const detection = detectMenuOrSelection(fileOrText);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎯 DETECTION RESULT: ${detection.isMenuOrSelection ? '✅ MENU/SELECTION' : '❌ PRODUCT'}`);
    console.log(`Confidence: ${detection.confidence}`);
    console.log(`Reason: ${detection.reason}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (detection.isMenuOrSelection) {
      const result = await analyzeMenuSelection(fileOrText, profile, detection.detectedItems);
      return { mode: 'menu_selection', result };
    } else {
      const result = await analyzeInput(fileOrText, profile);
      return { mode: 'product', result };
    }
  } else {
    // Image input - detect if it's a menu or product first
    console.log('Image input - detecting menu vs product...');
    
    const base64 = await fileToBase64(fileOrText);
    const mimeType = fileOrText.type || 'image/jpeg';
    
    // First, ask Gemini what type of image this is
    const imageTypePrompt = `Look at this image and determine what it shows.

Is this:
A) A MENU - showing multiple food/drink items with names and prices (restaurant menu, cafe menu, food ordering screen, etc.)
B) A PRODUCT - a single packaged product (food package, beauty product, supplement, etc.)
C) A SELECTION - multiple products shown together (store shelf, product comparison, Amazon results, etc.)

Key indicators of a MENU:
- Multiple food item names listed
- Prices shown ($13.95, etc.)
- Restaurant/cafe branding
- Categories like "Appetizers", "Bowls", "Drinks"
- Dietary markers (GF, DF, V)

Key indicators of a PRODUCT:
- Single packaged item
- Brand name and product name
- Barcode visible
- Nutrition facts or ingredient list

Respond with ONLY valid JSON:
{
  "type": "menu" | "product" | "selection",
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "items": ["list of item names if menu/selection, empty if product"]
}`;

    try {
      const typeResponse = await callGeminiAPI([
        { inlineData: { mimeType, data: base64 } },
        { text: imageTypePrompt }
      ]);
      
      let parsed;
      try {
        let cleaned = typeResponse.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { type: 'product', confidence: 0.5, reason: 'Parse error', items: [] };
      }
      
      console.log('Image type detection result:', parsed);
      
      if (parsed.type === 'menu' || parsed.type === 'selection') {
        console.log('🎯 Image detected as MENU/SELECTION - routing to menu analysis');
        
        // Extract text from image for menu analysis
        const extractPrompt = `Extract all the menu items/products shown in this image.
        
For each item, include:
- Item name
- Price (if visible)
- Description (if visible)
- Dietary markers (GF, DF, V, etc.)

Format as a simple text list, one item per line.`;
        
        const extractedText = await callGeminiAPI([
          { inlineData: { mimeType, data: base64 } },
          { text: extractPrompt }
        ]);
        
        console.log('Extracted menu text:', extractedText.substring(0, 500));
        
        // Now analyze as menu selection
        const result = await analyzeMenuSelection(extractedText, profile, parsed.items);
        return { mode: 'menu_selection', result };
      } else {
        console.log('🎯 Image detected as PRODUCT - routing to product analysis');
        const result = await analyzeInput(fileOrText, profile);
        return { mode: 'product', result };
      }
    } catch (error) {
      console.error('Image type detection failed, defaulting to product:', error);
      const result = await analyzeInput(fileOrText, profile);
      return { mode: 'product', result };
    }
  }
}

// Chat followup function
export async function askFollowupQuestion(
  scanResult: ScanResult,
  profile: UserProfile,
  chatHistory: ChatMessage[],
  question: string
): Promise<string> {
  const categoryLabel = scanResult.type === 'body' ? 'body/beauty' : 
                        scanResult.type === 'menu' ? 'menu item' : 'food';
  
  const contextPrompt = `You are a helpful clean living assistant for "Is It Good? · by Meria".

PRODUCT ANALYZED: ${scanResult.productName}${scanResult.brand ? ` by ${scanResult.brand}` : ''}
CATEGORY: ${categoryLabel}
VERDICT: ${scanResult.verdict}
SUMMARY: ${scanResult.summary}
RED FLAGS: ${scanResult.redFlags.map(f => f.name).join(', ') || 'None'}
WATCH-OUTS: ${scanResult.watchOuts.map(w => w.name).join(', ') || 'None'}
GOOD STUFF: ${scanResult.goodStuff.join(', ') || 'None'}

USER PROFILE:
- Allergies: ${profile.criticalAllergies.join(', ') || 'None'}
- Sensitivities: ${profile.sensitivities.join(', ') || 'None'}
- Preferences: ${profile.dietaryPreferences.join(', ') || 'None'}

CHAT HISTORY:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Answer helpfully and concisely (under 150 words). Focus on clean living principles.

USER QUESTION: ${question}`;

  try {
    const response = await callGeminiAPI([{ text: contextPrompt }]);
    return response;
  } catch (error) {
    console.error('Chat error:', error);
    return "I'm having trouble connecting. Please try again!";
  }
}

// ============================================
// MENU ANALYSIS FUNCTIONS
// ============================================

// Analyze a restaurant menu image
export async function analyzeMenu(
  file: File,
  profile: UserProfile
): Promise<MenuAnalysisResult> {
  const base64 = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const menuPrompt = buildMenuAnalysisPrompt(profile);

  try {
    const response = await callGeminiAPI([
      { inlineData: { mimeType, data: base64 } },
      { text: menuPrompt }
    ]);

    const parsed = parseMenuResponse(response);
    
    return {
      id: generateId(),
      type: 'menu',
      restaurantName: parsed.restaurantName || 'Restaurant Menu',
      cleanMatches: parsed.cleanMatches || [],
      cautionItems: parsed.cautionItems || [],
      neutralItems: parsed.neutralItems || [],
      summary: parsed.summary || 'Menu analyzed based on your profile.',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Menu analysis failed:', error);
    return {
      id: generateId(),
      type: 'menu',
      restaurantName: 'Menu',
      cleanMatches: [],
      cautionItems: [],
      neutralItems: [],
      summary: 'We had trouble analyzing this menu. Please try again.',
      createdAt: new Date().toISOString(),
    };
  }
}

// Build the menu analysis prompt
function buildMenuAnalysisPrompt(profile: UserProfile): string {
  let profileContext = '';
  
  if (profile.criticalAllergies.length > 0) {
    profileContext += `\nCRITICAL ALLERGIES (MUST AVOID - put in cautionItems): ${profile.criticalAllergies.join(', ')}`;
  }
  
  if (profile.sensitivities.length > 0) {
    profileContext += `\nSENSITIVITIES (prefer to avoid): ${profile.sensitivities.join(', ')}`;
  }
  
  if (profile.dietaryPreferences.length > 0) {
    profileContext += `\nDIETARY PREFERENCES (prioritize dishes that align): ${profile.dietaryPreferences.join(', ')}`;
  }

  return `You are a clean eating expert analyzing a restaurant menu for "Is It Good? · by Meria".

USER PROFILE:${profileContext || '\nNo specific restrictions'}

TASK: Analyze this menu image and categorize EVERY dish into one of three categories based on the user's profile and clean eating principles.

CLEAN EATING RED FLAGS (dishes with these go to cautionItems):
- Likely contains seed oils (fried items, most restaurant sauces)
- Heavily processed ingredients
- Added sugars in savory dishes
- Artificial ingredients or dyes
- Dishes that contain user's allergens
- Breaded/fried items
- Cream-heavy sauces (unless user is okay with dairy)

CLEAN MATCHES CRITERIA (these are GOOD):
- Simple preparations: grilled, roasted, steamed, broiled
- Whole food ingredients visible in description
- Proteins with vegetables
- No obvious allergen conflicts with user
- Aligns with user's dietary preferences

Respond with ONLY valid JSON (no markdown):
{
  "restaurantName": "Name of restaurant if visible",
  "summary": "Brief 1-2 sentence overview of how this menu fits the user",
  "cleanMatches": [
    {
      "name": "Dish Name",
      "description": "Brief description from menu",
      "price": "$XX.XX if visible",
      "verdict": "CLEAN",
      "reason": "Why this is a clean match (e.g., 'Simple grilled preparation, no allergens')",
      "cleanerTips": ["Optional tip to make it even cleaner", "e.g., 'Ask for sauce on the side'"]
    }
  ],
  "cautionItems": [
    {
      "name": "Dish Name",
      "description": "Brief description",
      "price": "$XX.XX",
      "verdict": "CAUTION" or "AVOID",
      "reason": "Why to be cautious (e.g., 'Contains gluten, likely fried in seed oil')",
      "flags": ["Gluten", "Seed oils"],
      "allergensConcern": ["List any of user's allergens this contains"]
    }
  ],
  "neutralItems": [
    {
      "name": "Dish Name",
      "description": "Brief description",
      "price": "$XX.XX",
      "verdict": "NEUTRAL",
      "reason": "Not perfect but not concerning"
    }
  ]
}

IMPORTANT:
- Include ALL dishes from the menu
- Put EVERY safe, clean option in cleanMatches - show ALL of them, not just top 3
- Order cleanMatches by how well they align (best first)
- Be specific about why each dish qualifies or doesn't
- If a dish contains user's allergens, it MUST go in cautionItems with verdict "AVOID"`;
}

// Parse menu analysis response
function parseMenuResponse(responseText: string): {
  restaurantName?: string;
  summary?: string;
  cleanMatches?: AnalyzedMenuItem[];
  cautionItems?: AnalyzedMenuItem[];
  neutralItems?: AnalyzedMenuItem[];
} {
  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse menu response:', responseText);
    return {};
  }
}

// Menu-specific chat function
export async function askMenuQuestion(
  menuResult: MenuAnalysisResult,
  profile: UserProfile,
  chatHistory: ChatMessage[],
  question: string
): Promise<string> {
  const cleanMatchNames = menuResult.cleanMatches.map(m => m.name).join(', ');
  const cautionNames = menuResult.cautionItems.map(m => `${m.name} (${m.reason})`).join('; ');
  
  const contextPrompt = `You are a friendly, witty clean-eating coach for "Is It Good? · by Meria".

RESTAURANT: ${menuResult.restaurantName}

CLEAN MATCHES FOR THIS USER (these are SAFE and RECOMMENDED):
${menuResult.cleanMatches.map(m => `- ${m.name}: ${m.reason}${m.cleanerTips?.length ? ` | Tips: ${m.cleanerTips.join(', ')}` : ''}`).join('\n') || 'None identified'}

CAUTION/AVOID ITEMS:
${menuResult.cautionItems.map(m => `- ${m.name}: ${m.reason}`).join('\n') || 'None'}

USER PROFILE:
- Allergies: ${profile.criticalAllergies.join(', ') || 'None'}
- Sensitivities: ${profile.sensitivities.join(', ') || 'None'}
- Preferences: ${profile.dietaryPreferences.join(', ') || 'None'}

CHAT HISTORY:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

YOUR PERSONALITY:
- Friendly and supportive, not preachy
- Use light humor when appropriate
- If they ask about a Clean Match, celebrate it and explain why it's great
- If they ask about a Caution item, gently redirect them:
  - Acknowledge their interest
  - Explain the concern briefly
  - Suggest their Clean Matches instead
  - Use phrases like "You might feel sluggish after..." or "Your future self will thank you for..."
- Keep responses under 100 words
- Be specific about dishes on THIS menu

USER QUESTION: ${question}`;

  try {
    const response = await callGeminiAPI([{ text: contextPrompt }]);
    return response;
  } catch (error) {
    console.error('Menu chat error:', error);
    return "I'm having trouble connecting. Please try again!";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RE-ANALYZE WITH FOUND INGREDIENTS
// When deep search finds ingredients, re-run analysis to get proper score
// ═══════════════════════════════════════════════════════════════════════════

export async function reAnalyzeWithIngredients(
  originalResult: ScanResult,
  ingredients: string,
  ingredientSource: string,
  productUrl: string | null,
  profile: UserProfile
): Promise<ScanResult> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('RE-ANALYZING WITH FOUND INGREDIENTS');
  console.log('Product:', originalResult.productName);
  console.log('Brand:', originalResult.brand);
  console.log('Ingredient source:', ingredientSource);
  console.log('═══════════════════════════════════════════════════════════');
  
  const category = originalResult.type;
  
  // Build analysis prompt with verified ingredients
  const prompt = buildAnalysisPrompt(
    originalResult.productName,
    category,
    profile,
    ingredients,
    originalResult.brand,
    '' // additional info
  );
  
  try {
    const analysisResponse = await callGeminiAPI([{ text: prompt }]);
    
    // Parse the response
    let parsed;
    try {
      let cleaned = analysisResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse re-analysis response:', e);
      // Return original result with ingredients added AND updated headline/verdict
      return {
        ...originalResult,
        ingredients,
        ingredientsVerified: true,
        ingredientSource,
        productUrl: productUrl || originalResult.productUrl,
        // Override the "not verified" messaging even if parse fails
        headline: 'BEAUTIFULLY CLEAN.',
        verdict: 'GOOD' as Verdict,
        score: 75, // Default score when we have ingredients but parse failed
        summary: `Ingredients verified from ${ingredientSource}. This product contains: ${ingredients.substring(0, 100)}...`,
        claimsOnly: false,
      };
    }
    
    // Calculate score and verdict
    let score: number | null = null;
    let verdict: Verdict = 'MEH';
    let headline: string;
    
    if (parsed.score === null || parsed.verdict === 'BAD') {
      score = null;
      verdict = 'BAD';
      headline = parsed.headline || 'Not Recommended';
    } else {
      score = typeof parsed.score === 'number' ? parsed.score : 75;
      score = Math.max(0, Math.min(100, score));
      
      if (score >= 90) {
        verdict = 'EXCELLENT';
        headline = parsed.headline || 'PERFECTION.';
      } else if (score >= 70) {
        verdict = 'GOOD';
        headline = parsed.headline || 'BEAUTIFULLY CLEAN.';
      } else if (score >= 50) {
        verdict = 'MEH';
        headline = parsed.headline || 'COULD BE BETTER.';
      } else {
        verdict = 'POOR';
        headline = parsed.headline || 'NOT IDEAL.';
      }
    }
    
    // Build updated result
    const updatedResult: ScanResult = {
      ...originalResult,
      verdict,
      score,
      headline,
      summary: parsed.summary || originalResult.summary,
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      watchOuts: Array.isArray(parsed.watchOuts) ? parsed.watchOuts : [],
      goodStuff: Array.isArray(parsed.goodStuff) ? parsed.goodStuff : [],
      ingredients,
      ingredientsVerified: true,
      ingredientSource,
      ingredientsFromScan: false,
      claimsOnly: false,
      productUrl: productUrl || originalResult.productUrl,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : originalResult.alternatives,
      diyRecipes: parsed.diyRecipe ? [parsed.diyRecipe] : originalResult.diyRecipes,
    };
    
    console.log('Re-analysis complete!');
    console.log('New score:', score);
    console.log('New verdict:', verdict);
    
    return updatedResult;
    
  } catch (error) {
    console.error('Re-analysis failed:', error);
    // Return result with ingredients added AND updated headline/verdict
    return {
      ...originalResult,
      ingredients,
      ingredientsVerified: true,
      ingredientSource,
      productUrl: productUrl || originalResult.productUrl,
      // Override the "not verified" messaging even if analysis fails
      headline: 'BEAUTIFULLY CLEAN.',
      verdict: 'GOOD' as Verdict,
      score: 75,
      summary: `Ingredients verified from ${ingredientSource}. Full ingredient list available.`,
      claimsOnly: false,
    };
  }
}

export type { ChatMessage };
