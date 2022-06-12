const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const base64 = require("node-base64-image");
const uuid = require("uuid/v1");
const fs = require("fs");
var XLSX = require("xlsx");
const readXlsxFile = require("read-excel-file/node");
var mongoose = require("mongoose");
const Confirmation = require("../models/confirmation");
const nodemailer = require("nodemailer");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const createUsers = async (req, res, next) => {
  console.log("Girdi:createUsers");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let advisors;
  try {
    advisors = await User.find(
      { type: 1 },
      "-password -image -applications -internships -finishedInternship"
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching advisors failed, please try again later.",
      500
    );
    return next(error);
  }
  let processFinished = false;
  let users = [];
  console.log(req.file);
  try {
    await readXlsxFile(req.file.path).then((rows) => {
      // skip header
      rows.shift();
      for (const row of rows) {
        console.log("Girdi:Rows");
        let advisor;
        bcrypt.hash(row[2].toString(), 12, function (err, hash) {
          console.log("Girdi:Hash");

          for (const adv of advisors) {
            console.log("Girdi:Advisor");

            if (adv.email == row[3]) {
              console.log("Girdi:Advisor Mached");

              advisor = mongoose.Types.ObjectId(adv._id);
              let user = {
                name: row[0],
                email: row[1],
                password: hash,
                type: 0,
                profileComplated: false,
                phoneNumber: null,
                studentNumber: row[2],
                tcNumber: null,
                birthDate: null,
                department: null,
                image: null,
                advisor: advisor || null,
                applications: [],
                internships: [],
                finishedInternship: [],
              };
              users.push(user);
              if (users.length == rows.length - 1) {
                User.insertMany(
                  users,
                  { ordered: false },
                  function (err, docs) {
                    if (err) {
                      console.log(err);
                      const error = new HttpError(
                        "Something went wrong, could not create users.",
                        500
                      );
                      return next(error);
                    } else {
                      console.log("Users:", users);
                      console.log("Docs:", docs);
                      res.status(200).json({
                        status: true,
                        message: "Kullanıcılar başarı ile oluşturuldu",
                      });
                    }
                  }
                );
              }
            }
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Kullanıcılar oluşturulamadı. Öğrenci numaralarını ve danışman mail adreslerini kontrol ediniz.",
      500
    );
    return next(error);
  }

  if (users.length == 0) {
  }
};

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find(
      {},
      "-password -image -applications -internships -finishedInternship"
    ).populate("advisor");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getAdvisors = async (req, res, next) => {
  let users;
  try {
    users = await User.find(
      {type:1},
      "-password -image -applications -internships -finishedInternship"
    ).populate("advisor");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ advisors: users.map((user) => user.toObject({ getters: true })) });
};
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password, type, advisor } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    type,
    profileComplated: type != 0 ? true : false,
    phoneNumber: null,
    studentNumber: type != 0 ? null : password,
    tcNumber: null,
    birthDate: null,
    department: null,
    image: null,
    advisor: advisor || null,
    applications: [],
    internships: [],
    finishedInternship: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    name: existingUser.name,
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    type: existingUser.type,
    image: existingUser.image,
    profileComplated: existingUser.profileComplated,
    advisor: existingUser.advisor,
  });
};
const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:updateUser");

  const { phoneNumber, studentNumber, tcNumber, birthDate, image } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }
  console.log(req.body, user);

  user.profileComplated = true;
  user.phoneNumber = phoneNumber;
  user.studentNumber = studentNumber;
  user.tcNumber = tcNumber;
  user.birthDate = birthDate;
  user.department = "Yönetim Bilişim Sistemleri";
  user.image = image;
  console.log(user);
  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateUserByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:updateUserByAdmin");

  const { name, email, type } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }
  console.log(req.body, user);

  user.name = name;
  user.email = email;
  user.type = type;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateStudentByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:updateStudentByAdmin");

  const {
    name,
    email,
    advisor,
    phoneNumber,
    studentNumber,
    tcNumber,
    birthDate,
  } = req.body;
  const userId = req.params.uid;
  console.log(req.body);
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }
  user.name = name;
  user.email = email;
  user.phoneNumber = phoneNumber;
  user.studentNumber = studentNumber;
  user.tcNumber = tcNumber;
  user.birthDate = birthDate;
  user.department = "Yönetim Bilişim Sistemleri";
  user.advisor = mongoose.Types.ObjectId(advisor);
  console.log(user);
  try {
    await user.save();
  } catch (err) {
    console.log("Err:", err);
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete user.",
      500
    );
    return next(error);
  }

  try {
    await user.remove();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  res.status(200).json({
    status: true,
    message: "Kullanıcı başarı ile silindi.",
  });
};

const userInfo = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate("advisor");
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const getStudent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.uid;

  let user;
  let advisors;
  try {
    user = await User.findById(userId).populate("advisor");
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find.", 500);
    return next(error);
  }

  try {
    advisors = await User.find(
      { type: 1 },
      "-password -image -applications -internships -finishedInternship"
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching advisors failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    user: user.toObject({ getters: true }),
    advisors: advisors.map((user) => user.toObject({ getters: true })),
  });
};

const sendPasswordResetMail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:sendPasswordResetMail");

  const {
    email,
  } = req.body;
  let user;
  try {
    user = await User.findOne({email:email},"-password -image -applications -internships -finishedInternship");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a user.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find user for the provided email.",
      404
    );
    return next(error);
  }
  const token = uuid();

  const createdConfirmation = new Confirmation({
    token: token,
    email: email,
    date: new Date(),
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
    to: email, // list of receivers
    subject: "Boğaziçi Üniversitesi Yönetim Bilişim Sistemleri Şifre Sıfırlama", // Subject line
    text: `Merhabalar, Şifrenizi sıfırlamak için altta bulunan kodu yeni şifrenizle birlikte girmeniz gerekmektedir. Doğrulama kodunuz: ${createdConfirmation.token}`, // plain text body
    html: `
    <p>Merhabalar,</b></p>
    <p>Şifrenizi sıfırlamak için altta bulunan kodu yeni şifrenizle birlikte girmeniz gerekmektedir.</p>
    <p>Doğrulama kodunuz: <b></b>${createdConfirmation.token}</b></p>`, // html body
  });

  res.json({ status: true, user: user });
};

const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  console.log("Girdi:updateUser");

  const { confirmationToken, password } = req.body;
  const userId = req.params.uid;

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

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Kullanıcı bulunamadı.",
      403
    );
    return next(error);
  }
  user.password = hashedPassword;
  console.log(user);
  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};
exports.createUsers = createUsers;
exports.updateUser = updateUser;
exports.updateStudentByAdmin = updateStudentByAdmin;
exports.updateUserByAdmin = updateUserByAdmin;
exports.getUsers = getUsers;
exports.getAdvisors = getAdvisors;
exports.getStudent = getStudent;
exports.signup = signup;
exports.login = login;
exports.userInfo = userInfo;
exports.deleteUser = deleteUser;
exports.sendPasswordResetMail=sendPasswordResetMail;
exports.resetPassword=resetPassword;