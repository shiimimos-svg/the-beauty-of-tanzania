const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 10000;

// MPANGILIO WA EJS NA VIEWS FOLDER
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Multer setup kwa ajili ya kupakia picha kwenye folda ya public/uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// IN-MEMORY DATA STORAGE (Bila Database ili kuepusha Timeout)
let siteData = {
    announcement: "Karibu Nchi ya Tanzania ufurahie Paradisou",
    posts: [
        {
            id: 1,
            title: "Ngorongoro Crater",
            imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80",
            description: "Explore breathtaking landscapes, majestic wildlife, and rich cultures through our curated visual journey."
        },
        {
            id: 2,
            title: "Serengeti National Park",
            imageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=600&q=80",
            description: "Experience the ultimate wildlife migration and natural beauty of Tanzania."
        },
        {
            id: 3,
            title: "Cultural Heritage",
            imageUrl: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=600&q=80",
            description: "Discover the vibrant traditions and warm hospitality of local communities."
        }
    ],
    messages: []
};

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

// 1. UKURASA WA MWANZO (Index)
app.get('/', (req, res) => {
    res.render('index', { 
        announcement: siteData.announcement, 
        posts: siteData.posts 
    });
});

// 2. UKURASA WA ADMIN (Uliolindwa)
app.get('/admin', adminAuth, (req, res) => {
    res.render('admin', { 
        announcement: siteData.announcement, 
        posts: siteData.posts, 
        messages: siteData.messages 
    });
});

// 3. SASISHA TANGAZO (Announcement)
app.post('/admin/update-announcement', adminAuth, (req, res) => {
    if (req.body.announcement) {
        siteData.announcement = req.body.announcement.trim();
    }
    res.redirect('/admin');
});

// 4. ONGEZA PICHA/KIVUTIO KIPYA
app.post('/admin/add-post', adminAuth, upload.single('image'), (req, res) => {
    const { title, imageUrl, description } = req.body;
    
    let finalImageUrl = imageUrl;
    if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
    }

    if (title && description && finalImageUrl) {
        const newPost = {
            id: Date.now(),
            title,
            imageUrl: finalImageUrl,
            description
        };
        siteData.posts.unshift(newPost); // Inaweka juu kabisa
    }
    res.redirect('/admin');
});

// 5. FUTA PICHA/KIVUTIO
app.post('/admin/delete-post/:id', adminAuth, (req, res) => {
    const postId = Number(req.params.id);
    siteData.posts = siteData.posts.filter(p => p.id !== postId);
    res.redirect('/admin');
});

// 6. API YA KUTUMA MESEJI (Kama wageni watatuma ujumbe kutoka kwenye tovuti)
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (name && email && message) {
        siteData.messages.unshift({
            id: Date.now(),
            name,
            email,
            message,
            date: new Date().toLocaleDateString()
        });
        return res.json({ success: true, message: "Ujumbe umepokelewa!" });
    }
    res.status(400).json({ success: false, error: "Jaza taarifa zote muhimu." });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
