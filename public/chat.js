// ======================
// 1. CONFIGURATION & FALLBACK DATA
// ======================
const FALLBACK_PRODUCTS = {
  regions: [
    // Mexico
    {
      name: "Mexico",
      products: [
        {
          id: "mx-1",
          name: "Bolden Hydrating Facial Cleanser",
          category: "Skincare",
          description: "Gentle cleanser with aloe vera",
          price: "150-250 MXN",
          brand: "Bolden",
          country: "Mexico",
          image: "https://i.imgur.com/JQWp3RQ.png" // Placeholder
        }
        // Add more Mexican products...
      ]
    },
    // France (Paris)
    {
      name: "France",
      products: [
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
      ]
    },
    // Russia
    {
      name: "Russia",
      products: [
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
      ]
    },
    // China
    {
      name: "China",
      products: [
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
    },
    // South America
    {
      name: "South America",
      products: [
        {
          id: "sa-1",
          name: "Natura Ekos Açaí Body Lotion",
          category: "Skincare",
          description: "Amazonian ingredients for hydration",
          price: "R$40-R$70",
          brand: "Natura",
          country: "Brazil",
          image: "https://i.imgur.com/3sTqW9L.png"
        }
      ]
    },
    // Africa
    {
      name: "Africa",
      products: [
        {
          id: "af-1",
          name: "African Black Soap",
          category: "Skincare",
          description: "Traditional cleansing soap with shea butter",
          price: "$5-$10",
          brand: "Alaffia",
          country: "Nigeria",
          image: "https://i.imgur.com/L4j2BvP.png"
        }
      ]
    },
    // Germany
    {
      name: "Germany",
      products: [
        {
          id: "de-1",
          name: "Weleda Skin Food",
          category: "Skincare",
          description: "Cult-favorite hydrating cream",
          price: "€12-€20",
          brand: "Weleda",
          country: "Germany",
          image: "https://i.imgur.com/9ZqQY7h.png"
        }
      ]
    }
  ]
};

// ======================
// 2. LAZY LOADING IMPLEMENTATION
// ======================
let isLoading = false;

async function lazyLoadProducts() {
  if (isLoading || displayedProducts >= currentProducts.length) return;
  
  isLoading = true;
  document.querySelector('.load-more-button').textContent = "Loading...";
  
  // Simulate network delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 800));
  
  renderProducts();
  isLoading = false;
}

// Intersection Observer for infinite scroll
function initInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      lazyLoadProducts();
    }
  }, { threshold: 0.1 });

  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  document.getElementById('product-list').appendChild(sentinel);
  observer.observe(sentinel);
}

// ======================
// 3. TYPEWRITER EFFECT (OPTIONAL)
// ======================
function typewriterEffect(element, text, speed = 30) {
  let i = 0;
  element.textContent = '';
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
    }
  }, speed);
}

// Initialize on search
function showSearchingMessage() {
  const messageElement = document.getElementById('search-message');
  if (messageElement) {
    typewriterEffect(messageElement, "🔍 Searching for global beauty products...");
  }
}

// ======================
// 4. IMAGE HANDLING
// ======================
// Placeholder images are already included in FALLBACK_PRODUCTS
// Use this for broken images:
function handleImageError(img) {
  img.src = "https://i.imgur.com/YJq5KP0.png"; // Generic placeholder
  img.alt = "Product image not available";
}

// Update renderProducts() to include error handling:
// `<img src="${product.image}" onerror="handleImageError(this)">`
