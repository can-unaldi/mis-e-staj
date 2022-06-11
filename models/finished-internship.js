const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const finishedInternshipSchema = new Schema({
  //staj özet tablosu bilgileri
  studentName: { type: String, required: true },
  studentTC: { type: String, required: true },
  studentBday: { type: String, required: true },
  studentId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  insuranceStartDate: { type: Date, required: true },
  approvedWorkDayDuration:{ type: Number },
  companyName: { type: String, required: true },
  numberOfEmployee: { type: Number, required: true },
  companyPhone: { type: String, required: true },
  companyAddress: { type: String, required: true },
  approveDate: { type: Date,},
  //extra öğrenci bilgileri
  studentEmail: { type: String,},
  studentPhone: { type: String,},
  advisor: { type: mongoose.Types.ObjectId, ref: "User",},
  //extra staj bilgileri
  supervisorName: { type: String,},
  supervisorEmail: { type: String,},
  supervisorPhone: { type: String,},
  internshipDepartment: { type: String,},
  workedDayDurationByCompany:{ type: Number },
  nonWorkedDayDurationByCompany:{ type: Number },
  durationByStudent: { type: Number,},
  //extra bilgiler
  applicationDate: { type: Date,},
  student: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("FinishedInternship", finishedInternshipSchema);
