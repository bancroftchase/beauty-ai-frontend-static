let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedProduct = null;
let currentTopic = '';

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
  document.getElementById('modalDescription').textContent = product.description || 'No description available';
  document.getElementById('modalCountry').textContent = `Country: ${product.country || 'Unknown'}`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
  selectedProduct = null;
}

async function fetchProducts(query, containerId, statsId, retries = 2) {
  const container = document.getElementById(containerId);
  const statsElement = document.getElementById(statsId);
  if (!container || !statsElement) {
    console.error(`Container (${containerId}) or stats (${statsId}) not found`);
    return;
  }
  container.innerHTML = `<p>Loading ${query} products...</p>`;
  statsElement.textContent = 'Loading...';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://beauty-ai-backend.onrender.com/api/products/search?q=${encodeURIComponent(query)}`, {
        timeout: 10000,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data.products)) {
        throw new Error('Invalid or missing product data');
      }

      if (data.products.length === 0) {
        container.innerHTML = `<p>No ${query} products found.</p>`;
        statsElement.textContent = '0 Products • 0 Brands • 0 Countries';
        return;
      }

      container.innerHTML = data.products.map(product => `
        <div class="product-card">
          <h3>${product.name || 'Unknown Product'}</h3>
          <p>Brand: ${product.brand || 'Unknown'}</p>
          <p>Price: $${Number(product.price || 0).toFixed(2)}</p>
          <p>${product.description || 'No description available'}</p>
          <button onclick="openModal(${JSON.stringify(product)})">View Details</button>
        </div>
      `).join('');

      statsElement.textContent = `${data.stats?.productCount || 0} Products • ${data.stats?.brandCount || 0} Brands • ${data.stats?.countryCount || 0} Countries`;
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${query}: ${error.message}`);
      if (attempt === retries) {
        container.innerHTML = `<p>Failed to load ${query} products. Please try again later.</p>`;
        statsElement.textContent = `Error: ${error.message.includes('503') ? 'Server unavailable' : 'Connection issue'}`;
      }
    }
  }
}

function setTopic(topic) {
  currentTopic = topic;
  addMessage(`Selected topic: ${topic}`, 'system');
}

function addMessage(text, type = 'user') {
  const chatOutput = document.getElementById('chatOutput');
  if (!chatOutput) return;
  const p = document.createElement('p');
  p.className = type;
  p.textContent = text;
  chatOutput.appendChild(p);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function clearChat() {
  const chatOutput = document.getElementById('chatOutput');
  if (chatOutput) {
    chatOutput.innerHTML = '<p>Hi! I\'m your Beauty AI assistant ✨</p>';
    currentTopic = '';
  }
}

async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput?.value.trim();
  if (!message) return;

  addMessage(`You: ${message}`);
  chatInput.value = '';

  try {
    const response = await fetch('https://beauty-ai-backend.onrender.com/api/chat/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: currentTopic || 'beauty consultation' }),
      timeout: 10000,
    });
    const data = await response.json();
    if (data.success) {
      addMessage(`Beauty AI: ${data.response || 'No response received'}`, 'bot');
      if (message.toLowerCase().includes('product') || currentTopic.toLowerCase().includes('beauty')) {
        fetchProducts(message, 'search-products', 'search-stats');
      }
    } else {
      addMessage(`Error: ${data.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    addMessage(`Error: Failed to connect to backend - ${error.message}`, 'error');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  if (document.getElementById('chatInput')) {
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  const pages = [
    { query: 'k-beauty', container: 'kbeauty-products', stats: 'kbeauty-stats' },
    { query: 'anti-aging', container: 'antiaging-products', stats: 'antiaging-stats' },
    { query: 'global', container: 'global-products', stats: 'global-stats' },
    { query: 'eye care', container: 'eyecare-products', stats: 'eyecare-stats' },
    { query: 'tanning', container: 'tanning-products', stats: 'tanning-stats' },
    { query: 'eyelashes', container: 'eyelashes-products', stats: 'eyelashes-stats' },
    { query: 'lip products', container: 'lipproducts-products', stats: 'lipproducts-stats' },
  ];
  pages.forEach(({ query, container, stats }) => {
    if (document.getElementById(container)) {
      fetchProducts(query, container, stats);
    }
  });
});
