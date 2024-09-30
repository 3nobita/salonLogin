const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    birthdate: { type: Date, required: true },
    number: { type: String, required: true, unique: true } // Ensure number is unique
});

const User = mongoose.model('User', userSchema);

module.exports = User;
