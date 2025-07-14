// ======================
// 1. CONFIGURATION
// ======================
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const API_URL = 'https://beauty-ai-backend.onrender.com';
const PRODUCTS_PER_PAGE = 20;

// Global fallback products (embedded JSON)
const GLOBAL_PRODUCTS = {
  "Mexico": [
    {
      id: "mx-1",
      name: "Bolden Hydrating Facial Cleanser",
      category: "Skincare",
      description: "Gentle cleanser with aloe vera",
      price: "150-250 MXN",
      brand: "Bolden",
      country: "Mexico",
      image: "https://i.imgur.com/JQWp3RQ.png"
    },
    {
      id: "mx-2",
      name: "Bissú Liquid Foundation",
      category: "Makeup",
      description: "Medium-coverage foundation",
      price: "120-200 MXN",
      brand: "Bissú",
      country: "Mexico",
      image: "https://i.imgur.com/YJq5KP0.png"
    }
  ],
  "France": [
    {
      id: "fr-1",
      name: "La Roche-Posay Effaclar Cleanser",
      category: "Skincare",
      description: "Dermatologist-approved for acne-prone skin",
      price: "€15-€25",
      brand: "La Roche-Posay",
      country: "France",
      image: "https://i.imgur.com/fZy5Y0z.png"
    }
  ],
  "Russia": [
    {
      id: "ru-1",
      name: "Natura Siberica Hand Cream",
      category: "Skincare",
      description: "Organic Siberian herbs for dry skin",
      price: "₽500-₽800",
      brand: "Natura Siberica",
      country: "Russia",
      image: "https://i.imgur.com/vKb5F7t.png"
    }
  ],
  "China": [
    {
      id: "cn-1",
      name: "Florasis Blooming Rouge Lipstick",
      category: "Makeup",
      description: "Luxury Chinese makeup with intricate packaging",
      price: "¥150-¥300",
      brand: "Florasis",
      country: "China",
      image: "https://i.imgur.com/8R7Qn2E.png"
    }
  ]
};

// ======================
// 2. CORE VARIABLES
// ======================
let currentProducts = [];
let displayedProducts = 0;
let isLoading = false;
let basketCount = parseInt(localStorage.getItem('basketCount') || '0');

// ======================
// 3. INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', () => {
  updateBasketUI();
  fetchProducts('global'); // Load initial products
  setupEventListeners();
});

// ======================
// 4. PRODUCT FETCHING
// ======================
async function fetchProducts(query) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  // Show animated search message
  typewriter('search-message', `🔍 Searching for "${query || 'global beauty products'}"...`);

  try {
    // Try API first
    const apiUrl = `${API_URL}/api/products/search?q=${encodeURIComponent(query || 'global')}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(apiUrl)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.products?.length > 0) {
        currentProducts = data.products;
        resetProductList();
        return;
      }
    }
    
    // Fallback to global JSON
    console.log("Using fallback product data");
    currentProducts = Object.values(GLOBAL_PRODUCTS).flat();
    resetProductList();

  } catch (error) {
    console.error("Fetch error:", error);
    showError("⚠️ Connection issue. Showing fallback products.");
    currentProducts = Object.values(GLOBAL_PRODUCTS).flat();
    resetProductList();
  }
}

// ======================
// 5. PRODUCT RENDERING (WITH LAZY LOAD)
// ======================
function resetProductList() {
  const productList = document.getElementById('product-list');
  if (!productList) return;
  
  productList.innerHTML = '';
  displayedProducts = 0;
  renderProducts();
}

function renderProducts() {
  const productList = document.getElementById('product-list');
  if (!productList || isLoading) return;

  isLoading = true;
  const batch = currentProducts.slice(displayedProducts, displayedProducts + PRODUCTS_PER_PAGE);
  displayedProducts += batch.length;

  batch.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image || 'https://i.imgur.com/YJq5KP0.png'}" 
           loading="lazy" 
           onerror="this.src='https://i.imgur.com/YJq5KP0.png'">
      <h3>${escapeHtml(product.name)}</h3>
      <p class="product-description">${escapeHtml(product.description)}</p>
      <div class="product-meta">
        <span class="product-price">${product.price}</span>
        <span class="product-country">${product.country || ''}</span>
      </div>
      <button class="add-to-basket" 
              onclick="addToBasket('${product.id}', '${escapeHtml(product.name)}', '${product.price}')">
        Add to Basket
      </button>
    `;
    productList.appendChild(card);
  });

  // Set up intersection observer for lazy loading
  if (displayedProducts < currentProducts.length) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        renderProducts();
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    productList.appendChild(sentinel);
    observer.observe(sentinel);
  }

  isLoading = false;
}

// ======================
// 6. UI ENHANCEMENTS
// ======================
// Typewriter effect
function typewriter(elementId, text, speed = 30) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let i = 0;
  element.textContent = '';
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text[i];
      i++;
    } else {
      clearInterval(timer);
    }
  }, speed);
}

// Error display
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.innerHTML = `❌ ${message}`;
  
  const productList = document.getElementById('product-list');
  if (productList) {
    productList.prepend(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
  }
}

// ======================
// 7. UTILITY FUNCTIONS
// ======================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function updateBasketUI() {
  const basketCountElement = document.getElementById('basket-count');
  if (basketCountElement) {
    basketCountElement.textContent = basketCount;
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') fetchProducts(searchInput.value.trim());
    });
  }
}

// ======================
// 8. BASKET FUNCTIONS (KEEP YOUR EXISTING CODE)
// ======================
function addToBasket(id, name, price) {
  // Your existing basket logic...
}
