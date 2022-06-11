const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const internshipSchema = new Schema({
  //öğrenci bilgileri
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentId: { type: String, required: true },
  studentTC: { type: String, required: true },
  studentBday: { type: String, required: true },
  studentPhone: { type: String, required: true },
  studentDepartment: { type: String, required: true},
  //şirket bilgileri  
  //öğrenci değerlendirme
  companyName: { type: String, required: true },
  numberOfEmployee: { type: Number, required: true },
  supervisorName: { type: String, required: true },
  internshipDepartment: { type: String, required: true },

  internshipDescription:{ type: String, required: true },

  workedDayDuration:{ type: Number },
  nonWorkedDayDuration:{ type: Number },
  attendance: { type: Number },
  attendanceComment: { type: String },
  responsibility: { type: Number },
  responsibilityComment: { type: String },
  workPerformance: { type: Number },
  workPerformanceComment: { type: String },
  adaptationToAGivenTask: { type: Number },
  adaptationToAGivenTaskComment: { type: String },
  motivation: { type: Number },
  motivationComment: { type: String },
  abilityOfExpressingHerself: { type: Number },
  abilityOfExpressingHerselfComment: { type: String },
  adaptationToCompanyregulations: { type: Number },
  adaptationToCompanyregulationsComment: { type: String },
  relationsWithOtherPersonnel: { type: Number },
  relationsWithOtherPersonnelComment: { type: String },
  notes: { type: String},
  studentEvaluationApproved: { type: Boolean},
  studentEvaluationApproveDate: { type: Date},
  studentEvaluationApproveBy: { type: String},

  companyAddress: { type: String, required: true },
  companySector: { type: String },
  numberOfInterns: { type: Number },
  companySystemSpecifications: { type: String},
  descriptionOfProgram : { type: String},
  interestForIntern: { type: String},
  companyContribution: { type: String},
  wouldYouRecommend: { type: String},

  companyEvaluationApproved: { type: Boolean},
  companyEvaluationApproveDate: { type: Date},
  companyEvaluationApproveBy: { type: String},
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  companyPhone: { type: String, required: true },

  supervisorEmail: { type: String, required: true },
  supervisorPhone: { type: String, required: true },
  //başvuru bilgileri
  feeToStudent: { type: Number, required: true  },
  //data bilgileri
  advisor: { type: mongoose.Types.ObjectId, ref: "User", required: true  },
  applicationDate: { type: Date, required: true },
  companyApprovalDate: { type: Date, required: true  },
  intershipManagerApprovalDate: { type: Date, required: true  },
  advisorApprovalDate: { type: Date, required: true  },
  departmentApprovalDate: { type: Date, required: true  },
  insuranceCertificate:{ type: String, required: true  },
  internshipApplicationForm:{ type: String, required: true  },
  ek1Form:{ type: String, required: true  },

  internshipEndedDocument:{ type: Boolean},
  internshipEndedDocumentUrl:{ type: String},
  internshipReport:{ type: Boolean},
  internshipReportUrl:{ type: String},
  internEvaluationForm:{ type: Boolean},
  companyEvaluationForm:{ type: Boolean},
  payrollDocument:{ type: Boolean},
  payrollDocumentUrl:{ type: String},
  finishInternshipProcess:{ type: Boolean},
  approved: { type: Boolean},
  rejectMessage:{ type: String},
  student: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Internship", internshipSchema);
