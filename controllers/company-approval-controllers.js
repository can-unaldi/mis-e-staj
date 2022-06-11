const fs = require("fs");
const nodemailer = require("nodemailer");
const uuid = require("uuid/v1");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Application = require("../models/application");
const Confirmation = require("../models/confirmation");
const Internship=require("../models/internship")
const User = require("../models/user");

const getApplicationById = async (req, res, next) => {
  const applicaitionId = req.params.iaid;

  let application;
  try {
    application = await Application.findById(applicaitionId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a application.",
      500
    );
    return next(error);
  }

  if (!application) {
    const error = new HttpError(
      "Could not find application for the provided id.",
      404
    );
    return next(error);
  }
  if (application.companyApproval == true) {
    const error = new HttpError("Application already aprroved.", 404);
    return next(error);
  }
  res.json({
    id: application._id,
    studentName: application.studentName,
    studentEmail: application.studentEmail,
    studentPhone: application.studentPhone,
    companyName: application.companyName,
    supervisorName: application.supervisorName,
    supervisorEmail: application.supervisorEmail,
    supervisorPhone: application.supervisorPhone,
    companyApproval: application.companyApproval,
  });
};

const getInternshipById = async (req, res, next) => {
  const internshipId = req.params.iid;

  let internship;
  try {
    internship = await Internship.findById(internshipId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a internship.",
      500
    );
    return next(error);
  }

  if (!internship) {
    const error = new HttpError(
      "Could not find internship for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ internship: internship.toObject({ getters: true }) });
};

const sendConfirmationMail = async (req, res, next) => {
  const applicaitionId = req.params.iaid;

  let application;
  try {
    application = await Application.findById(applicaitionId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a application.",
      500
    );
    return next(error);
  }

  if (!application) {
    const error = new HttpError(
      "Could not find application for the provided id.",
      404
    );
    return next(error);
  }
  const token = uuid();

  const createdConfirmation = new Confirmation({
    token: token,
    email: application.supervisorEmail,
    date: new Date(),
    application: application._id,
  });
  console.log(createdConfirmation);

  try {
    await createdConfirmation.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating confirmation failed, please try again.",
      500
    );
    return next(error);
  }
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME, // generated ethereal user
      pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USERNAME}>`, // sender address
    to: application.supervisorEmail, // list of receivers
    subject: "Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Staj Onayı", // Subject line
    text: `Merhabalar <b>${application.supervisorName}, >Bu mail size Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi tarafından gönderilmiştir. Mail doğrulama kodunuz: ${createdConfirmation.token}`, // plain text body
    html: `
    <p>Merhabalar <b>${application.supervisorName},</b></p>
    <p>Bu mail size <b>Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi</b> tarafından gönderilmiştir.</p>
    <p>Mail doğrulama kodunuz: ${createdConfirmation.token}</p>`, // html body
  });

  res.json({ status: true, token: createdConfirmation.token });
};

const sendEvalutionFormConfirmationMail = async (req, res, next) => {
  const internshipId = req.params.iid;

  let internship;
  try {
    internship = await Internship.findById(internshipId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a internship.",
      500
    );
    return next(error);
  }

  if (!internship) {
    const error = new HttpError(
      "Could not find internship for the provided id.",
      404
    );
    return next(error);
  }
  const token = uuid();

  const createdConfirmation = new Confirmation({
    token: token,
    email: req.query.supervisorEmail,
    date: new Date(),
    internship: internship._id,
  });
  console.log(createdConfirmation);

  try {
    await createdConfirmation.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating confirmation failed, please try again.",
      500
    );
    return next(error);
  }
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME, // generated ethereal user
      pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USERNAME}>`, // sender address
    to: req.query.supervisorEmail, // list of receivers
    subject: "Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Staj Onayı", // Subject line
    text: `Merhabalar <b>${req.query.supervisorName}, Bu mail size Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi tarafından gönderilmiştir. Mail doğrulama kodunuz: ${createdConfirmation.token}`, // plain text body
    html: `
    <p>Merhabalar <b>${req.query.supervisorName},</b></p>
    <p>Bu mail size <b>Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi</b> tarafından gönderilmiştir.</p>
    <p>Mail doğrulama kodunuz: ${createdConfirmation.token}</p>`, // html body
  });

  res.json({ status: true, token: createdConfirmation.token });
};
const getIntershipApplicationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  const {
    approved = approved == "false" ? false : true,
    companyApproval = companyApproval == "false" ? false : true,
    advisorApproval = advisorApproval == "false" ? false : true,
    intershipManagerApproval = intershipManagerApproval == "false"
      ? false
      : true,
  } = req.query;
  console.log(
    approved,
    companyApproval,
    advisorApproval,
    intershipManagerApproval
  );
  // let places;
  let userWithApplications;
  try {
    userWithApplications = await User.findById(userId, {}).populate({
      path: "applications",
      match: {
        approved: approved,
        companyApproval: companyApproval,
        advisorApproval: advisorApproval,
        intershipManagerApproval: intershipManagerApproval,
      },
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later.",
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithApplications || userWithApplications.applications.length === 0) {
    return next(
      new HttpError(
        "Could not find applications for the provided user id.",
        404
      )
    );
  }

  res.json({
    applications: userWithApplications.applications.map((application) =>
      application.toObject({ getters: true })
    ),
  });
};

const approveIntershipApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const {
    companyApproval,
    companyBankBranchName,
    companyIbanNo,
    companyTaxNo,
    confirmationToken,
    feeToStudent,
    numberOfEmployee,
  } = req.body;
  const applicaitionId = req.params.iaid;
  
  let confirmation;
  try {
    confirmation = await Confirmation.findOne({token:confirmationToken});
  } catch (err) {
    const error = new HttpError(
      "Mail doğrulaması başarılı değil",
      500
    );
    return next(error);
  }
  console.log(new Date()-confirmation.date);

  if ( new Date()-confirmation.date >180000 ) {
    const error = new HttpError(
      "Mail doğrulaması 3 dakika içerisinde yapılmalıdır.",
      404
    );
    return next(error);
  }
  else{
    console.log("if geçti");
  }

  if (confirmation.application != applicaitionId) {
    const error = new HttpError(
      "Yanlış doğrulama kodu girdiniz.",
      404
    );
    return next(error);
  }

  let application;
  try {
    application = await Application.findById(applicaitionId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  application.companyApproval = companyApproval;
  application.companyBankBranchName = companyBankBranchName;
  application.companyIbanNo = companyIbanNo;
  application.companyTaxNo = companyTaxNo;
  application.feeToStudent = feeToStudent;
  application.numberOfEmployee = numberOfEmployee;
  application.companyApprovalDate=new Date();

  try {
    await application.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({ status:true });
};
const approveIntershipEvalutionForm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const {
    workedDayDuration,
    nonWorkedDayDuration,
    attendance,
    attendanceComment,
    responsibility,
    responsibilityComment,
    workPerformance,
    workPerformanceComment,
    adaptationToAGivenTask,
    adaptationToAGivenTaskComment,
    motivation,
    motivationComment,
    abilityOfExpressingHerself,
    abilityOfExpressingHerselfComment,
    adaptationToCompanyregulations,
    adaptationToCompanyregulationsComment,
    relationsWithOtherPersonnel,
    relationsWithOtherPersonnelComment,
    notes,
    studentEvaluationApproved,
    supervisorName,
    supervisorEmail,
    supervisorPhone,
    confirmationToken
  } = req.body;
  const internshipId = req.params.iid;
  
  let confirmation;
  try {
    confirmation = await Confirmation.findOne({token:confirmationToken});
  } catch (err) {
    const error = new HttpError(
      "Mail doğrulaması başarılı değil",
      500
    );
    return next(error);
  }
  console.log(new Date()-confirmation.date);

  if ( new Date()-confirmation.date >180000 ) {
    const error = new HttpError(
      "Mail doğrulaması 3 dakika içerisinde yapılmalıdır.",
      404
    );
    return next(error);
  }
  else{
    console.log("if geçti");
  }

  if (confirmation.internship != internshipId) {
    const error = new HttpError(
      "Yanlış doğrulama kodu girdiniz.",
      404
    );
    return next(error);
  }

  let internship;
  try {
    internship = await Internship.findById(internshipId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  internship.workedDayDuration=workedDayDuration;
  internship.nonWorkedDayDuration=nonWorkedDayDuration;
  internship.attendance=attendance;
  internship.attendanceComment=attendanceComment;
  internship.responsibility=responsibility;
  internship.responsibilityComment=responsibilityComment;
  internship.workPerformance=workPerformance;
  internship.workPerformanceComment=workPerformanceComment;
  internship.adaptationToAGivenTask=adaptationToAGivenTask;
  internship.adaptationToAGivenTaskComment=adaptationToAGivenTaskComment;
  internship.motivation=motivation;
  internship.motivationComment=motivationComment;
  internship.abilityOfExpressingHerself=abilityOfExpressingHerself;
  internship.abilityOfExpressingHerselfComment=abilityOfExpressingHerselfComment;
  internship.adaptationToCompanyregulations=adaptationToCompanyregulations;
  internship.adaptationToCompanyregulationsComment=adaptationToCompanyregulationsComment;
  internship.relationsWithOtherPersonnel=relationsWithOtherPersonnel;
  internship.relationsWithOtherPersonnelComment=relationsWithOtherPersonnelComment;
  internship.notes=notes;
  internship.studentEvaluationApproved=studentEvaluationApproved;
  internship.studentEvaluationApproveDate=new Date();
  internship.studentEvaluationApproveBy=supervisorName;
  internship.supervisorName=supervisorName;
  internship.supervisorEmail=supervisorEmail;
  internship.supervisorPhone=supervisorPhone;
  internship.internEvaluationForm=true;
  try {
    await internship.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({ status:true });
};
exports.getApplicationById = getApplicationById;
exports.sendConfirmationMail = sendConfirmationMail;
exports.sendEvalutionFormConfirmationMail = sendEvalutionFormConfirmationMail;
exports.getIntershipApplicationsByUserId = getIntershipApplicationsByUserId;
exports.approveIntershipApplication = approveIntershipApplication;
exports.approveIntershipEvalutionForm = approveIntershipEvalutionForm;
exports.getInternshipById=getInternshipById;