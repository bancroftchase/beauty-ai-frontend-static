let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedProduct = null;

function updateCartCount() {
  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = cart.length;
}

function addToCartFromModal() {
  if (selectedProduct) {
    cart.push(selectedProduct);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${selectedProduct.name} added to cart!`);
    closeModal();
  }
}

function openModal(product) {
  selectedProduct = product;
  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalBrand').textContent = `Brand: ${product.brand}`;
  document.getElementById('modalPrice').textContent = `Price: $${Number(product.price).toFixed(2)}`;
  document.getElementById('modalDescription').textContent = product.description;
  document.getElementById('modalCountry').textContent = `Country: ${product.country}`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
  selectedProduct = null;
}

async function fetchProducts(query, containerId, statsId) {
  const container = document.getElementById(containerId);
  const statsElement = document.getElementById(statsId);
  if (!container || !statsElement) {
    console.error(`Container (${containerId}) or stats (${statsId}) element not found`);
    return;
  }
  container.innerHTML = `<p>Loading ${query} products from live backend...</p>`;
  statsElement.textContent = 'Loading...';

  try {
    const response = await fetch(`https://beauty-ai-backend.onrender.com/api/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid product data received');
    }

    if (data.products.length === 0) {
      container.innerHTML = `<p>No ${query} products found.</p>`;
      statsElement.textContent = '0 Products • 0 Brands • 0 Countries';
      return;
    }

    container.innerHTML = data.products.map(product => `
      <div class="product-card">
        <h3>${product.name}</h3>
        <p>Brand: ${product.brand}</p>
        <p>Price: $${Number(product.price).toFixed(2)}</p>
        <p>${product.description}</p>
        <button onclick="openModal(${JSON.stringify(product)})">View Details</button>
      </div>
    `).join('');

    statsElement.textContent = `${data.stats?.productCount || 0} Products • ${data.stats?.brandCount || 0} Brands • ${data.stats?.countryCount || 0} Countries`;
  } catch (error) {
    console.error(`Error fetching ${query} products:`, error.message);
    container.innerHTML = `<p>Failed to load ${query} products. Please try again.</p>`;
    statsElement.textContent = `Error: ${error.message}`;
  }
}

// Initialize cart and fetch products
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  if (document.getElementById('kbeauty-products')) {
    fetchProducts('k-beauty', 'kbeauty-products', 'kbeauty-stats');
  }
  if (document.getElementById('antiaging-products')) {
    fetchProducts('anti-aging', 'antiaging-products', 'antiaging-stats');
  }
  if (document.getElementById('global-products')) {
    fetchProducts('global', 'global-products', 'global-stats');
  }
  if (document.getElementById('eyecare-products')) {
    fetchProducts('eye care', 'eyecare-products', 'eyecare-stats');
  }
  if (document.getElementById('tanning-products')) {
    fetchProducts('tanning', 'tanning-products', 'tanning-stats');
  }
  if (document.getElementById('eyelashes-products')) {
    fetchProducts('eyelashes', 'eyelashes-products', 'eyelashes-stats');
  }
  if (document.getElementById('lipproducts-products')) {
    fetchProducts('lip products', 'lipproducts-products', 'lipproducts-stats');
  }
});
