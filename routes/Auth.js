const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password)
      return res.status(400).json({ message: 'Nickname və şifrə mütləqdir' });

    const existingUser = await User.findOne({ nickname });
    if (existingUser)
      return res.status(400).json({ message: 'Bu istifadəçi adı artıq mövcuddur' });

    const user = new User({ nickname, password, role: 'student' });
    await user.save();

    const token = jwt.sign(
      { id: user._id, nickname: user.nickname, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Qeydiyyat uğurla tamamlandı',
      token,
      user: { id: user._id, nickname: user.nickname, role: user.role },
    });
  } catch (err) {
    console.error('REGISTER XƏTASI:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password)
      return res.status(400).json({ message: 'Nickname və şifrə daxil edilməlidir' });

    const user = await User.findOne({ nickname });
    if (!user)
      return res.status(401).json({ message: 'İstifadəçi tapılmadı' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Şifrə yanlışdır' });

    const token = jwt.sign(
      { id: user._id, nickname: user.nickname, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Uğurla daxil oldunuz',
      token,
      user: { id: user._id, nickname: user.nickname, role: user.role },
    });
  } catch (err) {
    console.error('LOGIN XƏTASI:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;