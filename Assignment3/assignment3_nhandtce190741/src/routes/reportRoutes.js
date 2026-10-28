const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', auth, reportController.getReports);
router.post('/', auth, isAdmin, reportController.createReport);

module.exports = router;
