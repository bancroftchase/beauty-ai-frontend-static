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

function openProductPage() {
  if (selectedProduct) {
    const productPage = document.createElement('div');
    productPage.className = 'product-page';
    productPage.innerHTML = `
      <div class="product-page-content">
        <span class="close" onclick="this.parentElement.parentElement.remove()">×</span>
        <h2>${selectedProduct.name || 'Unknown Product'}</h2>
        <p>Brand: ${selectedProduct.brand || 'Unknown'}</p>
        <p>Price: $${selectedProduct.price || '0.00'}</p>
        <p>${selectedProduct.description || 'No description'}</p>
        <p>Country: ${selectedProduct.country || 'Unknown'}</p>
        <button onclick="addToCartFromModal()">Add to Cart</button>
      </div>
    `;
    document.body.appendChild(productPage);
  }
}

function openModal(product) {
  selectedProduct = product;
  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('modalName').textContent = product.name || 'Unknown Product';
  document.getElementById('modalBrand').textContent = `Brand: ${product.brand || 'Unknown'}`;
  document.getElementById('modalPrice').textContent = `Price: $${product.price || '0.00'}`;
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
  container.innerHTML = '<p>Loading products...</p>';
  statsElement.textContent = '';
  try {
    const response = await fetch(`https://beauty-ai-backend.onrender.com/api/products/search?q=${encodeURIComponent(query)}`, {
      timeout: 15000,
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    if (!data.success || !Array.isArray(data.products)) throw new Error('Invalid product data');
    container.innerHTML = data.products.length > 0 ?
      data.products.map(product => `
        <div class="product-card">
          <h3>${product.name || 'Unknown Product'}</h3>
          <p>Brand: ${product.brand || 'Unknown'}</p>
          <p>Price: $${product.price || '0.00'}</p>
          <p>${product.description || 'No description'}</p>
          <button onclick='openModal(${JSON.stringify(product)})'>View Details</button>
          <button onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
        </div>
      `).join('') :
      `<p>No ${query} products available at this time.</p>`;
    statsElement.textContent = `${data.stats?.productCount || 0} Products • ${data.stats?.brandCount || 0} Brands • ${data.stats?.countryCount || 0} Countries`;
  } catch (error) {
    console.error(`Failed to load ${query} products: ${error.message}`);
    container.innerHTML = `<p>Unable to load ${query} products. Please try again later.</p>`;
    statsElement.textContent = 'Error: Server unavailable';
  }
}

function addToCart(product) {
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name || 'Product'} added to cart!`);
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
  p.textContent = '';
  chatOutput.appendChild(p);
  let i = 0;
  function typeWriter() {
    if (i < text.length) {
      p.textContent += text[i];
      i++;
      chatOutput.scrollTop = chatOutput.scrollHeight;
      setTimeout(typeWriter, 20);
    }
  }
  typeWriter();
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
      timeout: 15000,
    });
    const data = await response.json();
    if (data.success) {
      addMessage(`Beauty AI: ${data.response || 'No response received'}`, 'bot');
      fetchProducts(message, 'search-products', 'search-stats');
    } else {
      addMessage(`Error: ${data.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    addMessage(`Error: Failed to connect to backend - ${error.message}`, 'error');
  }
}

function displaySavedProducts() {
  const container = document.getElementById('saved-products');
  const statsElement = document.getElementById('saved-stats');
  if (!container || !statsElement) return;
  container.innerHTML = cart.length > 0 ?
    cart.map(product => `
      <div class="product-card">
        <h3>${product.name || 'Unknown Product'}</h3>
        <p>Brand: ${product.brand || 'Unknown'}</p>
        <p>Price: $${product.price || '0.00'}</p>
        <p>${product.description || 'No description'}</p>
        <button onclick='openModal(${JSON.stringify(product)})'>View Details</button>
        <button onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
      </div>
    `).join('') :
    '<p>No saved products yet.</p>';
  statsElement.textContent = `${cart.length} Products`;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  if (document.getElementById('chatInput')) {
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  const path = window.location.pathname;
  if (path.includes('eyecare.html')) fetchProducts('eye care', 'eyecare-products', 'eyecare-stats');
  else if (path.includes('tanning.html')) fetchProducts('tanning', 'tanning-products', 'tanning-stats');
  else if (path.includes('eyelashes.html')) fetchProducts('eyelashes', 'eyelashes-products', 'eyelashes-stats');
  else if (path.includes('lipproducts.html')) fetchProducts('lip products', 'lipproducts-products', 'lipproducts-stats');
  else if (path.includes('globalbeauty.html')) {
    fetchProducts('global', 'global-products', 'global-stats');
    fetchProducts('anti-aging', 'antiaging-products', 'antiaging-stats');
  } else if (path.includes('viralsocial.html')) {
    fetchProducts('global', 'viralsocial-products', 'viralsocial-stats');
  } else if (path.includes('askme.html')) {
    fetchProducts('global', 'search-products', 'search-stats');
  } else if (path.includes('saved.html')) {
    displaySavedProducts();
  } else if (path.includes('index.html') || path === '/' || path === '') {
    fetchProducts('global', 'global-products', 'global-stats');
  }
});
