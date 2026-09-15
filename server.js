const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// MPANGILIO WA EJS NA VIEWS FOLDER
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// ULINZI WA ADMIN (Basic Authentication)
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    const ADMIN_USER = process.env.ADMIN_USER || "admin";
    const ADMIN_PASS = process.env.ADMIN_PASS || "tanzania2026";

    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Unahitajika kuingiza nenosiri ili kuingia hapa.');
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Nenosiri au Jina la mtumiaji si sahihi.');
    }
}

// UKURASA WA MWANZO
app.get('/', (req, res) => {
    res.render('index');
});

// ADMIN ROUTE (Imelindwa na nenosiri, haina uhusiano na Database)
app.get('/admin', adminAuth, (req, res) => {
    res.render('admin', { users: [] });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
