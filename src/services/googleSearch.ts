// Google Custom Search Service
// TRUST-FIRST: Only returns URLs when we're highly confident they're correct
// A wrong link is worse than no link.

const GOOGLE_SEARCH_API_KEY = 'AIzaSyB0MBmgXcQM4R1Ykn5BHbj_F-CiRcRIcuk';
const SEARCH_ENGINE_ID = 'd3882adb67913408a';

// ═══════════════════════════════════════════════════════════════════════════
// BRAND WHITELIST - Direct URL mapping for known brands
// These bypass Google Search entirely for maximum accuracy
// ═══════════════════════════════════════════════════════════════════════════

interface BrandMapping {
  patterns: string[]; // Brand name patterns to match (lowercase)
  domain: string;     // Official domain
  productUrlPattern?: string; // URL pattern for product pages (uses {slug} placeholder)
  slugify?: (productName: string) => string; // Function to convert product name to URL slug
}

// Default slugify function for Shopify-style URLs
const shopifySlugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Trim hyphens
};

const BRAND_WHITELIST: BrandMapping[] = [
  // Meria brands - with product URL patterns
  {
    patterns: ['meria chai', 'meriachai'],
    domain: 'meriachai.com',
    productUrlPattern: 'https://meriachai.com/products/{slug}',
    slugify: shopifySlugify,
  },
  {
    patterns: ['café meria', 'cafe meria', 'cafemeria'],
    domain: 'cafemeria.com',
  },
  {
    patterns: ['meria botanical', 'meria skin', 'meria cream', 'meria body', 'botanical skin cream'],
    domain: 'meria.us',
  },
  // Add more known brands here as needed
  // {
  //   patterns: ['brand name'],
  //   domain: 'brand.com',
  //   productUrlPattern: 'https://brand.com/products/{slug}',
  //   slugify: shopifySlugify,
  // },
];

// ═══════════════════════════════════════════════════════════════════════════
// TRUSTED MARKETPLACE WHITELIST
// Only show URLs from these domains when brand can be verified in URL/title
// ═══════════════════════════════════════════════════════════════════════════

const TRUSTED_MARKETPLACES = [
  // Major retailers
  'amazon.com',
  'walmart.com',
  'target.com',
  'costco.com',
  'wholefoods.com',
  'wholefoodsmarket.com',
  
  // Health & beauty retailers
  'sephora.com',
  'ulta.com',
  'dermstore.com',
  'cultbeauty.com',
  
  // Natural/organic retailers
  'thrivemarket.com',
  'vitacost.com',
  'iherb.com',
  'naturalgrocers.com',
  
  // Marketplaces
  'etsy.com',
  'ebay.com',
  
  // Grocery delivery
  'instacart.com',
  'freshdirect.com',
];

// ═══════════════════════════════════════════════════════════════════════════
// DOMAINS TO ALWAYS AVOID
// ═══════════════════════════════════════════════════════════════════════════

