const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // store uploads in the backend/uploads directory (absolute path)
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get products with pagination, sorting, and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      search = '',
      categoryId = ''
    } = req.query;

    // Validate and coerce pagination inputs to integers
    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) limitNum = 10; // Add max limit

    const offset = (pageNum - 1) * limitNum;
    let whereClause = 'WHERE 1=1';
    let params = [];

    const searchTerm = (typeof search === 'string') ? search.trim() : '';
    if (searchTerm) {
      whereClause += ' AND (p.name LIKE ? OR c.name LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    // Validate categoryId if provided
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
      whereClause += ' AND p.category_id = ?';
      params.push(categoryIdNum);
    }

    // Validate sort parameters
  // Allow sorting by additional fields: id and updated_at
  const allowedSortFields = ['id', 'name', 'price', 'created_at', 'updated_at'];
    const allowedSortOrders = ['asc', 'desc'];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sort field' });
    }

    if (!allowedSortOrders.includes(sortOrder.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid sort order' });
    }

    const sortFieldMap = {
      'id': 'p.id',
      'name': 'p.name',
      'price': 'p.price',
      'created_at': 'p.created_at',
      'updated_at': 'p.updated_at'
    };
    const sortField = sortFieldMap[sortBy];

    // Get total count
    const [countResult] = await req.db.execute(
      `SELECT COUNT(*) as total FROM products p JOIN categories c ON p.category_id = c.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get products
    // Use validated integer literals for LIMIT/OFFSET rather than placeholders to avoid
    // driver/prepared-statement issues when mixing LIKE placeholders.
    const productsSql = `SELECT p.*, c.name as category_name FROM products p
       JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${sortField} ${sortOrder.toUpperCase()}
        LIMIT ${limitNum} OFFSET ${offset}`;
      
    const [products] = await req.db.execute(productsSql, params);

    // Normalize image paths to web-relative paths (uploads/<filename>) so the frontend
    // can request them via the /uploads static route.
    products.forEach(p => {
      if (p.image) {
        p.image = path.posix.join('uploads', path.basename(p.image));
      }
    });

    res.json({
      products,
        pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await req.db.execute(
      `SELECT p.*, c.name as category_name FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Normalize image path for the returned product
    if (products[0].image) {
      products[0].image = path.posix.join('uploads', path.basename(products[0].image));
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
  const { name, price, categoryId } = req.body;
  // Store only the uploads/<filename> path instead of an absolute filesystem path
  const image = req.file ? path.join('uploads', req.file.filename) : null;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and category ID are required' });
    }

    // Verify category exists
    const [categories] = await req.db.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (categories.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

   const insertValues = req.body.data.map(({ name, image, price, categoryId }) => [name, image, parseFloat(price), categoryId]);
      const query = `INSERT INTO products (name, image, price, category_id) VALUES ${insertValues.map((_, i) => '(?,?,?,?)').join(', ')}`;
      const [result] = await req.db.execute(query, insertValues.flat());
    
    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
  const { id } = req.params;
  const { name, price, categoryId } = req.body;
  // Store only the uploads/<filename> path instead of an absolute filesystem path
  const image = req.file ? path.join('uploads', req.file.filename) : null;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and category ID are required' });
    }

    // Verify category exists
    const [categories] = await req.db.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (categories.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    let query = 'UPDATE products SET name = ?, price = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [name, parseFloat(price), categoryId];

    if (image) {
      query = 'UPDATE products SET name = ?, image = ?, price = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP';
      params = [name, image, parseFloat(price), categoryId];
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await req.db.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await req.db.execute('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
