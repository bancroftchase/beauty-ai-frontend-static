const API_URL = 'https://your-backend.onrender.com/api/chat/claude'; // Replace with your backend URL
let currentProducts = [];
let displayedProducts = 0;
const productsPerPage = 50;

// Initialize basket count
let basketCount = parseInt(localStorage.getItem('basketCount') || '0');
const basketCountElement = document.getElementById('basket-count');
if (basketCountElement) {
    basketCountElement.textContent = basketCount;
}

// Fetch products
async function fetchProducts(query, context = 'beauty') {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query, context })
        });
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
            productList.innerHTML = '<p class="error-message">No products found.</p>';
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('product-list').innerHTML = '<p class="error-message">Error fetching products. Please try again.</p>';
    }
}

// Render products as horizontal cards
function renderProducts() {
    const productList = document.getElementById('product-list');
    const nextBatch = currentProducts.slice(displayedProducts, displayedProducts + productsPerPage);
    displayedProducts += nextBatch.length;

    const html = nextBatch.map(product => `
        <div class="product-card">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
            <p class="product-description">${product.description}</p>
            <button class="add-to-basket" onclick="addToBasket('${product.id}', '${product.name}', '${parseFloat(product.price).toFixed(2)}')">Add to Basket</button>
        </div>
    `).join('');
    productList.innerHTML += html;
    toggleLoadMoreButton();
}

// Toggle Load More button
function toggleLoadMoreButton() {
    const loadMoreDiv = document.getElementById('load-more');
    if (loadMoreDiv) {
        if (currentProducts.length > displayedProducts) {
            loadMoreDiv.innerHTML = '<button class="load-more-button" onclick="loadMoreProducts()">Load More</button>';
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
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    basket.push({ id, name, price });
    localStorage.setItem('basket', JSON.stringify(basket));
    basketCount++;
    localStorage.setItem('basketCount', basketCount);
    if (basketCountElement) {
        basketCountElement.textContent = basketCount;
    }
    alert(`Added ${name} to basket!`);
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
    const query = document.getElementById('messageInput')?.value || 'global';
    if (query) {
        document.getElementById('product-list').innerHTML = '';
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
    fetchProducts('global');
}

// Bind event listeners
document.addEventListener('DOMContentLoaded', () => {
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
