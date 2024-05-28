document.addEventListener('DOMContentLoaded', () => {
    const cart = document.getElementById('cart');
    const orderForm = document.getElementById('orderForm');
    const orderStatus = document.getElementById('orderStatus');
    let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];

    function updateCart() {
        cart.innerHTML = '';
        cartItems.forEach((item, index) => {
            const container = document.createElement('div');
            container.className = 'image-container';

            const imgElement = document.createElement('img');
            imgElement.src = `images/${item.file}`;
            imgElement.alt = item.file;

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.innerText = `Slikano: ${item.takenDate}`;

            const removeButton = document.createElement('div');
            removeButton.className = 'remove-button';
            removeButton.innerText = '-';
            removeButton.onclick = () => removeFromCart(index);

            container.appendChild(imgElement);
            container.appendChild(timestamp);
            container.appendChild(removeButton);
            cart.appendChild(container);
        });
    }

    function updateCartLink() {
        const cartLink = document.getElementById('cart-link');
        if (cartLink) {
            cartLink.innerText = `Korpa(${cartItems.length})`;
        }
    }

    function removeFromCart(index) {
        cartItems.splice(index, 1);
        sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCart();
        updateCartLink();
    }

    function orderImages(event) {
        event.preventDefault();

        const imeiprezime = document.getElementById('imeiprezime').value;
        const brojtelefona = document.getElementById('brojtelefona').value;
        const email = document.getElementById('email').value;

        if (!cartItems.length) {
            orderStatus.textContent = 'Vaša korpa je prazna';
            return;
        }

        fetch('/order-images', {
            method: 'POST',
            body: JSON.stringify({
                imeiprezime,
                brojtelefona,
                email,
                images: cartItems.map(item => item.file)
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.text())
            .then(orderNumber => {
                const orderConfirmationHTML = `
<div id="orderStatus" class="order-status">
  <h1>HVALA VAŠA PORUDŽBINA <span style="color: orange;">#${orderNumber}</span></h1>
  <h3>Bićete vraćeni na galeriju za 5 sekundi...</h3>
</div>
<div id="orderImages">
  ${cartItems.map(item => `<div class="image-container"><img src="images/${item.file}" alt="${item.file}"><div class="timestamp">Slikano: ${item.takenDate}</div></div>`).join('')}
</div>
`;
                document.body.innerHTML = orderConfirmationHTML;
                cartItems = [];
                sessionStorage.removeItem('cartItems');
                setTimeout(() => {
                    window.location.href = '/';
                }, 5000);
            })
            .catch(error => {
                console.error('Error ordering images:', error);
                orderStatus.textContent = 'Failed to order images. Please try again later.';
            });
    }


    updateCart();
    updateCartLink();
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    // Set up form submission
    orderForm.addEventListener('submit', orderImages);
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