document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('gallery');
    const cartLink = document.getElementById('cart-link');
    const cartItemCount = document.getElementById('cart-item-count');
    const categorySelect = document.getElementById('categorySelect');
    let currentCategory = 'all';

    function updateCartLink() {
        let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
        if (cartItemCount) {
            cartItemCount.innerText = cartItems.length;
        }
    }

    cartLink?.addEventListener('click', () => {
        window.location.href = '/cart';
    });

    function loadImages(category = 'all') {
        fetch(`/images/${category}`)
            .then(response => response.json())
            .then(images => {
                images.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate)); // Sortiraj slike od najnovijih ka najstarijima
                gallery.innerHTML = '';
                images.forEach(imageDetail => {
                    const container = document.createElement('div');
                    container.className = 'image-container';

                    const imgElement = document.createElement('img');
                    imgElement.src = `images/${imageDetail.file}`;
                    imgElement.alt = imageDetail.file;

                    const timestamp = document.createElement('div');
                    timestamp.className = 'timestamp';
                    timestamp.innerText = `Slikano: ${imageDetail.takenDate}`;

                    const enlargeButton = document.createElement('div');
                    enlargeButton.className = 'enlarge-button';
                    enlargeButton.innerText = 'F';
                    enlargeButton.onclick = () => openImageInNewTab(imageDetail.file);

                    const addButton = document.createElement('div');
                    addButton.className = 'add-button';
                    addButton.innerText = '+';
                    addButton.onclick = () => addToCart(imageDetail, addButton);

                    container.appendChild(imgElement);
                    container.appendChild(timestamp);
                    container.appendChild(enlargeButton);
                    container.appendChild(addButton);
                    gallery.appendChild(container);

                    let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
                    if (cartItems.some(item => item.file === imageDetail.file)) {
                        addButton.style.backgroundColor = 'orange';
                    }
                });
            })
            .catch(error => console.error('Error loading images:', error));
    }

    function openImageInNewTab(file) {
        window.open(`images/${file}`, '_blank');
    }

    function addToCart(imageDetail, button) {
        let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
        if (!cartItems.some(item => item.file === imageDetail.file)) {
            cartItems.push(imageDetail);
            sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartLink();
            button.style.backgroundColor = 'orange';
            alert('Image added to cart');
        } else {
            alert('Image already in cart');
        }
    }

    function loadCategories() {
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                categorySelect.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
                loadImages(currentCategory);
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    categorySelect.addEventListener('change', (event) => {
        currentCategory = event.target.value;
        loadImages(currentCategory);
    });

    loadCategories();
    updateCartLink();
});
document.addEventListener('DOMContentLoaded', function() {
    // Skloni preloader nakon što se stranica učita
    setTimeout(function() {
        document.getElementById('preloader').classList.add('fade-out');
    }, 500); // Promenite vreme ove pauze prema potrebi
});
window.addEventListener('load', () => {
    // Prikazemo poruku ako učitavanje traje duže od 5 sekundi
    setTimeout(() => {
        document.getElementById('loading-message').style.opacity = '1';
    }, 5000); // Vreme u milisekundama (5 sekundi)
});
