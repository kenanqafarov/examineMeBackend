const express = require('express');
const jwt = require('jsonwebtoken');
const Result = require('../models/Result');
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

// Nəticə göndər
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'İmtahan tapılmadı' });

    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correct) score++;
    });

    const existing = await Result.findOne({ exam: examId, student: req.user.id });
    if (existing) {
      existing.answers = answers;
      existing.score = score;
      existing.total = exam.questions.length;
      existing.submittedAt = new Date();
      await existing.save();
      return res.json(existing);
    }

    const result = new Result({
      exam: examId,
      student: req.user.id,
      answers,
      score,
      total: exam.questions.length,
    });
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin — bütün nəticələr
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'teacher'].includes(req.user.role))
      return res.status(403).json({ message: 'İcazə yoxdur' });

    const results = await Result.find()
      .populate('student', 'nickname')
      .populate({
        path: 'exam',
        select: 'title questions createdBy',
        populate: { path: 'createdBy', select: 'nickname' },
      })
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tək exam nəticələri
router.get('/exam/:examId', authMiddleware, async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.examId })
      .populate('student', 'nickname')
      .sort({ score: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Studentin öz nəticəsi
router.get('/my/:examId', authMiddleware, async (req, res) => {
  try {
    const result = await Result.findOne({
      exam: req.params.examId,
      student: req.user.id,
    }).populate('exam');
    if (!result) return res.status(404).json({ message: 'Nəticə tapılmadı' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;