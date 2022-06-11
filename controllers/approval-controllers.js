const fs = require("fs");
const nodemailer = require("nodemailer");

const moment = require("moment");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
var ObjectId = require("mongoose").Types.ObjectId;

const HttpError = require("../models/http-error");
const Application = require("../models/application");
const User = require("../models/user");
const internshipController= require("../controllers/internships-controllers");
var Docxtemplater = require("docxtemplater");
var PizZip = require("pizzip");
const { v1: uuidv1 } = require("uuid");
const { saveAs } = require("file-saver");
var path = require("path");

const getAllApplications = async (req, res, next) => {
  const status = req.query.userType;

  let application;
  try {
    application = await Application.findAll({});
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

const getAdvisorApplications = async (req, res, next) => {
  const advisorId = req.params.advisorId;
  const status = req.query.status;
  // let pces;
  let applications;
  if (status === "approved") {
    try {
      applications = await Application.find({
        advisor: new ObjectId(advisorId),
        advisorApproval: true,
        companyApproval: true,
        rejected: null,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else if (status === "rejected") {
    try {
      applications = await Application.find({
        advisor: new ObjectId(advisorId),
        companyApproval: true,
        rejected: true,
        rejectedBy: new ObjectId(advisorId),
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else {
    try {
      applications = await Application.find({
        advisor: new ObjectId(advisorId),
        companyApproval: true,
        advisorApproval: null,
        rejected: null,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  // if (!applications || applications.length === 0) {
  if (!applications || applications.length === 0) {
    return next(
      new HttpError(
        "Could not find applications for the provided user id.",
        404
      )
    );
  }

  res.json({
    applications: applications,
  });
};

const getDepartmentApplications = async (req, res, next) => {
  const status = req.query.status;
  // let applications;
  let applications;
  if (status === "approved") {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        departmentApproval: true,
        rejected: null,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else if (status === "rejected") {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        rejected: true,
        rejectedBy: new ObjectId(req.userData.userId),
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        departmentApproval: null,
        rejected: null,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  // if (!applications || applications.length === 0) {
  if (!applications || applications.length === 0) {
    return next(new HttpError("Could not find applications.", 404));
  }

  res.json({
    applications: applications,
  });
};

const getManagerApplications = async (req, res, next) => {
  const status = req.query.status;
  // let applications;
  let applications;
  if (status === "approved") {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        departmentApproval: true,
        intershipManagerApproval: true,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else if (status === "rejected") {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        departmentApproval: true,
        rejected: true,
        rejectedBy: new ObjectId(req.userData.userId),
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  } else {
    try {
      applications = await Application.find({
        companyApproval: true,
        advisorApproval: true,
        departmentApproval: true,
        intershipManagerApproval: null,
        rejected: null,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching applications failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  // if (!applications || applications.length === 0) {
  if (!applications || applications.length === 0) {
    return next(new HttpError("Could not find applications.", 404));
  }

  res.json({
    applications: applications,
  });
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

  // let applications;
  let userWithApplications;
  try {
    userWithApplications = await User.findById(userId, {}).populate(
      "applications"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching applications failed, please try again later.",
      500
    );
    return next(error);
  }

  // if (!applications || applications.length === 0) {
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

const advisorAprrove = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { advisorApproval, advisorId, name } = req.body;
  const applicationId = req.params.iaid;

  let application;
  try {
    application = await Application.findById(applicationId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  if (application.advisor.toString() !== advisorId) {
    const error = new HttpError(
      "You are not allowed to edit this application.",
      401
    );
    return next(error);
  }
  application.advisorName = name;
  application.advisorApproval = advisorApproval;
  application.advisorApprovalDate = new Date();

  try {
    await application.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    message: "Staj başvurusu başarı ile onaylandı.",
    application: application.toObject({ getters: true }),
  });
};

const approveApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { approval,name } = req.body;
  const applicationId = req.params.iaid;

  let application;
  try {
    application = await Application.findById(applicationId);
  } catch (err) {
    console.log("err1:",err)
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  if (req.query.manager === "true") {
    application.intershipManagerApproval = approval;
    application.intershipManagerName = name;
    application.intershipManagerApprovalDate = new Date();
    application.ek1Form=await createEk1DocumentAndSend(application);
    application.internshipApplicationForm=await createInternshipApplicationForm(application);
  } else {
    application.departmentPersonName = name;
    application.departmentApproval = approval;
    application.departmentApprovalDate = new Date();
  }

  try {
    await application.save();
  } catch (err) {
    console.log("err2:",err)
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    message: "Staj başvurusu başarı ile onaylandı.",
    application: application.toObject({ getters: true }),
  });
};

const rejectApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { rejectedMessage, userId } = req.body;
  const applicationId = req.params.iaid;

  let application;
  try {
    application = await Application.findById(applicationId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  if (
    req.query.advisor === "true" &&
    application.advisor.toString() !== userId
  ) {
    const error = new HttpError(
      "You are not allowed to reject this application.",
      401
    );
    return next(error);
  }

  application.approved = false;
  application.rejected = true;
  application.rejectedDate = new Date();
  application.rejectedMessage = rejectedMessage;
  application.rejectedBy = new ObjectId(userId);

  try {
    await application.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    message: "Staj başvurusu başarı ile reddedildi.",
    application: application.toObject({ getters: true }),
  });
};

const createInternshipApplicationForm = async (application) => {
  const content = fs.readFileSync(
    path.resolve(__dirname, "../public/files/InternshipApplicationForm.docx"),
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
    studentName: application.studentName,
    studentEmail:application.studentEmail,
    doubleMajorYes: application.doubleMajor?"X":"",
    doubleMajorNo: application.doubleMajor?"":"X",
    doubleMajorDepartment: application.doubleMajorDepartment?application.doubleMajorDepartment:"",
    studentId: application.studentId,
    semesterCompleted: application.semesterCompleted,
    creditsCompleted: application.creditsCompleted,
    companyName: application.companyName,
    supervisorName: application.supervisorName,
    supervisorEmail: application.supervisorEmail, 
    supervisorPhone: application.supervisorPhone, 
    saturdayWorkFull: application.saturdayWork?"X":"",
    saturdayWorkHalf: application.saturdayWork?"X":"",
    saturdayWorkNo: application.saturdayWork?"":"X",

    internshipDepartment: application.internshipDepartment,
    internshipArea: application.internshipArea.toUpperCase(),
    startDate: moment(application.startDate).format("DD/MM/YYYY"),
    endDate: moment(application.endDate).format("DD/MM/YYYY"),
    duration: application.duration,
    internshipDescription: application.internshipDescription, 
    internResponsibilities: application.internResponsibilities,
    supportOffered: application.supportOffered,

    companyApprovalDate: moment(application.companyApprovalDate).format("DD/MM/YYYY"),
    intershipManagerName: application.intershipManagerName,
    intershipManagerApprovalDate: moment(application.intershipManagerApprovalDate).format("DD/MM/YYYY"),
    advisorName: application.advisorName,
    advisorApprovalDate: moment(application.advisorApprovalDate).format("DD/MM/YYYY"),
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
      `../public/documents/${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-InternshipApplicationForm-${uuid}.docx`
    ),
    buf
  );
  console.log(file)
  return `public/documents/${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-InternshipApplicationForm-${uuid}.docx`;
};
const createEk1DocumentAndSend = async (application) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME, // generated ethereal user
      pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
  });

  const content = fs.readFileSync(
    path.resolve(__dirname, "../public/files/ek-1.docx"),
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
    studentName: application.studentName,
    studentTC: application.studentTC,
    studentBday: moment(application.studentBday).format("DD/MM/YYYY"),
    studentId: application.studentId,
    studentEmail: application.studentEmail,
    studentDepartment: application.studentDepartment,
    studentPhone: application.studentPhone,
    companyTaxNo: application.companyTaxNo,
    companyName: application.companyName,
    numberOfEmployee: application.numberOfEmployee,
    companyPhone: application.companyPhone,
    companyAddress: application.companyAddress,
    companyBankBranchName: application.companyBankBranchName,
    companyIbanNo: application.companyIbanNo,
    feeToStudent: application.feeToStudent,
    startDate: moment(application.startDate).format("DD/MM/YYYY"),
    endDate: moment(application.endDate).format("DD/MM/YYYY"),
    duration: application.duration,
    studentName2: application.studentName,
    applicationDate: moment(application.applicationDate).format("DD/MM/YYYY"),
    departmentManager: application.departmentPersonName,
    departmentApprovalDate: moment(application.departmentApprovalDate).format(
      "DD/MM/YYYY"
    ),
    companyName2: application.companyName,
    supervisorName: application.supervisorName,
    companyApprovalDate: moment(application.companyApprovalDate).format(
      "DD/MM/YYYY"
    ),
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
      `../public/documents/${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-ek1-${uuid}.docx`
    ),
    buf
  );

  const fileToSend = fs.readFileSync(
    path.resolve(__dirname, `../public/documents/${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-ek1-${uuid}.docx`),
    "binary"
  );

  transporter.sendMail(
    {
      from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USERNAME}>`, // sender address
      to: process.env.HESAP_ISLERI_MAIL, // list of receivers
      subject:
        "Yönetim Bilişim Sistemleri Bölümü Staj Başvurusu", // Subject line
      text: `Merhabalar, Öğrencimiz ${application.studentName}'in sigartası için gerekli olan belge eklerdedir. Gereğinin yapılmasını arz ederiz. Yönetim Bilişim Sistemleri Staj Yönetim Sistemi`, // plain text body
      html: `
      <p>Merhabalar,</p>
      <p>Öğrencimiz ${application.studentName}'in sigartası için gerekli olan belge eklerdedir.</p>
      <p>Gereğinin yapılmasını arz ederiz.</p>
      <p>Yönetim Bilişim Sistemleri Staj Yönetim Sistemi</p>
      `, // html body
      attachments: [
        {
          // stream as an attachment
          filename: `${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-ek1-${uuid}.docx`,
          content: fileToSend,
          encoding: 'binary'
        },
      ],
    },
    function (err, info) {
      if (err) {
        console.log(err);
        const error = new HttpError(err.message, 500);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
    );
    return `public/documents/${application.studentName.replace(/[^A-Z0-9]+/ig, "_")}-ek1-${uuid}.docx`;
  // fs.readFile(
  //   path.resolve(__dirname, `../documents/ek-1-${application.studentName}.docx`),
  //   (err, data) => {
  //     if (err) {
  //       return next(err);
  //     }
  //     var content = zip.generate({ type: "nodebuffer" });
  //     res.setHeader("Content-Type", "application/zip");
  //     res.setHeader(
  //       "Content-Disposition",
  //       `attachment; filename="ek-1-${application.studentName}.docx"`
  //     );
  //     res.send(content);
  //   }
  // );
};
const uploadInsuranceCertificate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const applicationId = req.params.iaid;
  console.log("ReqBody:", req.file);
  console.log("AppId:", applicationId);

  let application;
  try {
    application = await Application.findById(applicationId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  application.insuranceCertificate = req.file.path;
  application.approved = true;
  application.rejected = false;
  internshipController.createInternship(application, req.userData.userId);
  try {
    await application.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update application.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    status: true,
    message: "Dosya başarı ile yüklendi.",
    application: application.toObject({ getters: true }),
  });
};

exports.getAllApplications = getAllApplications;
exports.getAdvisorApplications = getAdvisorApplications;
exports.getDepartmentApplications = getDepartmentApplications;
exports.getManagerApplications = getManagerApplications;

exports.sendMailToCompany = sendMailToCompany;
exports.getIntershipApplicationsByUserId = getIntershipApplicationsByUserId;
exports.advisorAprrove = advisorAprrove;
exports.approveApplication = approveApplication;
exports.rejectApplication = rejectApplication;
exports.uploadInsuranceCertificate = uploadInsuranceCertificate;
