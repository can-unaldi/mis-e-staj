const fs = require("fs");
const nodemailer = require("nodemailer");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Application = require("../models/application");
const User = require("../models/user");

const getIntershipApplicationById = async (req, res, next) => {
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

  res.json({ application: application.toObject({ getters: true }) });
};

const sendMailToCompany = async (req, res, next) => {
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
    text: `Merhabalar ${application.supervisorName}.Bu mail size Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi tarafından gönderilmiştir. Öğrencimiz ${application.supervisorName}'nın şirketinizde yapacağı stajı yönetim sistemimizden onaylamak için lütfen alttaki linke tıklayınız. Onay Sayfası: http://localhost:3000/company-approval/${application._id}`, // plain text body
    html: `
    <p>Merhabalar <b>${application.supervisorName},</b></p>
    <p>Bu mail size <b>Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi</b> tarafından gönderilmiştir..</p>
    <p>Öğrencimiz ${application.supervisorName}'nın şirketinizde yapacağı stajı yönetim sistemimizden onaylamak için lütfen alttaki linke tıklayınız.</p>
    <a href="${process.env.FRONT_END_URL}company-approval/${application._id}">Onay Sayfası</a>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));


  res.json({ info: info });
};
const getIntershipApplicationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithApplications;
  try {
      userWithApplications = await User.findById(userId, {
      }).populate("applications");

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

const createIntershipApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("ReqBody:", req.body);
  const {
    studentName,
    studentEmail,
    doubleMajor,
    doubleMajorDepartment,
    studentId,
    semesterCompleted,
    creditsCompleted,
    studentTC,
    studentBday,
    studentPhone,
    companyName,
    companyAddress,
    companyPhone,
    supervisorName,
    supervisorEmail,
    supervisorPhone,
    saturdayWork,
    internshipDepartment,
    internshipArea,
    startDate,
    endDate,
    duration,
    internshipDescription,
    internResponsibilities,
    supportOffered,
    studentApproval,
    advisor
  } = req.body.data;

  const createdApplication = new Application({
    studentName,
    studentEmail,
    doubleMajor: typeof doubleMajor == "boolean" ? doubleMajor : false,
    doubleMajorDepartment: doubleMajorDepartment ? doubleMajorDepartment : null,
    studentId,
    semesterCompleted,
    creditsCompleted,
    studentTC,
    studentBday,
    studentPhone,
    companyName,
    companyAddress,
    companyPhone,
    supervisorName,
    supervisorEmail,
    supervisorPhone,
    saturdayWork: typeof saturdayWork == "boolean" ? saturdayWork : false,
    internshipDepartment,
    internshipArea: typeof doubleMajor == "undefined" ? "sw" : internshipArea,
    startDate,
    endDate,
    duration,
    internshipDescription,
    internResponsibilities,
    supportOffered,
    studentApproval,
    studentDepartment: "Yönetim Bilişim Sistemleri",
    companyTaxNo: null,
    numberOfEmployee: null,
    companyBankBranchName: null,
    companyIbanNo: null,
    feeToStudent: null,
    applicationDate: new Date(),
    companyApproval: null,
    companyApprovalDate: null,
    intershipManagerName:null,
    intershipManagerApproval: null,
    intershipManagerApprovalDate: null,
    advisorName:null,
    advisorApproval: null,
    advisorApprovalDate: null,
    departmentPersonName:null,
    departmentApproval: null,
    departmentApprovalDate: null,
    insuranceCertificate:null,
    ek1Form:null,
    internshipApplicationForm:null,
    rejected:null,
    approved: null,
    rejectedMessage:null,
    rejectedDate:null,
    rejectedBy:null,
    student: req.userData.userId,
    advisor:advisor
  });

  console.log(createdApplication);
  let user;
  try {
    console.log(req.userData.userId);
    user = await User.findById(req.userData.userId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating application failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdApplication.save({ session: sess });
    user.applications.push(createdApplication);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating application failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ status: true });
};

const updateIntershipApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deleteIntershipApplication = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

exports.getIntershipApplicationById = getIntershipApplicationById;
exports.sendMailToCompany = sendMailToCompany;
exports.getIntershipApplicationsByUserId = getIntershipApplicationsByUserId;
exports.createIntershipApplication = createIntershipApplication;
exports.updateIntershipApplication = updateIntershipApplication;
exports.deleteIntershipApplication = deleteIntershipApplication;
