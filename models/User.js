const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: [true, 'İstifadəçi adı mütləqdir'],
    unique: true,
    trim: true,
    minlength: [3, 'İstifadəçi adı minimum 3 simvol olmalıdır'],
  },
  password: {
    type: String,
    required: [true, 'Şifrə mütləqdir'],
    minlength: [6, 'Şifrə minimum 6 simvol olmalıdır'],
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);