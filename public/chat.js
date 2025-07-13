```javascript
const API_URL = 'https://your-backend.onrender.com/api/chat/claude'; // Replace with your backend URL

// Basket state
let basketCount = 0;

// DOM elements
const chatArea = document.getElementById('chat-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const refreshBtn = document.getElementById('refresh-btn');
const quickActionButtons = document.querySelectorAll('.quick-action-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  messageInput.addEventListener('keypress', handleKeyPress);
  sendBtn.addEventListener('click', sendMessage);
  refreshBtn.addEventListener('click', refreshChat);
  quickActionButtons.forEach(btn => btn.addEventListener('click', () => sendQuickMessage(btn.dataset.query)));
  sendQuickMessage('global'); // Default query
});

// Send quick message
function sendQuickMessage(query) {
  messageInput.value = query;
  sendMessage();
}

// Refresh chat
function refreshChat() {
  chatArea.innerHTML = '';
  basketCount = 0;
  updateBasketCount();
  sendQuickMessage('global');
}

// Send message
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  chatArea.innerHTML = '<p>Loading products...</p>';
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: 'beauty' })
    });
    const data = await response.json();
    if (data.success && data.products && data.products.length > 0) {
      renderProducts(data.products);
    } else {
      chatArea.innerHTML = `<p>${data.response || 'No products found.'}</p>`;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    chatArea.innerHTML = '<p>Error loading products. Please try again.</p>';
  }
  messageInput.value = '';
}

// Render products as horizontal cards
function renderProducts(products) {
  chatArea.innerHTML = `
    <div class="product-container">
      ${products.slice(0, 50).map(product => `
        <div class="product-card">
          <h3>${product.name}</h3>
          <p><strong>Brand:</strong> ${product.brand}</p>
          <p><strong>Price:</strong> $${product.price}</p>
          <p>${product.description}</p>
          <button class="add-to-basket" data-id="${product.id}">Add to Basket</button>
        </div>
      `).join('')}
      ${products.length > 50 ? '<button id="load-more">Load More</button>' : ''}
    </div>
  `;

  // Add event listeners for basket buttons
  document.querySelectorAll('.add-to-basket').forEach(btn => {
    btn.addEventListener('click', () => {
      basketCount++;
      updateBasketCount();
      btn.disabled = true;
      btn.textContent = 'Added';
    });
  });

  // Load more products
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const nextProducts = products.slice(50, 100);
      document.querySelector('.product-container').insertBefore(
        document.createRange().createContextualFragment(
          nextProducts.map(product => `
            <div class="product-card">
              <h3>${product.name}</h3>
              <p><strong>Brand:</strong> ${product.brand}</p>
              <p><strong>Price:</strong> $${product.price}</p>
              <p>${product.description}</p>
              <button class="add-to-basket" data-id="${product.id}">Add to Basket</button>
            </div>
          `).join('')
        ),
        loadMoreBtn
      );
      loadMoreBtn.remove();
      document.querySelectorAll('.add-to-basket').forEach(btn => {
        btn.addEventListener('click', () => {
          basketCount++;
          updateBasketCount();
          btn.disabled = true;
          btn.textContent = 'Added';
        });
      });
    });
  }
}

// Update basket count
function updateBasketCount() {
  const basketElement = document.getElementById('basket-count');
  if (basketElement) {
    basketElement.textContent = basketCount;
  }
}

// Handle key press
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}
```
