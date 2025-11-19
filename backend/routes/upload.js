const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Configure multer for bulk upload
const upload = multer({
  dest: 'temp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Bulk upload products
router.post('/bulk-products', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const products = [];
  let processed = 0;
  let errors = [];

  try {
    const workbook = new ExcelJS.Workbook();

    if (req.file.mimetype === 'text/csv') {
      await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
    }

    const worksheet = workbook.worksheets[0];

    // Skip header row
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const name = row.getCell(1).value;
      const price = row.getCell(2).value;
      const categoryName = row.getCell(3).value;

      if (!name || !price || !categoryName) {
        errors.push({ row: rowNumber, error: 'Missing required fields (name, price, category)' });
        continue;
      }

      // Find or create category
      let [categories] = await req.db.execute('SELECT id FROM categories WHERE name = ?', [categoryName]);

      let categoryId;
      if (categories.length === 0) {
        const [result] = await req.db.execute('INSERT INTO categories (name) VALUES (?)', [categoryName]);
        categoryId = result.insertId;
      } else {
        categoryId = categories[0].id;
      }

      try {
        await req.db.execute(
          'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
          [name.toString(), parseFloat(price), categoryId]
        );
        processed++;
      } catch (error) {
        errors.push({ row: rowNumber, error: error.message });
      }
    }

    // Clean up temp file
    const fs = require('fs');
    fs.unlinkSync(filePath);

    res.json({
      message: 'Bulk upload completed',
      processed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Internal server error during bulk upload' });
  }
});

module.exports = router;
