const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); // Required for session management
const crypto = require('crypto');
// Generate a secure random key
const secretKey = crypto.randomBytes(64).toString('hex');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session management
app.use(session({
    secret: secretKey, // Replace with a strong secret key
    resave: false,
    saveUninitialized: true
}));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = { username: 'admin', password: 'pass' }; // Example hardcoded credentials

    if (username === user.username && password === user.password) {
        req.session.user = user;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Middleware to protect admin routes
function authenticate(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

// Fetch data from the file and render the admin page
app.get('/admin', authenticate, (req, res) => {
    fs.readFile('data.db', 'UTF-8', (err, file) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            file = file.split("\n");
            const data = file
                .filter(line => line.includes("{") || line.includes('"custom":{'))
                .map(line => JSON.parse(line));

            res.render('admin', { data });
        }
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
