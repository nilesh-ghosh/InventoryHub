const express = require('express');
const ExcelJS = require('exceljs');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Generate product report
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { format = 'xlsx', categoryId = '' } = req.query;

    let whereClause = '';
    let params = [];

    if (categoryId) {
      whereClause = 'WHERE p.category_id = ?';
      params.push(categoryId);
    }

    const [products] = await req.db.execute(
      `SELECT p.name, p.price, p.image, p.created_at, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.name ASC`,
      params
    );

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Name,Price,Category,Created At,Image\n';
      const csvData = products.map(product =>
        `"${product.name}","${product.price}","${product.category_name}","${product.created_at}","${product.image || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products_report.csv"');
      res.send(csvHeader + csvData);
    } else {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products Report');

      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Category', key: 'category_name', width: 20 },
        { header: 'Created At', key: 'created_at', width: 20 },
        { header: 'Image', key: 'image', width: 50 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Add data
      products.forEach(product => {
        worksheet.addRow({
          name: product.name,
          price: product.price,
          category_name: product.category_name,
          created_at: product.created_at,
          image: product.image || ''
        });
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="products_report.xlsx"');

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
