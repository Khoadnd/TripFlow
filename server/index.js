const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const cron = require('node-cron');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NTFY_TOPIC = process.env.NTFY_TOPIC;

if (!SECRET_KEY) {
    console.error("FATAL: JWT_SECRET is not set.");
    process.exit(1);
}

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:"],
            "frame-src": ["'self'"],
            "object-src": ["'self'"], // Allow PDFs
        },
    },
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 failed attempts
    message: "Too many login attempts, please try again later."
});

app.use(cors({
    origin: CLIENT_URL, // Allow specific origin
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Prevent DoS with large payloads
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

let db;

async function sendNotification(message, title = 'Trip Update', tags = [], priority = 'default') {
    if (!NTFY_TOPIC) return;
    try {
        await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, message, {
            headers: {
                'Title': title,
                'Priority': priority,
                'Tags': tags.join(',')
            }
        });
        console.log(`Notification sent: ${title}`);
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

initDB().then(database => {
  db = database;
  console.log('Database initialized');

  // --- Auth Routes & Middleware ---
  app.post('/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: true, // Always true for SSL
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });
        res.json({ username: user.username, display_name: user.display_name });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ message: 'Logged out' });
  });

  // --- Middleware ---
  const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  app.use('/api', authenticateToken);

  app.get('/api/me', async (req, res) => {
    try {
        const user = await db.get('SELECT id, username, display_name, home_city, home_lat, home_lon, trip_date, budget_limit FROM users WHERE id = ?', req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/me', async (req, res) => {
      const { display_name, home_city, home_lat, home_lon, password, trip_date, budget_limit } = req.body;
      try {
          if (password) {
              const hash = await bcrypt.hash(password, 10);
              await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
          }
          if (display_name !== undefined) await db.run('UPDATE users SET display_name = ? WHERE id = ?', [display_name, req.user.id]);
          if (home_city !== undefined) await db.run('UPDATE users SET home_city = ? WHERE id = ?', [home_city, req.user.id]);
          if (home_lat !== undefined) await db.run('UPDATE users SET home_lat = ? WHERE id = ?', [home_lat, req.user.id]);
          if (home_lon !== undefined) await db.run('UPDATE users SET home_lon = ? WHERE id = ?', [home_lon, req.user.id]);
          if (trip_date !== undefined) await db.run('UPDATE users SET trip_date = ? WHERE id = ?', [trip_date, req.user.id]);
          if (budget_limit !== undefined) await db.run('UPDATE users SET budget_limit = ? WHERE id = ?', [budget_limit, req.user.id]);

          const updatedUser = await db.get('SELECT id, username, display_name, home_city, home_lat, home_lon, trip_date, budget_limit FROM users WHERE id = ?', req.user.id);
          res.json(updatedUser);
      } catch (e) {
          console.error(e);
          res.status(500).json({ message: 'Update failed' });
      }
  });

  app.get('/api/storage', async (req, res) => {
      // Only count files owned by user
      try {
          const docs = await db.all('SELECT path FROM documents WHERE user_id = ?', req.user.id);
          let totalSize = 0;
          docs.forEach(doc => {
              const p = path.join(uploadDir, doc.path);
              if (fs.existsSync(p)) totalSize += fs.statSync(p).size;
          });
          
          res.json({
              used: totalSize,
              total: 1024 * 1024 * 1024, // 1GB Limit
              filesCount: docs.length
          });
      } catch (e) {
          console.error(e);
          res.status(500).json({ message: 'Error calculating storage' });
      }
  });

  // --- Itinerary Routes ---
  app.get('/api/itinerary', async (req, res) => {
    const items = await db.all('SELECT * FROM itinerary WHERE user_id = ? ORDER BY date, time', req.user.id);
    res.json(items);
  });

  app.post('/api/itinerary', async (req, res) => {
    try {
      const { title, date, time, location, description, type, lat, lon } = req.body;
      const result = await db.run(
        'INSERT INTO itinerary (user_id, title, date, time, location, description, type, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, title, date, time, location, description, type, lat || null, lon || null]
      );
      res.json({ id: result.lastID, ...req.body });
      sendNotification(`New itinerary item added: ${title} on ${date}`);
    } catch (e) {
      console.error("Error creating itinerary item:", e);
      res.status(500).json({ message: 'Failed to create itinerary item' });
    }
  });

  app.put('/api/itinerary/:id', async (req, res) => {
    const { title, date, time, location, description, type, lat, lon } = req.body;
    await db.run(
      'UPDATE itinerary SET title = ?, date = ?, time = ?, location = ?, description = ?, type = ?, lat = ?, lon = ? WHERE id = ? AND user_id = ?',
      [title, date, time, location, description, type, lat, lon, req.params.id, req.user.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/itinerary/:id', async (req, res) => {
    await db.run('DELETE FROM itinerary WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  });

  // --- Todos Routes ---
  app.get('/api/todos', async (req, res) => {
    const items = await db.all('SELECT * FROM todos WHERE user_id = ?', req.user.id);
    res.json(items);
  });

  app.post('/api/todos', async (req, res) => {
    try {
      const { title, due_date } = req.body;
      // Get max position
      const maxPos = await db.get('SELECT MAX(position) as max FROM todos WHERE user_id = ?', req.user.id);
      const position = (maxPos.max || 0) + 10000; // Large gap for future insertions

      const result = await db.run(
        'INSERT INTO todos (user_id, title, due_date, position) VALUES (?, ?, ?, ?)',
        [req.user.id, title, due_date, position]
      );
      res.json({ id: result.lastID, title, status: 'pending', due_date, position });
    } catch (e) {
      console.error("Error creating todo:", e);
      res.status(500).json({ message: 'Failed to create todo' });
    }
  });

  app.put('/api/todos/:id', async (req, res) => {
    const { title, status, due_date, position } = req.body;
    // Build dynamic query based on provided fields
    let updates = [];
    let params = [];
    if (title) { updates.push('title = ?'); params.push(title); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (due_date) { updates.push('due_date = ?'); params.push(due_date); }
    if (position !== undefined) { updates.push('position = ?'); params.push(position); }
    
    if (updates.length === 0) return res.json({ message: 'No changes' });
    
    params.push(req.params.id);
    params.push(req.user.id); // Ensure ownership
    
    await db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
    res.json({ message: 'Updated' });
  });

  app.delete('/api/todos/:id', async (req, res) => {
    await db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  });

  // --- Documents Routes ---
  app.get('/api/documents', async (req, res) => {
    const items = await db.all('SELECT * FROM documents WHERE user_id = ?', req.user.id);
    res.json(items);
  });

  app.post('/api/documents', (req, res, next) => {
      upload.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
      })
  }, async (req, res) => {
    try {
      if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
      }
      const { originalname, filename, path: filePath, mimetype } = req.file;
      const type = req.body.type || 'general';
      const upload_date = new Date().toISOString();
      let thumbnail_path = null;

      if (mimetype === 'application/pdf') {
          try {
              const thumbName = `${filename}-thumb`;
              const thumbOutput = path.join(uploadDir, thumbName);
              // pdftoppm -png -f 1 -l 1 -scale-to 300 input.pdf output_prefix
              // It appends -1.png to the output prefix
              await new Promise((resolve, reject) => {
                  exec(`pdftoppm -png -f 1 -l 1 -scale-to 300 "${filePath}" "${thumbOutput}"`, (error, stdout, stderr) => {
                      if (error) {
                          console.error(`Thumbnail generation error: ${error.message}`);
                          reject(error);
                      } else {
                          resolve();
                      }
                  });
              });
              // pdftoppm adds -1.png to the prefix
              if (fs.existsSync(`${thumbOutput}-1.png`)) {
                  // Rename to clean filename
                  fs.renameSync(`${thumbOutput}-1.png`, `${thumbOutput}.png`);
                  thumbnail_path = `${thumbName}.png`;
              }
          } catch (err) {
              console.error("Failed to generate thumbnail:", err);
          }
      }
      
      const result = await db.run(
        'INSERT INTO documents (user_id, name, type, path, thumbnail_path, upload_date) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, originalname, type, filename, thumbnail_path, upload_date]
      );
      res.json({ id: result.lastID, name: originalname, type, path: filename, thumbnail_path, upload_date });
    } catch (e) {
      console.error("Error uploading document:", e);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
    const doc = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (doc) {
        const filePath = path.join(__dirname, 'uploads', doc.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (doc.thumbnail_path) {
            const thumbPath = path.join(__dirname, 'uploads', doc.thumbnail_path);
            if (fs.existsSync(thumbPath)) {
                fs.unlinkSync(thumbPath);
            }
        }
        await db.run('DELETE FROM documents WHERE id = ?', req.params.id);
    }
    res.json({ message: 'Deleted' });
  });

  // --- Stays Routes ---
  app.get('/api/stays', async (req, res) => {
    const items = await db.all('SELECT * FROM stays WHERE user_id = ?', req.user.id);
    res.json(items);
  });

  app.post('/api/stays', async (req, res) => {
    const { name, address, check_in, check_out, booking_ref, notes, price, website, phone, email } = req.body;
    const result = await db.run(
      'INSERT INTO stays (user_id, name, address, check_in, check_out, booking_ref, notes, price, website, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, address, check_in, check_out, booking_ref, notes, price, website, phone, email]
    );
    res.json({ id: result.lastID, ...req.body });
  });

  app.put('/api/stays/:id', async (req, res) => {
    const { name, address, check_in, check_out, booking_ref, notes, price, website, phone, email } = req.body;
    await db.run(
      'UPDATE stays SET name = ?, address = ?, check_in = ?, check_out = ?, booking_ref = ?, notes = ?, price = ?, website = ?, phone = ?, email = ? WHERE id = ? AND user_id = ?',
      [name, address, check_in, check_out, booking_ref, notes, price, website, phone, email, req.params.id, req.user.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/stays/:id', async (req, res) => {
    await db.run('DELETE FROM stays WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  });

  // --- Expenses Routes ---
  app.get('/api/expenses', async (req, res) => {
    const items = await db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', req.user.id);
    res.json(items);
  });

  app.post('/api/expenses', async (req, res) => {
    const { title, amount, category, date, notes } = req.body;
    const result = await db.run(
      'INSERT INTO expenses (user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, amount, category, date, notes]
    );
    res.json({ id: result.lastID, ...req.body });
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Cron Job (Notifications)
// DISABLED for security: This broadcasts all users' data to a single topic.
// To enable, implement per-user notification topics.
/*
cron.schedule('*\/* 5 * * * *', async () => {
    if (!db || !NTFY_TOPIC) return;
    // ... existing logic ...
});
*/
