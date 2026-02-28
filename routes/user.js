const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'İcazə yoxdur' });
  next();
};

// Bütün userləri gətir (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Tək user gətir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
});

// User rolunu yenilə (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role))
      return res.status(400).json({ message: 'Yanlış rol' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
});

// User sil (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json({ message: 'İstifadəçi silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
});

module.exports = router;