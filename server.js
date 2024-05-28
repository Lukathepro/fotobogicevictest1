const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const exifParser = require('exif-parser');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3306; // Ensure using the correct port
const imagesFolder = path.join(__dirname, 'public/images');
const categoriesFile = path.join(__dirname, 'categories.json');

const adminUsername = 'lukicheli';
const adminPassword = 'svejeovopremalozakraj';

// Database connection
const db = mysql.createConnection({
    host: 'bdrvf713ddsas7soxphl-mysql.services.clever-cloud.com',
    user: 'ur7tiyb9eb5zek5c',
    password: 'iPbGTyNNt9nvDLog5WAo',
    database: 'bdrvf713ddsas7soxphl'
});

db.connect((err) => {
    if (err) {
        console.error('Failed to connect to MySQL Database:', err);
        throw err;
    }
    console.log('Connected to MySQL Database');
});

if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder);
}

if (!fs.existsSync(categoriesFile)) {
    fs.writeFileSync(categoriesFile, JSON.stringify(['Sve']));
}

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category;
        const categoryPath = path.join(imagesFolder, category);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath);
        }
        cb(null, categoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

function checkAuthentication(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/admin', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/admin_orders', checkAuthentication, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin_orders.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUsername && password === adminPassword) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/categories', (req, res) => {
    const categories = JSON.parse(fs.readFileSync(categoriesFile));
    res.json(categories);
});

app.post('/add-category', checkAuthentication, (req, res) => {
    const newCategory = req.body.category;
    let categories = JSON.parse(fs.readFileSync(categoriesFile));
    if (!categories.includes(newCategory)) {
        categories.push(newCategory);
        fs.writeFileSync(categoriesFile, JSON.stringify(categories));
        const newCategoryPath = path.join(imagesFolder, newCategory);
        if (!fs.existsSync(newCategoryPath)) {
            fs.mkdirSync(newCategoryPath);
        }
    }
    res.json(categories);
});

app.post('/delete-category', checkAuthentication, (req, res) => {
    const category = req.body.category;
    let categories = JSON.parse(fs.readFileSync(categoriesFile));
    if (categories.includes(category)) {
        categories = categories.filter(cat => cat !== category);
        fs.writeFileSync(categoriesFile, JSON.stringify(categories));
        const categoryPath = path.join(imagesFolder, category);
        if (fs.existsSync(categoryPath)) {
            fs.rmSync(categoryPath, { recursive: true, force: true });
        }
    }
    res.json(categories);
});

app.post('/upload-image', checkAuthentication, upload.array('images', 12), (req, res) => {
    res.send('Images uploaded successfully');
});

app.get('/images/:category', (req, res) => {
    const category = req.params.category;
    let imageDetails = [];

    const readImagesFromFolder = (folder) => {
        if (!fs.existsSync(folder)) return [];
        return fs.readdirSync(folder).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)).map(file => {
            const filePath = path.join(folder, file);
            const buffer = fs.readFileSync(filePath);
            let takenDate = 'Nepoznato';

            try {
                const parser = exifParser.create(buffer);
                const result = parser.parse();
                takenDate = result.tags.DateTimeOriginal || result.tags.CreateDate;
                takenDate = takenDate ? new Date(takenDate * 1000).toLocaleString() : 'Unknown';
            } catch (error) {
                console.error('Error parsing EXIF data:', error);
            }

            return {
                file: `${path.relative(imagesFolder, folder)}/${file}`,
                takenDate
            };
        });
    };

    if (category === 'Sve') {
        const subfolders = fs.readdirSync(imagesFolder).filter(subfolder => fs.statSync(path.join(imagesFolder, subfolder)).isDirectory());
        subfolders.forEach(subfolder => {
            const subfolderPath = path.join(imagesFolder, subfolder);
            imageDetails = imageDetails.concat(readImagesFromFolder(subfolderPath));
        });
    } else {
        const categoryFolder = path.join(imagesFolder, category);
        imageDetails = readImagesFromFolder(categoryFolder);
    }

    imageDetails.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate)); // Sort by newest first
    res.json(imageDetails);
});

app.post('/order-images', (req, res) => {
    const { imeiprezime, brojtelefona, email, images } = req.body;

    if (!imeiprezime || !brojtelefona || !email || !images.length) {
        return res.status(400).send('Sva polja popuni');
    }

    const orderNumber = Math.floor(Math.random() * 1000000);

    const orderData = {
        imeiprezime,
        brojtelefona,
        email,
        images: JSON.stringify(images),
        orderNumber
    };

    // Dodajte dva sata na trenutni datum
    const orderDate = new Date();
    orderDate.setHours(orderDate.getHours());

    const sql = 'INSERT INTO orders (imeiprezime, brojtelefona, email, images, order_number, order_date) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, [orderData.imeiprezime, orderData.brojtelefona, orderData.email, orderData.images, orderData.orderNumber, orderDate], (err, result) => {
        if (err) {
            console.error('Failed to save order:', err); // Log error
            return res.status(500).send('Failed to save order');
        }

        req.session.order = {
            orderNumber,
            imeiprezime,
            brojtelefona,
            email,
            images
        };
        console.log("Nova narudzbina",req.session.order);
        res.send(orderNumber.toString());
    });
});
app.get('/orders', checkAuthentication, (req, res) => {
    db.query('SELECT * FROM orders', (err, results) => {
        if (err) {
            console.error('Failed to retrieve orders:', err);
            return res.status(500).send('Failed to retrieve orders');
        }

        try {
            const formattedResults = results.map(order => {
                const images = JSON.parse(order.images).map(image => {
                    const filePath = path.join(imagesFolder, image);
                    if (!fs.existsSync(filePath)) return null;
                    const buffer = fs.readFileSync(filePath);
                    let takenDate = 'Nepoznato';

                    try {
                        const parser = exifParser.create(buffer);
                        const result = parser.parse();
                        takenDate = result.tags.DateTimeOriginal || result.tags.CreateDate;
                        takenDate = takenDate ? new Date(takenDate * 1000).toLocaleString() : 'Unknown';
                    } catch (error) {
                        console.error('Error parsing EXIF data:', error);
                    }

                    return {
                        file: image,
                        takenDate
                    };
                }).filter(image => image !== null);

                return {
                    order_number: order.order_number,
                    imeiprezime: order.imeiprezime,
                    brojtelefona: order.brojtelefona,
                    email: order.email,
                    order_date: new Date(order.order_date).toLocaleString(), // Assuming you have a created_at field in your orders table
                    images
                };
            });

            res.json(formattedResults);
        } catch (parseError) {
            console.error('Failed to parse order images:', parseError);
            res.status(500).send('Failed to parse order images');
        }
    });
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/cart.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
