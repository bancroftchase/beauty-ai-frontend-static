// ============== CONFIG ==============
const CONFIG = {
  CORS_PROXY: 'https://api.allorigins.win/raw?url=',
  API_URL: 'https://beauty-ai-backend.onrender.com',
  PRODUCTS_PER_PAGE: 12,
  DEFAULT_REGION: 'Mexico' // Priority region
};

// ========== GLOBAL PRODUCT DATA ==========
const GLOBAL_PRODUCTS = {
  Mexico: [
    {
      id: "mx-1",
      name: "Bolden Hydrating Facial Cleanser",
      category: "Skincare",
      description: "Aloe vera cleanser for all skin types",
      price: "150-250 MXN",
      brand: "Bolden",
      country: "Mexico",
      image: "https://i.imgur.com/JQWp3RQ.png"
    },
    {
      id: "mx-2",
      name: "Bissú Matte Lipstick",
      category: "Makeup",
      description: "Long-lasting matte finish",
      price: "80-150 MXN",
      brand: "Bissú",
      country: "Mexico",
      image: "https://i.imgur.com/YJq5KP0.png"
    }
  ],
  France: [
    {
      id: "fr-1",
      name: "La Roche-Posay Effaclar",
      category: "Skincare",
      description: "Acne treatment cleanser",
      price: "€15-€25",
      brand: "La Roche-Posay",
      country: "France",
      image: "https://i.imgur.com/fZy5Y0z.png"
    }
  ]
};

// ========== CORE APP ==========
let state = {
  products: [],
  displayed: 0,
  isLoading: false,
  basketCount: parseInt(localStorage.getItem('basketCount')) || 0
};

// Initialize app
function init() {
  updateBasketUI();
  setupEventListeners();
  fetchProducts(); // Load default Mexican products first
}

// ========== PRODUCT FETCHING ==========
async function fetchProducts(query = '') {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  showLoadingMessage(query);
  state.isLoading = true;

  try {
    // 1. Try API if query exists
    if (query) {
      const apiProducts = await fetchFromAPI(query);
      if (apiProducts.length) {
        state.products = apiProducts;
        renderProducts();
        return;
      }
    }

    // 2. Fallback to local data
    const localProducts = getLocalProducts(query);
    if (localProducts.length) {
      state.products = localProducts;
      renderProducts();
    } else {
      showError("No products found. Try 'skincare' or 'makeup'");
    }

  } catch (error) {
    console.error("Fetch error:", error);
    showError("Connection issue. Showing local products.");
    state.products = getLocalProducts();
    renderProducts();
  } finally {
    state.isLoading = false;
  }
}

async function fetchFromAPI(query) {
  try {
    const url = `${CONFIG.API_URL}/api/products/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(`${CONFIG.CORS_PROXY}${encodeURIComponent(url)}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
  } catch (error) {
    console.warn("API failed, using local data");
    return [];
  }
  return [];
}

function getLocalProducts(query = '') {
  const searchTerm = query.toLowerCase();
  
  // Priority: Mexican products when empty or matching
  if (!query || searchTerm.includes('mexico')) {
    return GLOBAL_PRODUCTS.Mexico || [];
  }

  // Search other regions
  return Object.values(GLOBAL_PRODUCTS)
    .flat()
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      product.description.toLowerCase().includes(searchTerm)
    );
}

// ========== RENDERING ==========
function renderProducts() {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  // Clear existing if first render
  if (state.displayed === 0) {
    productList.innerHTML = '';
  }

  // Get next batch
  const batch = state.products.slice(
    state.displayed, 
    state.displayed + CONFIG.PRODUCTS_PER_PAGE
  );
  state.displayed += batch.length;

  // Render products
  batch.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" 
           loading="lazy" 
           alt="${product.name}"
           onerror="this.src='https://i.imgur.com/YJq5KP0.png'">
      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <p class="description">${escapeHtml(product.description)}</p>
        <div class="meta">
          <span class="price">${product.price}</span>
          <span class="country">${product.country}</span>
        </div>
        <button onclick="addToBasket('${product.id}')">
          Add to Basket
        </button>
      </div>
    `;
    productList.appendChild(card);
  });

  // Setup lazy loading observer
  if (state.displayed < state.products.length) {
    setupLazyLoadObserver();
  }
}

function setupLazyLoadObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !state.isLoading) {
      renderProducts();
    }
  }, { threshold: 0.5 });

  const sentinel = document.querySelector('.product-card:last-child');
  if (sentinel) observer.observe(sentinel);
}

// ========== UI HELPERS ==========
function showLoadingMessage(query) {
  const messages = [
    `Finding beauty products...`,
    `Searching for ${query || CONFIG.DEFAULT_REGION}...`,
    `Checking our global collection...`
  ];
  typewriter('search-message', messages[Math.floor(Math.random() * messages.length)]);
}

function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `❌ ${message}`;
  
  const productList = document.getElementById('product-list');
  if (productList) {
    productList.prepend(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
  }
}

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

// ========== BASKET FUNCTIONS ==========
function addToBasket(productId) {
  const product = [...GLOBAL_PRODUCTS.Mexico, ...GLOBAL_PRODUCTS.France]
    .find(p => p.id === productId);
  
  if (!product) return;

  const basket = JSON.parse(localStorage.getItem('basket') || [];
  basket.push({
    id: product.id,
    name: product.name,
    price: product.price,
    addedAt: new Date().toISOString()
  });
  
  localStorage.setItem('basket', JSON.stringify(basket));
  state.basketCount = basket.length;
  updateBasketUI();
  showNotification(`Added ${product.name} to basket!`);
}

function updateBasketUI() {
  const basketEl = document.getElementById('basket-count');
  if (basketEl) basketEl.textContent = state.basketCount;
}

function showNotification(message) {
  // Your existing notification code
}

// ========== UTILITIES ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      if (!state.isLoading) fetchProducts(searchInput.value.trim());
    }, 300));
  }
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
