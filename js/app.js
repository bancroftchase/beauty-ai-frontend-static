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
    alert(`${selectedProduct.name || 'Product'} added to cart!`);
    closeModal();
  }
}

function openModal(product) {
  selectedProduct = product;
  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('modalName').textContent = product.name || 'Unknown Product';
  document.getElementById('modalBrand').textContent = `Brand: ${product.brand || 'Unknown'}`;
  document.getElementById('modalPrice').textContent = `Price: $${Number(product.price || 0).toFixed(2)}`;
  document.getElementById('modalDescription').textContent = product.description || 'No description';
  document.getElementById('modalCountry').textContent = `Country: ${product.country || 'Unknown'}`;
  modal.style.display = 'block';
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
    console.error(`Container (${containerId}) or stats (${statsId}) not found`);
    return;
  }
  container.innerHTML = `<p>Loading ${query} products...</p>`;
  statsElement.textContent = '';

  try {
    const response = await fetch(`https://beauty-ai-backend.onrender.com/api/products/search?q=${encodeURIComponent(query)}`, {
      timeout: 10000,
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error('Invalid product data');
    }

    container.innerHTML = data.products.length > 0 ?
      data.products.map(product => `
        <div class="product-card">
          <h3>${product.name || 'Unknown Product'}</h3>
          <p>Brand: ${product.brand || 'Unknown'}</p>
          <p>Price: $${Number(product.price || 0).toFixed(2)}</p>
          <p>${product.description || 'No description'}</p>
          <button onclick="openModal(${JSON.stringify(product)})">View Details</button>
        </div>
      `).join('') :
      `<p>No ${query} products found.</p>`;

    statsElement.textContent = `${data.stats?.productCount || 0} Products • ${data.stats?.brandCount || 0} Brands • ${data.stats?.countryCount || 0} Countries`;
  } catch (error) {
    console.error(`Failed to load ${query} products: ${error.message}`);
    container.innerHTML = `<p>Unable to load ${query} products. Please try again.</p>`;
    statsElement.textContent = 'Error: Server unavailable';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  if (document.getElementById('global-products')) {
    fetchProducts('global', 'global-products', 'global-stats');
  }
  if (document.getElementById('antiaging-products')) {
    fetchProducts('anti-aging', 'antiaging-products', 'antiaging-stats');
  }
});
