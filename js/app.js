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
