const API_URL = 'http://localhost:3000/api/chat/claude'; // Update to your deployed server URL
let currentProducts = [];
let displayedProducts = 0;
const productsPerPage = 50;

// Initialize basket count from localStorage
let basketCount = parseInt(localStorage.getItem('basketCount') || '0');
const basketCountElement = document.getElementById('basket-count');
if (basketCountElement) {
    basketCountElement.textContent = basketCount;
}

// Fetch products from API
async function fetchProducts(query, context = 'beauty') {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query, context })
        });
        const data = await response.json();
        if (data.success && data.products) {
            currentProducts = data.products;
            displayedProducts = 0;
            renderProducts();
            toggleLoadMoreButton();
        } else {
            const container = document.querySelector('main') || document.body;
            container.innerHTML += `<p>${data.response || 'No products found.'}</p>`;
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        const container = document.querySelector('main') || document.body;
        container.innerHTML += '<p>Error fetching products. Please try again.</p>';
    }
}

// Render products as bullet points
function renderProducts() {
    const container = document.querySelector('main') || document.body;
    const existingList = container.querySelector('#product-list');
    if (!existingList) {
        container.insertAdjacentHTML('beforeend', '<div id="product-list"></div>');
    }
    const productList = container.querySelector('#product-list');
    
    const nextBatch = currentProducts.slice(displayedProducts, displayedProducts + productsPerPage);
    displayedProducts += nextBatch.length;

    const html = nextBatch.map(product => `
        <li>
            ${product.name} (${product.brand}) - $${product.price}: ${product.description}
            <button onclick="addToBasket('${product.id}', '${product.name}', '${product.price}')">Add to Basket</button>
        </li>
    `).join('');
    productList.innerHTML += `<ul>${html}</ul>`;
    toggleLoadMoreButton();
}

// Toggle Load More button visibility
function toggleLoadMoreButton() {
    const container = document.querySelector('main') || document.body;
    let loadMoreDiv = container.querySelector('#load-more');
    if (!loadMoreDiv) {
        container.insertAdjacentHTML('beforeend', '<div id="load-more" style="display: none;"><button onclick="loadMoreProducts()">Load More</button></div>');
        loadMoreDiv = container.querySelector('#load-more');
    }
    loadMoreDiv.style.display = currentProducts.length > displayedProducts ? 'block' : 'none';
}

// Load more products
function loadMoreProducts() {
    renderProducts();
}

// Add product to basket
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

// Start chat with predefined query
function startChat(query) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = query;
        fetchProducts(query);
    }
}

// Clear chat and reset product list
function clearChat() {
    const chatInput = document.getElementById('chat-input');
    const productList = document.querySelector('#product-list');
    if (chatInput) chatInput.value = '';
    if (productList) productList.innerHTML = '';
    const loadMoreDiv = document.querySelector('#load-more');
    if (loadMoreDiv) loadMoreDiv.style.display = 'none';
    currentProducts = [];
    displayedProducts = 0;
}

// Handle form submission
const chatForm = document.getElementById('chat-form');
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('chat-input')?.value;
        if (query) {
            fetchProducts(query);
        }
    });
}

// Bind button clicks for predefined queries
const buttons = document.querySelectorAll('button[onclick^="startChat"]');
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const query = button.textContent.trim();
        startChat(query);
    });
});

// Bind clear chat button
const clearButton = document.querySelector('button[onclick="clearChat()"]');
if (clearButton) {
    clearButton.addEventListener('click', clearChat);
}

// Initial load
fetchProducts('Global Beauty');
