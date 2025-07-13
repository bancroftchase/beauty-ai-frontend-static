// IMPORTANT: Update this URL to match your actual backend
const API_URL = 'https://beauty-ai-backend.onrender.com';

let currentProducts = [];
let displayedProducts = 0;
const productsPerPage = 50;

// Initialize basket count
let basketCount = parseInt(localStorage.getItem('basketCount') || '0');
const basketCountElement = document.getElementById('basket-count');
if (basketCountElement) {
    basketCountElement.textContent = basketCount;
}

// Generate request ID for debugging
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// PRIMARY SEARCH FUNCTION - Uses GET /api/products/search
async function fetchProducts(query) {
    const productList = document.getElementById('product-list');
    
    // Show loading state
    if (productList) {
        productList.innerHTML = '<div class="loading-message">🔍 Searching for products...</div>';
    }
    
    try {
        console.log(`Searching for: "${query}"`);
        
        // Use GET method for /api/products/search
        const searchUrl = `${API_URL}/api/products/search?q=${encodeURIComponent(query || 'global')}`;
        console.log('GET Request to:', searchUrl);
        
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: { 
                'X-Request-ID': generateRequestId(),
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Expected JSON but got:', contentType);
            console.error('Response text:', textResponse);
            throw new Error(`Expected JSON but got: ${contentType}`);
        }
        
        const data = await response.json();
        console.log('Search response:', data);
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            displayedProducts = 0;
            
            if (productList) {
                productList.innerHTML = '';
                renderProducts();
                toggleLoadMoreButton();
            }
            
            console.log(`✅ Loaded ${data.products.length} products`);
        } else {
            if (productList) {
                productList.innerHTML = '<div class="error-message">No products found. Try a different search term.</div>';
            }
        }
        
    } catch (error) {
        console.error('Search failed:', error);
        
        // Try fallback to chat endpoint
        console.log('Trying fallback chat endpoint...');
        await fetchProductsWithChat(query);
    }
}

// FALLBACK FUNCTION - Uses POST /api/chat/claude
async function fetchProductsWithChat(query) {
    const productList = document.getElementById('product-list');
    
    try {
        console.log(`Chat search for: "${query}"`);
        
        // Use POST method for /api/chat/claude
        const chatUrl = `${API_URL}/api/chat/claude`;
        console.log('POST Request to:', chatUrl);
        
        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Request-ID': generateRequestId(),
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                message: query || 'global', 
                context: 'beauty products' 
            })
        });
        
        console.log('Chat response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Chat API HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Chat API - Expected JSON but got:', contentType);
            console.error('Chat API - Response text:', textResponse);
            throw new Error(`Chat API - Expected JSON but got: ${contentType}`);
        }
        
        const data = await response.json();
        console.log('Chat response:', data);
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            displayedProducts = 0;
            
            if (productList) {
                productList.innerHTML = '';
                renderProducts();
                toggleLoadMoreButton();
            }
            
            console.log(`✅ Chat loaded ${data.products.length} products`);
        } else {
            if (productList) {
                productList.innerHTML = '<div class="error-message">❌ Unable to load products. Please try again later.</div>';
            }
        }
        
    } catch (error) {
        console.error('Chat API failed:', error);
        
        if (productList) {
            productList.innerHTML = `
                <div class="error-message">
                    ❌ Error loading products: ${error.message}<br>
                    <small>Check console for details</small>
                </div>
            `;
        }
    }
}

// Render products as cards
function renderProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    
    const nextBatch = currentProducts.slice(displayedProducts, displayedProducts + productsPerPage);
    displayedProducts += nextBatch.length;

    const html = nextBatch.map(product => {
        const price = parseFloat(product.price) || 0;
        const formattedPrice = price.toFixed(2);
        
        return `
            <div class="product-card">
                <div class="product-header">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <span class="product-category">${escapeHtml(product.category || 'Beauty')}</span>
                </div>
                <div class="product-details">
                    <p class="product-brand">Brand: ${escapeHtml(product.brand)}</p>
                    <p class="product-price">$${formattedPrice}</p>
                    <p class="product-country">Origin: ${escapeHtml(product.country || 'Global')}</p>
                </div>
                <p class="product-description">${escapeHtml(product.description)}</p>
                <button class="add-to-basket" onclick="addToBasket('${escapeHtml(product.id)}', '${escapeHtml(product.name)}', '${formattedPrice}')">
                    Add to Basket
                </button>
            </div>
        `;
    }).join('');
    
    productList.innerHTML += html;
    toggleLoadMoreButton();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Toggle Load More button
function toggleLoadMoreButton() {
    const loadMoreDiv = document.getElementById('load-more');
    if (loadMoreDiv) {
        if (currentProducts.length > displayedProducts) {
            loadMoreDiv.innerHTML = '<button class="load-more-button" onclick="loadMoreProducts()">Load More Products</button>';
            loadMoreDiv.style.display = 'block';
        } else {
            loadMoreDiv.style.display = 'none';
        }
    }
}

// Load more products
function loadMoreProducts() {
    renderProducts();
}

// Add to basket
function addToBasket(id, name, price) {
    try {
        const basket = JSON.parse(localStorage.getItem('basket') || '[]');
        const newItem = { 
            id, 
            name, 
            price: parseFloat(price),
            addedAt: new Date().toISOString()
        };
        
        basket.push(newItem);
        localStorage.setItem('basket', JSON.stringify(basket));
        
        basketCount++;
        localStorage.setItem('basketCount', basketCount);
        
        if (basketCountElement) {
            basketCountElement.textContent = basketCount;
            basketCountElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                basketCountElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        showNotification(`✅ Added ${name} to basket!`, 'success');
        
    } catch (error) {
        console.error('Error adding to basket:', error);
        showNotification('❌ Error adding item to basket', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(notification);
    }
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#007bff'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.opacity = '1';
    
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Main message sending function
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const query = messageInput?.value?.trim() || 'global';
    
    console.log('Sending message:', query);
    fetchProducts(query);
}

// Quick message function
function sendQuickMessage(query) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = query;
    }
    console.log('Quick message:', query);
    fetchProducts(query);
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

// Refresh chat
function refreshChat() {
    const messageInput = document.getElementById('messageInput');
    const productList = document.getElementById('product-list');
    const loadMoreDiv = document.getElementById('load-more');
    
    if (messageInput) messageInput.value = '';
    if (productList) productList.innerHTML = '';
    if (loadMoreDiv) loadMoreDiv.style.display = 'none';
    
    currentProducts = [];
    displayedProducts = 0;
    
    fetchProducts('global');
}

// Check server health
async function checkServerHealth() {
    try {
        console.log('Checking server health...');
        const response = await fetch(`${API_URL}/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server is healthy:', data);
            return true;
        } else {
            console.warn('⚠️ Server health check failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Server health check error:', error);
        return false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing beauty app...');
    console.log('API URL:', API_URL);
    
    // Check server health
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        console.warn('⚠️ Server may be down or unreachable');
        const productList = document.getElementById('product-list');
        if (productList) {
            productList.innerHTML = '<div class="error-message">⚠️ Unable to connect to server. Please try again later.</div>';
        }
        return;
    }
    
    // Bind event listeners
    const buttons = document.querySelectorAll('.quick-action-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.textContent.trim();
            sendQuickMessage(query);
        });
    });

    const refreshButton = document.querySelector('.refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshChat);
    }

    const sendButton = document.querySelector('.send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', handleKeyPress);
    }

    // Initial load
    console.log('🔄 Loading initial products...');
    fetchProducts('global');
});
