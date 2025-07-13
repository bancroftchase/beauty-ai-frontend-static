const API_URL = 'https://beauty-ai-backend.onrender.com'; // Your backend URL
let currentProducts = [];
let displayedProducts = 0;
const productsPerPage = 50;

// Initialize basket count
let basketCount = parseInt(localStorage.getItem('basketCount') || '0');
const basketCountElement = document.getElementById('basket-count');
if (basketCountElement) {
    basketCountElement.textContent = basketCount;
}

// Fetch products using the correct endpoint
async function fetchProducts(query, context = 'beauty') {
    try {
        // Use the products search endpoint with GET method
        const response = await fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: { 
                'X-Request-ID': generateRequestId()
            }
        });
        
        if (!response.ok) {
            // If products search fails, try the chat endpoint as fallback
            return await fetchProductsWithChat(query, context);
        }
        
        const data = await response.json();
        const productList = document.getElementById('product-list');
        
        if (!productList) {
            console.error('Product list container not found');
            return;
        }
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            displayedProducts = 0;
            productList.innerHTML = '';
            renderProducts();
            toggleLoadMoreButton();
            
            // Show stats if available
            if (data.stats) {
                console.log(`Found ${data.stats.productCount} products from ${data.stats.source}`);
            }
        } else {
            productList.innerHTML = '<p class="error-message">No products found for your search.</p>';
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Try chat endpoint as fallback
        return await fetchProductsWithChat(query, context);
    }
}

// Alternative fetch using chat endpoint (for AI-powered search)
async function fetchProductsWithChat(query, context = 'beauty') {
    try {
        const response = await fetch(`${API_URL}/api/chat/claude`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Request-ID': generateRequestId()
            },
            body: JSON.stringify({ message: query, context })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const productList = document.getElementById('product-list');
        
        if (!productList) {
            console.error('Product list container not found');
            return;
        }
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            displayedProducts = 0;
            productList.innerHTML = '';
            renderProducts();
            toggleLoadMoreButton();
            
            // Show stats if available
            if (data.stats) {
                console.log(`Found ${data.stats.productCount} products from ${data.stats.source}`);
            }
        } else {
            productList.innerHTML = '<p class="error-message">No products found for your search.</p>';
        }
    } catch (error) {
        console.error('Error with chat endpoint:', error);
        const productList = document.getElementById('product-list');
        if (productList) {
            productList.innerHTML = '<p class="error-message">Error fetching products. Please check your connection and try again.</p>';
        }
    }
}

// Alternative search using the products endpoint
async function searchProducts(query) {
    try {
        const response = await fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: { 
                'X-Request-ID': generateRequestId()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const productList = document.getElementById('product-list');
        
        if (!productList) {
            console.error('Product list container not found');
            return;
        }
        
        if (data.success && data.products && data.products.length > 0) {
            currentProducts = data.products;
            displayedProducts = 0;
            productList.innerHTML = '';
            renderProducts();
            toggleLoadMoreButton();
        } else {
            productList.innerHTML = '<p class="error-message">No products found for your search.</p>';
        }
    } catch (error) {
        console.error('Error searching products:', error);
        // Fallback to chat endpoint
        fetchProducts(query);
    }
}

// Generate request ID for debugging
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Render products as horizontal cards with improved styling
function renderProducts() {
    const productList = document.getElementById('product-list');
    const nextBatch = currentProducts.slice(displayedProducts, displayedProducts + productsPerPage);
    displayedProducts += nextBatch.length;

    const html = nextBatch.map(product => {
        // Ensure price is a valid number
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
    div.textContent = text;
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

// Add to basket with improved feedback
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
            // Add visual feedback
            basketCountElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                basketCountElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Show success message
        showNotification(`Added ${name} to basket!`, 'success');
        
    } catch (error) {
        console.error('Error adding to basket:', error);
        showNotification('Error adding item to basket', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    // Set styles based on type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Compatibility with existing functions
function sendQuickMessage(query) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = query;
        sendMessage();
    }
}

function sendMessage() {
    const query = document.getElementById('messageInput')?.value?.trim() || 'global';
    if (query) {
        // Show loading state
        const productList = document.getElementById('product-list');
        if (productList) {
            productList.innerHTML = '<p class="loading-message">Searching for products...</p>';
        }
        
        // Use chat endpoint for better results
        fetchProducts(query);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

function refreshChat() {
    const messageInput = document.getElementById('messageInput');
    const productList = document.getElementById('product-list');
    const loadMoreDiv = document.getElementById('load-more');
    
    if (messageInput) messageInput.value = '';
    if (productList) productList.innerHTML = '';
    if (loadMoreDiv) loadMoreDiv.style.display = 'none';
    
    currentProducts = [];
    displayedProducts = 0;
    
    // Load default products
    fetchProducts('global');
}

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('Server health:', data);
            return true;
        }
    } catch (error) {
        console.error('Server health check failed:', error);
        return false;
    }
    return false;
}

// Bind event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Check server health first
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        console.warn('Server may be down or unreachable');
    }
    
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
    fetchProducts('global');
});
