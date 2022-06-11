const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const base64 = require("node-base64-image");
const uuid = require("uuid/v1");
const fs = require("fs");
var XLSX = require("xlsx");
const readXlsxFile = require("read-excel-file/node");
var mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const createUsers = async (req, res, next) => {
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
  console.log(advisors);

  let users = [];
  try {
    readXlsxFile(req.file.path)
      .then((rows) => {
        // skip header
        rows.shift();
        rows.forEach((row) => {
          let advisor;
          bcrypt.hash(row[2].toString(), 12, function (err, hash) {
            // Store hash in your password DB.
            console.log(hash);
            advisors.forEach((adv) => {
              console.log("for girdi", adv);

              if (adv.email == row[3]) {
                console.log("if girdi:", row[3]);

                advisor = mongoose.Types.ObjectId(adv._id);
                let user = {
                  name: row[0],
                  email: row[1],
                  password: hash,
                  type: 0,
                  profileComplated: false,
                  phoneNumber: null,
                  studentNumber: null,
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
                console.log(users);
              }
            });
          });
        });
      })
      .then((result) => {
        User.insertMany(users, { ordered: false }, function (err, docs) {
          if (err) {
            console.log(err);
            const error = new HttpError(
              "Something went wrong, could not create users.",
              500
            );
            return next(error);
          } else {
            res.status(200).json({
              status: true,
              message: "Kullanıcılar başarı ile oluşturuldu",
            });
          }
        });
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
    studentNumber: null,
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
    console.log("Err:",err);
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
exports.createUsers = createUsers;
exports.updateUser = updateUser;
exports.updateStudentByAdmin = updateStudentByAdmin;
exports.updateUserByAdmin = updateUserByAdmin;
exports.getUsers = getUsers;
exports.getStudent = getStudent;
exports.signup = signup;
exports.login = login;
exports.userInfo = userInfo;
exports.deleteUser = deleteUser;
