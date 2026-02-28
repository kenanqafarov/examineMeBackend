const express = require('express');
const jwt = require('jsonwebtoken');
const Exam = require('../models/Exam');

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token yoxdur' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token etibarsızdır' });
  }
};

// İmtahan yarat (teacher/admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Yalnız müəllimlər imtahan yarada bilər' });

    const { title, questions } = req.body;
    const exam = new Exam({ title, questions, createdBy: req.user.id });
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bütün imtahanlar
router.get('/', authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'nickname role')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;