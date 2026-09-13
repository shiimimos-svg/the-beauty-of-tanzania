const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let posts = [
  { id: 1, title: 'Mount Kilimanjaro', description: 'The roof of Africa, snow-capped peak in Tanzania.', imageUrl: 'https://images.unsplash.com/photo-1609137144813-7e9453577fad?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: 'Serengeti National Park', description: 'Witness the great wildebeest migration.', imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80' },
  { id: 3, title: 'Zanzibar Beaches', description: 'Crystal clear turquoise waters and historic Stone Town.', imageUrl: 'https://images.unsplash.com/photo-1588611934988-1bf30b5e4785?auto=format&fit=crop&w=800&q=80' }
];

let messages = [];

app.get('/', (req, res) => {
  res.render('index', { posts, messages });
});

app.get('/admin', (req, res) => {
  res.render('admin', { posts, messages });
});

app.post('/admin/add-post', upload.single('image'), (req, res) => {
  const { title, description } = req.body;
  let imageUrl = '';
  
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.imageUrl) {
    imageUrl = req.body.imageUrl;
  }

  if(title && imageUrl) {
    posts.unshift({ id: Date.now(), title, description, imageUrl });
  }
  res.redirect('/admin');
});

app.post('/admin/delete-post/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  posts = posts.filter(p => p.id !== postId);
  res.redirect('/admin');
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if(name && message) {
    messages.unshift({ id: Date.now(), name, email, message, date: new Date().toLocaleDateString() });
  }
  res.redirect('/#contact');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});