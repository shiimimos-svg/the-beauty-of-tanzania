const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Muunganisho wa MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "WEKA_MONGO_URL_YAKO_HAPA"; 

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("MongoDB Connected Successfully"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Database Schemas
const userSchema = new mongoose.Schema({
    id: Number,
    fullName: String,
    whatsappNumber: { type: String, unique: true, index: true },
    photoData: String,
    seeking: String
});

const messageSchema = new mongoose.Schema({
    id: Number,
    sender: { type: String, index: true },
    receiver: { type: String, index: true },
    text: String,
    photoData: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

function sanitizePhoneNumber(phone) {
    if (!phone) return "";
    let cleaned = phone.trim();
    if (cleaned.startsWith('+')) {
        cleaned = '0' + cleaned.replace(/^\+\d{1,3}/, '');
    }
    return cleaned;
}

// ----------------------------------------------------
// MWONGOZO WA ULINZI WA ADMIN (Basic Authentication)
// ----------------------------------------------------
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    // Hapa unaweza kubadilisha Username na Password unayotaka wewe
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

// API Routes zote
app.post('/api/signup', async (req, res) => {
    try {
        let { fullName, whatsappNumber, photoData, seeking } = req.body;
        whatsappNumber = sanitizePhoneNumber(whatsappNumber);

        const existingUser = await User.findOne({ whatsappNumber });
        if (existingUser) {
            return res.status(400).json({ error: "Namba hii imeshajisajili tayari!" });
        }

        if (!photoData || photoData.trim() === "") {
            photoData = "https://via.placeholder.com/150";
        }

        const count = await User.countDocuments();
        const newUser = new User({
            id: count + 1,
            fullName,
            whatsappNumber,
            photoData,
            seeking: seeking || "Urafiki Tu"
        });

        await newUser.save();
        res.status(201).json({ message: "Umefanikiwa kujisajili!", user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Hitilafu ya seva wakati wa kujisajili." });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Imeshindikana kupata watumiaji." });
    }
});

// ADMIN ROUTE IMELINDWA KALI (Imewekewa nenosiri)
app.get('/admin', adminAuth, (req, res) => {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send("Ukurasa wa Admin haupatikani kwenye folda kuu.");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
