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

// Bütün imtahanlar — role-a görə filter
router.get('/', authMiddleware, async (req, res) => {
  try {
    let exams;

    if (req.user.role === 'admin') {
      // Admin hamısını görür
      exams = await Exam.find()
        .populate('createdBy', 'nickname role')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'teacher') {
      // Müəllim yalnız özününküləri görür
      exams = await Exam.find({ createdBy: req.user.id })
        .populate('createdBy', 'nickname role')
        .sort({ createdAt: -1 });
    } else {
      // Student hamısını görür (imtahanlara girmək üçün)
      exams = await Exam.find()
        .populate('createdBy', 'nickname role')
        .sort({ createdAt: -1 });
    }

    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// İmtahan sil (yalnız öz imtahanı və ya admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'İmtahan tapılmadı' });

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'İcazə yoxdur' });

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'İmtahan silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tək exam gətir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'nickname');
    if (!exam) return res.status(404).json({ message: 'İmtahan tapılmadı' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// İmtahan yenilə (teacher/admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'İmtahan tapılmadı' });

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'İcazə yoxdur' });

    const { title, questions } = req.body;
    exam.title = title || exam.title;
    exam.questions = questions || exam.questions;
    await exam.save();

    const updated = await Exam.findById(exam._id).populate('createdBy', 'nickname');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;