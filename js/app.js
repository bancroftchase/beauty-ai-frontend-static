let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedProduct = null;

function updateCartCount() {
  document.getElementById('cartCount').textContent = cart.length;
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
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalBrand').textContent = `Brand: ${product.brand}`;
  document.getElementById('modalPrice').textContent = `Price: $${Number(product.price).toFixed(2)}`;
  document.getElementById('modalDescription').textContent = product.description;
  document.getElementById('modalCountry').textContent = `Country: ${product.country}`;
  document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('productModal').style.display = 'none';
  selectedProduct = null;
}

async function fetchProducts(query, containerId, statsId) {
  const container = document.getElementById(containerId);
  const statsElement = document.getElementById(statsId);
  container.innerHTML = `<p>Loading ${query} products from live backend...</p>`;

  try {
    const response = await fetch(`https://beauty-ai-backend.onrender.com/api/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
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

    statsElement.textContent = `${data.stats.productCount} Products • ${data.stats.brandCount} Brands • ${data.stats.countryCount} Countries`;
  } catch (error) {
    console.error(`Error fetching ${query} products:`, error);
    container.innerHTML = `<p>Failed to load ${query} products. Please try again.</p>`;
    statsElement.textContent = 'Error: undefined';
  }
}

// Initialize cart count and fetch products on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  // Example: Fetch for specific pages
  if (document.getElementById('kbeauty-products')) {
    fetchProducts('k-beauty', 'kbeauty-products', 'kbeauty-stats');
  }
  if (document.getElementById('antiaging-products')) {
    fetchProducts('anti-aging', 'antiaging-products', 'antiaging-stats');
  }
  if (document.getElementById('global-products')) {
    fetchProducts('global', 'global-products', 'global-stats');
  }
});
