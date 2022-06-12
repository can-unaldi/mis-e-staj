const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true, unique:true},
  password: {type: String, required: true, minlength: 6},
  type:{type: Number, required: true},
  profileComplated:{type: Boolean, required: true, length: 10},
  phoneNumber:{type: String, required: false, length: 10},
  studentNumber:{type: String, required: false, length: 10,unique:true},
  tcNumber:{type: String, required: false, length: 11},
  birthDate:{type: Date, required: false, length: 11},
  department:{type: String, required: false,},
  image: { type: String, required: false },
  advisor: { type: mongoose.Types.ObjectId, ref: "User" },
  applications: [{ type: mongoose.Types.ObjectId, ref: 'Application' }],
  internships: [{ type: mongoose.Types.ObjectId, ref: 'Internship' }],
  finishedInternship: [{ type: mongoose.Types.ObjectId, ref: 'FinishedInternship' }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
