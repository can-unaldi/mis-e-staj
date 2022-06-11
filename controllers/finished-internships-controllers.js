const fs = require("fs");
const nodemailer = require("nodemailer");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Application = require("../models/application");
const Internship = require("../models/internship");
const User = require("../models/user");
const FinishedInternship = require("../models/finished-internship");
const uuid = require("uuid/v1");

const readXlsxFile = require("read-excel-file/node");

var Docxtemplater = require("docxtemplater");
var PizZip = require("pizzip");
const { v1: uuidv1 } = require("uuid");
const { saveAs } = require("file-saver");
var path = require("path");

var moment = require("moment-business-days");

moment.updateLocale("tr", {
  workingWeekdays: [1, 2, 3, 4, 5, 6],
});

const getInternshipById = async (req, res, next) => {
  const internshipId = req.params.iid;
  console.log("girdi");
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

const sendMailToCompany = async (req, res, next) => {
  const applicaitionId = req.params.iid;

  let internship;
  try {
    internship = await Application.findById(applicaitionId);
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
    to: internship.supervisorEmail, // list of receivers
    subject: "Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Staj Onayı", // Subject line
    text: `Merhabalar ${internship.supervisorName}.Bu mail size Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi tarafından gönderilmiştir. Öğrencimiz ${internship.supervisorName}'nın şirketinizde yapacağı stajı yönetim sistemimizden onaylamak için lütfen alttaki linke tıklayınız. Onay Sayfası: ${process.env.FRONT_END_URL}company-approval/${internship._id}`, // plain text body
    html: `
    <p>Merhabalar <b>${internship.supervisorName},</b></p>
    <p>Bu mail size <b>Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Bölümü Staj Yönetim Sistemi</b> tarafından gönderilmiştir..</p>
    <p>Öğrencimiz ${internship.supervisorName}'nın şirketinizde yapacağı stajı yönetim sistemimizden onaylamak için lütfen alttaki linke tıklayınız.</p>
    <a href="${process.env.FRONT_END_URL}company-approval/${internship._id}">Onay Sayfası</a>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  res.json({ info: info });
};
const getFinishedIntershipsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithFinishedInternships;
  try {
    userWithFinishedInternships = await User.findById(userId).populate(
      "finishedInternship"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching internships failed, please try again later.",
      500
    );
    return next(error);
  }

  if (
    !userWithFinishedInternships ||
    userWithFinishedInternships.finishedInternship.length === 0
  ) {
    return next(
      new HttpError("Could not find internships for the provided user id.", 404)
    );
  }

  res.json({
    internships: userWithFinishedInternships.finishedInternship.map(
      (finishedInternship) => finishedInternship.toObject({ getters: true })
    ),
  });
};

const getFinishedInterships = async (req, res, next) => {
  let finishedInternships;
  try {
    finishedInternships = await FinishedInternship.find();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching internships failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!finishedInternships || finishedInternships.length === 0) {
    return next(new HttpError("Could not find internships.", 404));
  }
  res.json({
    internships: finishedInternships,
  });
};

const createFinishedInternship = async (
  internship,
  approvedWorkDay,
  req,
  res,
  next
) => {
  const createdInternship = new FinishedInternship({
    studentName: internship.studentName,
    studentTC: internship.studentTC,
    studentBday: internship.studentBday,
    studentId: internship.studentId,
    startDate: internship.startDate,
    endDate: internship.endDate,
    insuranceStartDate: internship.startDate,
    approvedWorkDayDuration: approvedWorkDay,
    companyName: internship.companyName,
    numberOfEmployee: internship.numberOfEmployee,
    companyPhone: internship.companyPhone,
    companyAddress: internship.companyAddress,
    approveDate: new Date(),
    studentEmail: internship.studentEmail,
    studentPhone: internship.studentPhone,
    advisor: internship.advisor,
    supervisorName: internship.supervisorName,
    supervisorEmail: internship.supervisorEmail,
    supervisorPhone: internship.supervisorPhone,
    internshipDepartment: internship.internshipDepartment,
    workedDayDurationByCompany: internship.workedDayDuration,
    nonWorkedDayDurationByCompany: internship.nonWorkedDayDuration,
    durationByStudent: internship.duration,
    applicationDate: internship.applicationDate,
    student: internship.student,
  });

  let user;
  try {
    user = await User.findById(internship.student);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating finished Internship failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdInternship.save({ session: sess });
    user.finishedInternship.push(createdInternship);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating finished internships failed, please try again.",
      500
    );
    return next(error);
  }
};

const updateInternship = async (req, res, next) => {
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

const approveCompanyEvalutionForm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const {
    companySector,
    numberOfInterns,
    companySystemSpecifications,
    descriptionOfProgram,
    interestForIntern,
    companyContribution,
    wouldYouRecommend,
    companyEvaluationApproved,
  } = req.body;
  const internshipId = req.params.iid;

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

  // if (internship.student.toString() !== req.userData.userId) {
  //   const error = new HttpError(
  //     "You are not allowed to edit this internship.",
  //     401
  //   );
  //   return next(error);
  // }

  internship.companySector = companySector;
  internship.numberOfInterns = numberOfInterns;
  internship.companySystemSpecifications = companySystemSpecifications;
  internship.descriptionOfProgram = descriptionOfProgram;
  internship.interestForIntern = interestForIntern;
  internship.companyContribution = companyContribution;
  internship.wouldYouRecommend = wouldYouRecommend;
  internship.companyEvaluationApproved = companyEvaluationApproved;
  internship.companyEvaluationApproveDate = new Date();
  internship.companyEvaluationApproveBy = internship.studentName;
  internship.companyEvaluationForm = true;

  try {
    await internship.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({ internship: internship.toObject({ getters: true }) });
};

const deleteInternship = async (req, res, next) => {
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

const sendIntershipToApproval = async (req, res, next) => {
  const internshipId = req.params.iid;

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

  internship.finishInternshipProcess = true;

  try {
    await internship.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({ internship: internship.toObject({ getters: true }) });
};

const uploadInternshipEndedDocument = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const internshipId = req.params.iid;
  console.log("ReqBody:", req.file);
  console.log("IntId:", internshipId);

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

  internship.internshipEndedDocumentUrl = req.file.path;
  internship.internshipEndedDocument = true;

  try {
    await internship.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    status: true,
    message: "Dosya başarı ile yüklendi.",
    internship: internship.toObject({ getters: true }),
  });
};
const uploadInternshipReport = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const internshipId = req.params.iid;
  console.log("ReqBody:", req.file);
  console.log("IntId:", internshipId);

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

  internship.internshipReportUrl = req.file.path;
  internship.internshipReport = true;

  try {
    await internship.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    status: true,
    message: "Dosya başarı ile yüklendi.",
    internship: internship.toObject({ getters: true }),
  });
};
const uploadPayrollDocument = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const internshipId = req.params.iid;
  console.log("ReqBody:", req.file);
  console.log("IntId:", internshipId);

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

  internship.payrollDocumentUrl = req.file.path;
  internship.payrollDocument = true;

  try {
    await internship.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    status: true,
    message: "Dosya başarı ile yüklendi.",
    internship: internship.toObject({ getters: true }),
  });
};

const downloadAllInternshipDocuments = async (req, res, next) => {
  const internshipId = req.params.iid;
  console.log("istek geldi");
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
  var companyEvaluationFormPath = await createCompanyEvalutionForm(internship);
  var internEvaluationFormPath = await createInternEvalutionForm(internship);

  var zip = new PizZip();
  const companyEvaluationForm = fs.readFileSync(
    path.resolve(__dirname, `../${companyEvaluationFormPath}`)
  );
  const internEvaluationForm = fs.readFileSync(
    path.resolve(__dirname, `../${internEvaluationFormPath}`)
  );
  const insuranceCertificate = fs.readFileSync(
    path.resolve(__dirname, `../${internship.insuranceCertificate}`)
  );
  const internshipApplicationForm = fs.readFileSync(
    path.resolve(__dirname, `../${internship.internshipApplicationForm}`)
  );
  const ek1Form = fs.readFileSync(
    path.resolve(__dirname, `../${internship.ek1Form}`)
  );
  const internshipEndedDocument = fs.readFileSync(
    path.resolve(__dirname, `../${internship.internshipEndedDocumentUrl}`)
  );
  const internshipReport = fs.readFileSync(
    path.resolve(__dirname, `../${internship.internshipReportUrl}`)
  );
  const payrollDocument = fs.readFileSync(
    path.resolve(__dirname, `../${internship.payrollDocumentUrl}`)
  );
  zip.file(
    `companyEvaluationForm.${companyEvaluationFormPath.split(".")[1]}`,
    companyEvaluationForm
  );
  zip.file(
    `internEvaluationForm.${internEvaluationFormPath.split(".")[1]}`,
    internEvaluationForm
  );
  zip.file(
    `insuranceCertificate.${internship.insuranceCertificate.split(".")[1]}`,
    insuranceCertificate
  );
  zip.file(
    `internshipApplicationForm.${
      internship.internshipApplicationForm.split(".")[1]
    }`,
    internshipApplicationForm
  );
  zip.file(`ek1Form.${internship.ek1Form.split(".")[1]}`, ek1Form);
  zip.file(
    `internshipEndedDocument.${
      internship.internshipEndedDocumentUrl.split(".")[1]
    }`,
    internshipEndedDocument
  );
  zip.file(
    `internshipReport.${internship.internshipReportUrl.split(".")[1]}`,
    internshipReport
  );
  zip.file(
    `payrollDocument.${internship.payrollDocumentUrl.split(".")[1]}`,
    payrollDocument
  );

  // console.log(zip);
  var content = zip.generate({ type: "nodebuffer" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="InternshipDocumnets.zip"`
  );
  console.log(content);
  res.send(content);
};

const createCompanyEvalutionForm = async (internship) => {
  const content = fs.readFileSync(
    path.resolve(__dirname, "../public/files/companyEvaluationForm.docx"),
    "binary"
  );
  var zipp = new PizZip(content);
  var doc;
  try {
    doc = new Docxtemplater(zipp);
  } catch (error) {
    console.log(error);
  }

  doc.setData({
    studentName: internship.studentName,
    companyName: internship.companyName,
    companyAddress: internship.companyAddress,
    companySector: internship.companySector,
    numberOfEmployee: internship.numberOfEmployee,
    numberOfInterns: internship.numberOfInterns,
    companySystemSpecifications: internship.companySystemSpecifications,
    descriptionOfProgram: internship.descriptionOfProgram,
    interestForIntern: internship.interestForIntern,
    companyContribution: internship.companyContribution,
    wouldYouRecommend: internship.wouldYouRecommend,
    studentName2: internship.studentName,
    companyEvaluationApproveDate: moment(
      internship.companyEvaluationApproveDate
    ).format("DD/MM/YYYY"),
  });
  try {
    doc.render();
  } catch (error) {
    console.log(error);
  }
  var buf = doc.getZip().generate({ type: "nodebuffer" });
  var uuid = uuidv1();
  var file = fs.writeFileSync(
    path.resolve(
      __dirname,
      `../public/documents/${internship.studentName.replace(
        /[^A-Z0-9]+/gi,
        "_"
      )}-CompanyEvaluationForm-${uuid}.docx`
    ),
    buf
  );
  return `public/documents/${internship.studentName.replace(
    /[^A-Z0-9]+/gi,
    "_"
  )}-CompanyEvaluationForm-${uuid}.docx`;
};

const createInternEvalutionForm = async (internship) => {
  const content = fs.readFileSync(
    path.resolve(__dirname, "../public/files/internEvaluationForm.docx"),
    "binary"
  );
  var zipp = new PizZip(content);
  var doc;
  try {
    doc = new Docxtemplater(zipp);
  } catch (error) {
    console.log(error);
  }

  doc.setData({
    companyName: internship.companyName,
    supervisorName: internship.supervisorName,
    supervisorEmail: internship.supervisorEmail,
    supervisorPhone: internship.supervisorPhone,
    studentName: internship.studentName,
    internshipDepartment: internship.internshipDepartment,
    internshipDescription: internship.internshipDescription,
    workedDayDuration: internship.workedDayDuration,
    nonWorkedDayDuration: internship.nonWorkedDayDuration,

    attendance:
      internship.attendance == 1
        ? "Yetersiz"
        : internship.attendance == 2
        ? "Orta"
        : "İyi",
    responsibility:
      internship.responsibility == 1
        ? "Yetersiz"
        : internship.responsibility == 2
        ? "Orta"
        : "İyi",
    workPerformance:
      internship.workPerformance == 1
        ? "Yetersiz"
        : internship.workPerformance == 2
        ? "Orta"
        : "İyi",
    adaptationToAGivenTask:
      internship.adaptationToAGivenTask == 1
        ? "Yetersiz"
        : internship.adaptationToAGivenTask == 2
        ? "Orta"
        : "İyi",
    motivation:
      internship.motivation == 1
        ? "Yetersiz"
        : internship.motivation == 2
        ? "Orta"
        : "İyi",
    abilityOfExpressingHerself:
      internship.abilityOfExpressingHerself == 1
        ? "Yetersiz"
        : internship.abilityOfExpressingHerself == 2
        ? "Orta"
        : "İyi",
    adaptationToCompanyregulations:
      internship.adaptationToCompanyregulations == 1
        ? "Yetersiz"
        : internship.adaptationToCompanyregulations == 2
        ? "Orta"
        : "İyi",
    relationsWithOtherPersonnel:
      internship.relationsWithOtherPersonnel == 1
        ? "Yetersiz"
        : internship.relationsWithOtherPersonnel == 2
        ? "Orta"
        : "İyi",

    attendanceComment: internship.attendanceComment,
    responsibilityComment: internship.responsibilityComment,
    workPerformanceComment: internship.workPerformanceComment,
    adaptationToAGivenTaskComment: internship.adaptationToAGivenTaskComment,
    motivationComment: internship.motivationComment,
    abilityOfExpressingHerselfComment:
      internship.abilityOfExpressingHerselfComment,
    adaptationToCompanyregulationsComment:
      internship.adaptationToCompanyregulationsComment,
    relationsWithOtherPersonnelComment:
      internship.relationsWithOtherPersonnelComment,

    notes: internship.notes,
    studentEvaluationApproveDate: moment(
      internship.studentEvaluationApproveDate
    ).format("DD/MM/YYYY"),
  });
  try {
    doc.render();
  } catch (error) {
    console.log(error);
  }
  var buf = doc.getZip().generate({ type: "nodebuffer" });
  var uuid = uuidv1();
  var file = fs.writeFileSync(
    path.resolve(
      __dirname,
      `../public/documents/${internship.studentName.replace(
        /[^A-Z0-9]+/gi,
        "_"
      )}-InternEvaluationForm-${uuid}.docx`
    ),
    buf
  );
  return `public/documents/${internship.studentName.replace(
    /[^A-Z0-9]+/gi,
    "_"
  )}-InternEvaluationForm-${uuid}.docx`;
};

const getSendedInterships = async (req, res, next) => {
  let internships;
  console.log("girdi");
  try {
    internships = await Internship.find({
      internshipEndedDocument: true,
      internshipReport: true,
      internEvaluationForm: true,
      companyEvaluationForm: true,
      finishInternshipProcess: true,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching internships failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!internships || internships.length === 0) {
    return next(new HttpError("Could not find internships.", 404));
  }

  res.json({
    internships: internships,
  });
};

const approveInternship = async (req, res, next) => {
  const internshipId = req.params.iid;

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

  internship.approved = true;

  try {
    await internship.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update internship.",
      500
    );
    return next(error);
  }

  res.status(200).json({ internship: internship.toObject({ getters: true }) });
};

const createFinishedInternships = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:createFinishedInternships");
  let users;
  try {
    users = await User.find({ type: 0 });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  let internships = [];
  try {
    readXlsxFile(req.file.path).then((rows) => {
      // skip header
      rows.shift();
      users.forEach((user) => {
        rows.forEach((row) => {
          console.log("Şirket Adı:", row[8]);
          console.log("Öğrenci Numarası 1:", user.studentNumber);
          console.log("Öğrenci Numarası 2:", row[3]);
          if (user.studentNumber === row[3].toString()) {
            var internship = new FinishedInternship({
              studentName: row[0],
              studentTC: row[1],
              studentBday: row[2],
              studentId: row[3],
              startDate: row[4],
              endDate: row[5],
              insuranceStartDate: row[6],
              approvedWorkDayDuration: row[7],
              companyName: row[8],
              numberOfEmployee: row[9],
              companyPhone: row[10],
              companyAddress: row[11],
              approveDate: new Date(),
              internshipEndedDocument: true,
              internshipReport: true,
              internEvaluationForm: true,
              companyEvaluationForm: true,
              finishInternshipProcess: true,
              student: user._id,
            });
            internships.push(internship);
            user.finishedInternship.push(internship);
          }
        });
          user.save();
      });
      FinishedInternship.insertMany(
        internships,
        { ordered: false },
        function (err, docs) {
          if (err) {
            console.log("Err2:", err);
            const error = new HttpError(
              "Something went wrong, could not create users.",
              500
            );
            return next(error);
          } else {
            console.log("Docs:", docs);
            res.status(200).json({
              status: true,
              message: "Stajlar başarı ile oluşturuldu",
            });
          }
        }
      );
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not create users.",
      500
    );
    return next(error);
  }
};

exports.getInternshipById = getInternshipById;
exports.sendMailToCompany = sendMailToCompany;
exports.getFinishedIntershipsByUserId = getFinishedIntershipsByUserId;
exports.getFinishedInterships = getFinishedInterships;
exports.createFinishedInternship = createFinishedInternship;
exports.updateInternship = updateInternship;
exports.deleteInternship = deleteInternship;
exports.sendIntershipToApproval = sendIntershipToApproval;
exports.approveCompanyEvalutionForm = approveCompanyEvalutionForm;
exports.uploadInternshipEndedDocument = uploadInternshipEndedDocument;
exports.uploadInternshipReport = uploadInternshipReport;
exports.uploadPayrollDocument = uploadPayrollDocument;
exports.downloadAllInternshipDocuments = downloadAllInternshipDocuments;
exports.getSendedInterships = getSendedInterships;
exports.approveInternship = approveInternship;
exports.createFinishedInternships = createFinishedInternships;
