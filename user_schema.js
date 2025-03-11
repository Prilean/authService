const schema_mongoose = require('mongoose');

const userSchema = new schema_mongoose.Schema({
    user_id: {type: Number, required: true, unique: true},
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    roles: { type: String, default: 'user' }
});

module.exports = schema_mongoose.model('user_collections', userSchema);