const BLOCKED_DOMAINS = [
  'pinterest.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'reddit.com',
  'tiktok.com',
  'linkedin.com',
  'quora.com',
  'wikipedia.org', // Good for info but not for buying
  'yelp.com',
  'tripadvisor.com',
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export interface ProductUrlResult {
  url: string;
  title: string;
  source: 'official' | 'retailer' | 'marketplace';
  confidence: number; // 0-1, only return if >= 0.9
}

export interface ProductSearchResult {
  productUrl: ProductUrlResult | null; // Only set if highly confident
  searchUrl: string; // Always set - Google search fallback
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize a string for comparison (lowercase, remove special chars)
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if a string contains another (normalized)
 */
function containsNormalized(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/**
 * Check if brand name appears in URL domain
 */
function brandInDomain(domain: string, brand: string): boolean {
  const normalizedDomain = normalize(domain);
  const normalizedBrand = normalize(brand);
  
  // Brand must be at least 3 chars to avoid false positives
  if (normalizedBrand.length < 3) return false;
  
  return normalizedDomain.includes(normalizedBrand);
}

/**
 * Check if a domain is in the trusted marketplace list
 */
function isTrustedMarketplace(domain: string): boolean {
  const domainLower = domain.toLowerCase();
  return TRUSTED_MARKETPLACES.some(marketplace => 
    domainLower.includes(marketplace) || domainLower.endsWith(marketplace)
  );
}

/**
 * Check if a domain should be blocked
 */
function isBlockedDomain(domain: string): boolean {
  const domainLower = domain.toLowerCase();
  return BLOCKED_DOMAINS.some(blocked => domainLower.includes(blocked));
}

/**
 * Generate a Google search URL for fallback
 */
function generateSearchUrl(productName: string, brand?: string): string {
  const query = brand ? `${brand} ${productName}` : productName;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if we have a whitelisted brand mapping
 * Now returns the actual PRODUCT PAGE URL when possible, not just homepage
 */
function checkBrandWhitelist(productName: string, brand?: string): ProductUrlResult | null {
  const searchText = `${brand || ''} ${productName}`.toLowerCase();
  console.log('🔍 Checking brand whitelist for:', { productName, brand, searchText });
  
  for (const mapping of BRAND_WHITELIST) {
    for (const pattern of mapping.patterns) {
      if (searchText.includes(pattern)) {
        console.log(`✓ Matched whitelist pattern: "${pattern}" for domain ${mapping.domain}`);
        
        // If we have a product URL pattern, try to build the product page URL
        if (mapping.productUrlPattern && mapping.slugify) {
          // Extract just the product name (remove brand from it)
          let cleanProductName = productName;
          for (const p of mapping.patterns) {
            cleanProductName = cleanProductName.toLowerCase().replace(p, '').trim();
          }
          console.log(`  Clean product name after removing patterns: "${cleanProductName}"`);
          
          // If there's still a meaningful product name, build the URL
          if (cleanProductName.length > 2) {
            const slug = mapping.slugify(cleanProductName);
            const productUrl = mapping.productUrlPattern.replace('{slug}', slug);
            console.log(`✓ Built product URL from whitelist: ${productUrl}`);
            return {
              url: productUrl,
              title: `${brand || 'Brand'} - ${productName}`,
              source: 'official',
              confidence: 0.95,
            };
          }
          // Also try with the full product name
          const fullSlug = mapping.slugify(productName);
          const fullProductUrl = mapping.productUrlPattern.replace('{slug}', fullSlug);
          console.log(`✓ Built product URL from whitelist (full name): ${fullProductUrl}`);
          return {
            url: fullProductUrl,
            title: `${brand || 'Brand'} - ${productName}`,
            source: 'official',
            confidence: 0.9,
          };
        }
        
        // Fallback to homepage if no product pattern
        console.log(`  No product URL pattern, using homepage: https://${mapping.domain}`);
        return {
          url: `https://${mapping.domain}`,
          title: `Official ${brand || 'Brand'} Website`,
          source: 'official',
          confidence: 1.0,
        };
      }
    }
  }
  
  console.log('  No whitelist match found');
  return null;
}

/**
 * Search for a verified product URL
 * Returns null if we can't find a highly confident match
 */
export async function searchProductUrl(
  productName: string,
  brand?: string
): Promise<ProductSearchResult> {
  // Always generate a search fallback URL
  const searchUrl = generateSearchUrl(productName, brand);
  
  // First, check our brand whitelist
  const whitelistMatch = checkBrandWhitelist(productName, brand);
  if (whitelistMatch) {
    console.log('✓ Found whitelisted brand:', whitelistMatch.url);
    return {
      productUrl: whitelistMatch,
      searchUrl,
    };
  }
  
  // If no brand provided, we can't verify matches - return null
  if (!brand || brand.trim().length < 2) {
    console.log('✗ No brand provided, cannot verify search results');
    return { productUrl: null, searchUrl };
  }
  
  try {
    // Search Google - prioritize product pages by including "product" in query
    const query = `${brand} ${productName} product page buy`;
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodedQuery}&num=10`;
    
    console.log('Searching for product page:', query);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('Google Search API error:', response.status);
      return { productUrl: null, searchUrl };
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log('✗ No search results found');
      return { productUrl: null, searchUrl };
    }
    
    // First pass: Look for actual PRODUCT PAGES (URLs containing /product/, /p/, /shop/, etc.)
    // Check BOTH official brand domains AND trusted marketplaces
    for (const item of data.items) {
      const result: SearchResult = {
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        displayLink: item.displayLink || '',
      };
      
      // Skip blocked domains
      if (isBlockedDomain(result.displayLink)) {
        continue;
      }
      
      // Check if this is a product page URL (not homepage)
      const isProductPage = /\/(product|products|p|shop|item|buy)s?\//.test(result.link.toLowerCase());
      
      // PRIORITY 1: Official brand domain WITH product page URL
      if (brandInDomain(result.displayLink, brand) && isProductPage) {
        console.log('✓ Found official brand PRODUCT PAGE:', result.link);
        return {
          productUrl: {
            url: result.link,
            title: result.title,
            source: 'official',
            confidence: 0.98,
          },
          searchUrl,
        };
      }
      
      // PRIORITY 2: Trusted marketplace product page (like Ulta, Sephora, Amazon)
      if (isTrustedMarketplace(result.displayLink) && isProductPage) {
        const titleHasBrand = containsNormalized(result.title, brand);
        const titleHasProduct = containsNormalized(result.title, productName);
        
        // For marketplaces, verify the listing matches our product
        if (titleHasBrand || titleHasProduct) {
          console.log('✓ Found trusted marketplace PRODUCT PAGE:', result.link);
          return {
            productUrl: {
              url: result.link,
              title: result.title,
              source: 'retailer',
              confidence: 0.95,
            },
            searchUrl,
          };
        }
      }
    }
    
    // Second pass: Accept any official brand domain (even if not product page)
    for (const item of data.items) {
      const result: SearchResult = {
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        displayLink: item.displayLink || '',
      };
      
      // Skip blocked domains
      if (isBlockedDomain(result.displayLink)) {
        continue;
      }
      
      // FALLBACK 1: Is this the brand's official domain?
      if (brandInDomain(result.displayLink, brand)) {
        console.log('✓ Found official brand domain:', result.link);
        return {
          productUrl: {
            url: result.link,
            title: result.title,
            source: 'official',
            confidence: 0.95,
          },
          searchUrl,
        };
      }
      
      // FALLBACK 2: Trusted marketplace listing (any page, not just product)
      if (isTrustedMarketplace(result.displayLink)) {
        // Brand AND product name must appear in the title
        const titleHasBrand = containsNormalized(result.title, brand);
        const titleHasProduct = containsNormalized(result.title, productName);
        
        if (titleHasBrand && titleHasProduct) {
          console.log('✓ Found verified marketplace listing:', result.link);
          return {
            productUrl: {
              url: result.link,
              title: result.title,
              source: 'marketplace',
              confidence: 0.9,
            },
            searchUrl,
          };
        }
      }
    }
    
    // No confident match found
    console.log('✗ No confident match found for:', brand, productName);
    return { productUrl: null, searchUrl };
    
  } catch (error) {
    console.error('Product URL search error:', error);
    return { productUrl: null, searchUrl };
  }
}

/**
 * Search for product information (ingredients, nutrition)
 * This is used to supplement missing data, not for linking
 */
export async function searchProductInfo(
  productName: string,
  brand?: string
): Promise<string | null> {
  try {
    const query = brand 
      ? `${brand} ${productName} ingredients nutrition facts`
      : `${productName} ingredients nutrition facts`;
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodedQuery}&num=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    // Combine snippets for context
    const snippets = data.items
      .map((item: any) => item.snippet || '')
      .filter((s: string) => s.length > 0)
      .join(' ');
    
    return snippets;
  } catch (error) {
    console.error('Product info search error:', error);
    return null;
  }
}

/**
 * Get display label for URL source
 */
export function getUrlSourceLabel(source: 'official' | 'retailer' | 'marketplace'): string {
  switch (source) {
    case 'official':
      return 'Official Site';
    case 'retailer':
      return 'Trusted Retailer';
    case 'marketplace':
      return 'Verified Listing';
    default:
      return 'Product Page';
  }
}

/**
 * Result of ingredient fetching attempt
 */
export interface IngredientFetchResult {
  success: boolean;
  ingredients: string | null;
  source: string | null;  // e.g., "ulta.com", "sephora.com"
  claims: string[];
  description: string | null;
  error?: string;
}

/**
 * Fetch and extract product information from a URL
 * Returns ingredients, description, and other relevant product details
 * This is the PRIMARY method for getting verified ingredients
 */
export async function fetchProductPageContent(url: string): Promise<IngredientFetchResult> {
  const domain = extractDomain(url);
  console.log(`🔍 Fetching ingredients from ${domain}...`);
  
  try {
    // Use a CORS proxy for client-side fetching
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch product page:', response.status);
      return {
        success: false,
        ingredients: null,
        source: null,
        claims: [],
        description: null,
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    
    // Try retailer-specific extraction first
    let ingredients = extractIngredientsRetailerSpecific(html, domain);
    
    // Fall back to generic extraction if retailer-specific failed
    if (!ingredients) {
      const textContent = extractTextFromHTML(html);
      ingredients = extractIngredientsGeneric(html, textContent);
    }
    
    // Extract other info
    const textContent = extractTextFromHTML(html);
    const description = extractDescription(html, textContent);
    const claims = extractClaims(textContent);
    
    if (ingredients) {
      console.log(`✅ Successfully extracted ingredients from ${domain}`);
      console.log(`   Found ${ingredients.split(',').length} ingredients`);
      return {
        success: true,
        ingredients,
        source: domain,
        claims,
        description,
      };
    } else {
      console.log(`⚠️ Could not find ingredients on ${domain}`);
      return {
        success: false,
        ingredients: null,
        source: domain,
        claims,
        description,
        error: 'Ingredients section not found on page',
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching product page:', error);
    return {
      success: false,
      ingredients: null,
      source: null,
      claims: [],
      description: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Retailer-specific ingredient extraction
 * Each major retailer has different HTML structures
 */
function extractIngredientsRetailerSpecific(html: string, domain: string): string | null {
  
  // ULTA - ingredients are in a specific accordion/tab section
  if (domain.includes('ulta.com')) {
    console.log('   Using Ulta-specific extraction...');
    
    // Ulta often has ingredients in a data attribute or specific div
    const patterns = [
      // Look for ingredients in product details section
      /Ingredients[\s\S]*?<[^>]*>(Water[\s\S]*?)<\/[^>]*>/i,
      // Look for INCI list pattern (starts with Water/Aqua usually)
      /(Water \(Aqua\)[^<]+(?:,[^<]+)+)/i,
      /(Aqua[^<]+(?:,[^<]+)+)/i,
      // Generic ingredients pattern for Ulta
      /(?:Ingredients|INGREDIENTS)\s*[:\s]*((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*\([^)]+\))?\s*,\s*)+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*\([^)]+\))?\.?)/,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  // SEPHORA - ingredients typically in a tab or expandable section
  if (domain.includes('sephora.com')) {
    console.log('   Using Sephora-specific extraction...');
    
    const patterns = [
      // Sephora ingredient list pattern
      /(?:Ingredients|INGREDIENTS)\s*[-:]\s*((?:[A-Za-z][a-z]*(?:\s+[A-Za-z][a-z]*)*(?:\s*[\(\)\/\-\d]+[^,]*)?(?:,\s*)?)+)/i,
      // Look for the clean ingredients section
      /"ingredients"\s*:\s*"([^"]+)"/i,
      // JSON-LD data
      /"description"[^}]*"ingredients"\s*:\s*"([^"]+)"/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  // AMAZON - ingredients in product description or A+ content
  if (domain.includes('amazon.com')) {
    console.log('   Using Amazon-specific extraction...');
    
    const patterns = [
      /Ingredients\s*[:\s]*((?:[A-Z][a-z]+[^,]*,\s*)+[A-Z][a-z]+[^<]*)/i,
      /"ingredients"\s*:\s*"([^"]+)"/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  // TARGET - similar structure to Ulta
  if (domain.includes('target.com')) {
    console.log('   Using Target-specific extraction...');
    
    const patterns = [
      /(?:Ingredients|INGREDIENTS)\s*[:\s]*((?:[A-Z][a-z]+[^,]*,\s*)+[A-Z][a-z]+[^<]*)/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  // PEACHANDLILY.COM - brand's own site
  if (domain.includes('peachandlily.com')) {
    console.log('   Using Peach & Lily site-specific extraction...');
    
    const patterns = [
      /(?:Ingredients|Full Ingredients?|INCI)\s*[:\s]*(Water[^<]+)/i,
      /(?:Ingredients|Full Ingredients?|INCI)\s*[:\s]*(Aqua[^<]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  // MERIACHAI.COM - Meria's own chai brand site
  if (domain.includes('meriachai.com')) {
    console.log('   Using Meria Chai site-specific extraction...');
    
    const patterns = [
      // Look for ingredients section
      /(?:Ingredients|INGREDIENTS)\s*[:\s]*([^<]+(?:,\s*[^<]+)+)/i,
      // Look for "Made with" pattern common on food sites
      /(?:Made\s+with|Contains)\s*[:\s]*([^<]+(?:,\s*[^<]+)+)/i,
      // JSON-LD data
      /"ingredients"\s*:\s*"([^"]+)"/i,
      // Look for chai-specific ingredients (black tea, spices, etc.)
      /((?:Black Tea|Green Tea|Assam|Ceylon|Darjeeling)[^<]+(?:,\s*[^<]+)+)/i,
      // Spice list pattern
      /((?:Cinnamon|Ginger|Cardamom|Clove|Black Pepper)[^<]+(?:,\s*[^<]+)+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanIngredientString(match[1]);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  return null;
}

/**
 * Generic ingredient extraction (fallback)
 */
function extractIngredientsGeneric(html: string, textContent: string): string | null {
  console.log('   Using generic extraction...');
  
  // Common patterns for ingredients sections
  const textPatterns = [
    // Standard "Ingredients:" followed by list
    /(?:Ingredients|INGREDIENTS)\s*[:\s]*((?:Water|Aqua)[^.]+(?:\.[^.]+)?)/i,
    // Look for INCI-style list (Water/Aqua first, comma-separated)
    /((?:Water|Aqua)\s*(?:\([^)]+\))?\s*,\s*[A-Za-z][^.]{50,})/i,
    // "Made with:" pattern
    /made\s+with\s*:?\s*([^.]+(?:,\s*[^.]+){3,})/i,
    // Generic ingredients pattern
    /ingredients\s*:?\s*((?:[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)*(?:\s*\([^)]+\))?\s*,\s*){5,}[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)*)/i,
    // FOOD-SPECIFIC: Look for common food ingredients
    /ingredients\s*:?\s*((?:Organic\s+)?(?:Black Tea|Green Tea|Sugar|Cane Sugar|Honey|Cinnamon|Ginger)[^<.]*(?:,\s*[^<.]+)+)/i,
    // Food contains pattern
    /contains\s*:?\s*([^<.]+(?:,\s*[^<.]+){2,})/i,
    // Nutrition/ingredients pattern for food products
    /(?:ingredients|made\s+from)\s*[:\s]*([A-Za-z][^<.]*(?:,\s*[A-Za-z][^<.]*){2,})/i,
  ];
  
  for (const pattern of textPatterns) {
    const match = textContent.match(pattern);
    if (match && match[1]) {
      const cleaned = cleanIngredientString(match[1]);
      if (isValidIngredientList(cleaned)) {
        return cleaned;
      }
    }
  }
  
  // Try to find dedicated ingredients section in HTML
  const htmlPatterns = [
    /<(?:div|section|p)[^>]*(?:class|id)="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|p)>/gi,
    /<(?:div|section)[^>]*data-[^=]*="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
  ];
  
  for (const pattern of htmlPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const sectionText = extractTextFromHTML(match[1]);
        const cleaned = cleanIngredientString(sectionText);
        if (isValidIngredientList(cleaned)) {
          return cleaned;
        }
      }
    }
  }
  
  return null;
}

/**
 * Clean up an ingredient string
 */
function cleanIngredientString(str: string): string {
  return str
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\n/g, ' ')            // Remove newlines
    .replace(/\t/g, ' ')            // Remove tabs
    .replace(/\s*,\s*/g, ', ')      // Normalize comma spacing
    .replace(/\.+$/, '')            // Remove trailing periods
    .replace(/^\s+|\s+$/g, '')      // Trim
    .replace(/\s{2,}/g, ' ');       // Remove double spaces
}

/**
 * Validate that a string looks like a real ingredient list
 */
function isValidIngredientList(str: string): boolean {
  if (!str) return false;
  
  // Must have commas (ingredient lists are comma-separated)
  const commaCount = (str.match(/,/g) || []).length;
  if (commaCount < 3) return false;
  
  // Must be reasonable length
  if (str.length < 30 || str.length > 5000) return false;
  
  // Should contain common cosmetic/food ingredient patterns
  const commonIngredients = [
    'water', 'aqua', 'glycerin', 'acid', 'extract', 'oil', 'butter',
    'sodium', 'potassium', 'vitamin', 'alcohol', 'fragrance'
  ];
  
  const strLower = str.toLowerCase();
  const hasCommonIngredient = commonIngredients.some(ing => strLower.includes(ing));
  
  return hasCommonIngredient;
}

/**
 * Extract readable text from HTML
 */
function extractTextFromHTML(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
  
  // Remove HTML tags but keep content
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract product description from page content
 */
function extractDescription(html: string, textContent: string): string | undefined {
  // Look for meta description
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  if (metaMatch && metaMatch[1] && metaMatch[1].length > 50) {
    return metaMatch[1];
  }
  
  // Look for og:description
  const ogMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                  html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);
  if (ogMatch && ogMatch[1] && ogMatch[1].length > 50) {
    return ogMatch[1];
  }
  
  // Look for product description sections
  const descPatterns = [
    /<(?:div|section)[^>]*class="[^"]*(?:product-description|description|about)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const desc = extractTextFromHTML(match[1]);
      if (desc.length > 50 && desc.length < 1000) {
        return desc;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract clean/health claims from page content
 */
function extractClaims(textContent: string): string[] {
  const claims: string[] = [];
  const textLower = textContent.toLowerCase();
  
  const claimPatterns = [
    { pattern: /organic/i, claim: 'Organic' },
    { pattern: /no sugar|sugar.?free|zero sugar/i, claim: 'No Sugar' },
    { pattern: /no artificial/i, claim: 'No Artificial Ingredients' },
    { pattern: /no preservatives/i, claim: 'No Preservatives' },
    { pattern: /no additives/i, claim: 'No Additives' },
    { pattern: /no fillers/i, claim: 'No Fillers' },
    { pattern: /non.?gmo/i, claim: 'Non-GMO' },
    { pattern: /gluten.?free/i, claim: 'Gluten-Free' },
    { pattern: /vegan/i, claim: 'Vegan' },
    { pattern: /dairy.?free/i, claim: 'Dairy-Free' },
    { pattern: /keto/i, claim: 'Keto-Friendly' },
    { pattern: /paleo/i, claim: 'Paleo-Friendly' },
    { pattern: /whole.?30/i, claim: 'Whole30 Approved' },
    { pattern: /no seed oils/i, claim: 'No Seed Oils' },
    { pattern: /clean ingredients?/i, claim: 'Clean Ingredients' },
    { pattern: /lead.?tested/i, claim: 'Lead-Tested' },
    { pattern: /third.?party tested/i, claim: 'Third-Party Tested' },
    { pattern: /lab.?tested/i, claim: 'Lab Tested' },
  ];
  
  for (const { pattern, claim } of claimPatterns) {
    if (pattern.test(textContent)) {
      claims.push(claim);
    }
  }
  
  return claims;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEEP SEARCH - More thorough ingredient search when quick search fails
// ═══════════════════════════════════════════════════════════════════════════

export interface DeepSearchResult {
  success: boolean;
  ingredients: string | null;
  source: string | null;
  productUrl: string | null;
  searchesPerformed: number;
  urlsChecked: number;
}

/**
 * Deep search for ingredients - tries multiple strategies
 * This is slower but more thorough than the quick search
 */
export async function deepSearchForIngredients(
  productName: string,
  brand?: string,
  onProgress?: (status: string) => void
): Promise<DeepSearchResult> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DEEP SEARCH INITIATED');
  console.log(`Product: ${productName}`);
  console.log(`Brand: ${brand || 'Unknown'}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  let searchesPerformed = 0;
  let urlsChecked = 0;
  
  // Different search query strategies
  const searchQueries = [
    // Most specific
    brand ? `${brand} ${productName} ingredients list` : `${productName} ingredients list`,
    brand ? `${brand} ${productName} INCI` : `${productName} INCI ingredients`,
    brand ? `"${brand}" "${productName}" ingredients` : `"${productName}" ingredients`,
    // Retailer-focused
    brand ? `${brand} ${productName} site:ulta.com` : `${productName} site:ulta.com`,
    brand ? `${brand} ${productName} site:sephora.com` : `${productName} site:sephora.com`,
    brand ? `${brand} ${productName} site:amazon.com` : `${productName} site:amazon.com`,
    // Brand site focused
    brand ? `${brand} ${productName} site:${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null,
  ].filter(Boolean) as string[];
  
  const checkedUrls = new Set<string>();
  
  for (const query of searchQueries) {
    onProgress?.(`Searching: "${query.substring(0, 40)}..."`);
    console.log(`\n🔎 Trying query: ${query}`);
    searchesPerformed++;
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodedQuery}&num=5`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.log(`   ❌ Search API error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('   No results');
        continue;
      }
      
      // Check each result
      for (const item of data.items) {
        const url = item.link;
        
        // Skip already checked URLs
        if (checkedUrls.has(url)) continue;
        checkedUrls.add(url);
        
        // Skip blocked domains
        const domain = extractDomain(url);
        if (isBlockedDomain(domain)) continue;
        
        // Prioritize product pages
        const isProductPage = /\/(product|products|p|shop|item|buy|dp)s?\//.test(url.toLowerCase());
        const isTrusted = isTrustedMarketplace(domain) || (brand && brandInDomain(domain, brand));
        
        if (!isProductPage && !isTrusted) {
          console.log(`   Skipping non-product page: ${domain}`);
          continue;
        }
        
        onProgress?.(`Checking ${domain}...`);
        console.log(`   📄 Fetching: ${url}`);
        urlsChecked++;
        
        try {
          const fetchResult = await fetchProductPageContent(url);
          
          if (fetchResult.success && fetchResult.ingredients) {
            console.log(`   ✅ FOUND INGREDIENTS on ${domain}!`);
            return {
              success: true,
              ingredients: fetchResult.ingredients,
              source: fetchResult.source,
              productUrl: url,
              searchesPerformed,
              urlsChecked,
            };
          } else {
            console.log(`   ❌ No ingredients found on ${domain}`);
          }
        } catch (fetchError) {
          console.log(`   ❌ Fetch error for ${domain}:`, fetchError);
        }
      }
    } catch (searchError) {
      console.log(`   ❌ Search error:`, searchError);
    }
    
    // Small delay between searches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // If we still haven't found anything, try some direct retailer URLs
  if (brand) {
    const directUrls = [
      `https://www.ulta.com/search/${encodeURIComponent(brand + ' ' + productName)}`,
      `https://www.sephora.com/search?keyword=${encodeURIComponent(brand + ' ' + productName)}`,
    ];
    
    onProgress?.('Checking major retailers directly...');
    
    for (const url of directUrls) {
      if (checkedUrls.has(url)) continue;
      checkedUrls.add(url);
      
      const domain = extractDomain(url);
      console.log(`   📄 Direct check: ${domain}`);
      urlsChecked++;
      
      try {
        const fetchResult = await fetchProductPageContent(url);
        
        if (fetchResult.success && fetchResult.ingredients) {
          console.log(`   ✅ FOUND INGREDIENTS on ${domain}!`);
          return {
            success: true,
            ingredients: fetchResult.ingredients,
            source: fetchResult.source,
            productUrl: url,
            searchesPerformed,
            urlsChecked,
          };
        }
      } catch (e) {
        console.log(`   ❌ Direct fetch failed for ${domain}`);
      }
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`❌ DEEP SEARCH COMPLETE - No ingredients found`);
  console.log(`   Searches performed: ${searchesPerformed}`);
  console.log(`   URLs checked: ${urlsChecked}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  return {
    success: false,
    ingredients: null,
    source: null,
    productUrl: null,
    searchesPerformed,
    urlsChecked,
  };
}
