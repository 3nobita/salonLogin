const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./model/User');
const session = require('express-session'); // Import express-session

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up sessions
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
}));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
const dbURI = 'mongodb+srv://bhavesh39shinde:uwR0rCeICzMmrSYo@cluster1.rb3ob.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(dbURI)
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to the QR Code Points API!</h1>
        <p><a href="/signup">Sign Up</a> | <a href="/login">Login</a></p>
    `);
});

// Signup Route
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { name, birthdate, number } = req.body;

    try {
        const newUser = new User({ name, birthdate, number });
        await newUser.save();
        console.log(`User created: ${name} with number: ${number}`); // Log the new user
        res.send(`User ${name} signed up successfully! <a href="/login">Login</a>`);
    } catch (error) {
        if (error.code === 11000) {
            res.send('Error: Phone number already exists. Please try another number.');
        } else {
            res.send('Error signing up: ' + error.message);
        }
    }
});


// Login Route
app.get('/login', (req, res) => {
    const userId = req.query.userId; // Get userId from query
    res.render('login', { userId }); // Pass userId to the view
});
app.post('/login', async (req, res) => {
    const { number } = req.body; // Get number from the form

    try {
        const user = await User.findOne({ number });
        if (user) {
            req.session.userId = user._id; // Set the session userId
            console.log(`User logged in: ${user.name}`); // Log successful login
            return res.redirect('/home'); // Redirect to home after login
        } else {
            res.send('User not found! Please sign up first.');
        }
    } catch (error) {
        res.send('Error logging in: ' + error.message);
    }
});


// QR Code Generation Route
app.get('/qr/:userId', async (req, res) => {
    const { userId } = req.params;
    const url = `http://localhost:${PORT}/scan/${userId}`;

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(url);
        res.render('qr', { qrCode: qrCodeDataUrl, userId });
    } catch (err) {
        res.status(500).send('Error generating QR code');
    }
}); 


app.get('/home', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    User.findById(req.session.userId)
        .then(user => {
            console.log('Fetched user in home route:', user); // Log fetched user
            if (user) {
                res.render('home', { name: user.name, number: user.number });
            } else {
                res.redirect('/login'); // Redirect if user not found
            }
        })
        .catch(err => {
            console.error('Error fetching user:', err);
            res.send('Error fetching user: ' + err.message);
        });
});



// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
