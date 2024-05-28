document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('ordersContainer');

    // Funkcija za učitavanje porudžbina
    function loadOrders() {
        fetch('/orders')
            .then(response => response.json())
            .then(orders => {
                ordersContainer.innerHTML = '';

                orders.forEach(order => {
                    const orderElement = document.createElement('div');
                    orderElement.className = 'order';

                    const orderDetails = document.createElement('div');
                    orderDetails.className = 'order-details';
                    orderDetails.innerHTML = `
                        <p><strong>Broj porudzbine:</strong> ${order.order_number}</p>
                        <p><strong>Ime i prezime:</strong> ${order.imeiprezime}</p>
                        <p><strong>Broj telefona:</strong> ${order.brojtelefona}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p><strong>Datum porudzbine:</strong> ${order.order_date}</p>
                    `;

                    const orderImages = document.createElement('div');
                    orderImages.className = 'order-images';
                    const images = order.images;
                    images.forEach(image => {
                        const container = document.createElement('div');
                        container.className = 'order-image';

                        const imgElement = document.createElement('img');
                        imgElement.src = `images/${image.file}`;
                        imgElement.alt = image.file;

                        const timestamp = document.createElement('div');
                        timestamp.className = 'timestamp';
                        timestamp.innerText = `Slikano: ${image.takenDate}`;

                        container.appendChild(imgElement);
                        container.appendChild(timestamp);
                        orderImages.appendChild(container);
                    });

                    orderElement.appendChild(orderDetails);
                    orderElement.appendChild(orderImages);
                    ordersContainer.appendChild(orderElement);
                });
            })
            .catch(error => console.error('Error loading orders:', error));
    }

    // Učitaj porudžbine kada se stranica učita
    loadOrders();
});
