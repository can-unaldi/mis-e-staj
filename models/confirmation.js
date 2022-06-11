const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const confirmationSchema = new Schema({
  token: {type: String, required: true},
  email: {type: String, required: true},
  date: {type: Date, required: true},
  application: { type: String},
  internship: { type: String},
});

module.exports = mongoose.model('Confirmation', confirmationSchema);
