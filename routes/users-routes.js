const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/", usersController.getUsers);

router.get("/student/:uid", usersController.getStudent);

router.post(
  "/admin/create-users",
  fileUpload.single("file"),
  usersController.createUsers
);

router.post(
  "/signup",
  // fileUpload.single('image'),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

router.patch(
  "/:uid",
  [
    check("phoneNumber").not().isEmpty().isLength({ min: 10 }),
    check("studentNumber").not().isEmpty().isLength({ min: 10 }),
    check("tcNumber").not().isEmpty().isLength({ min: 11 }),
    check("birthDate").not().isEmpty(),
  ],
  usersController.updateUser
);
router.patch(
  "/admin/:uid",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
  ],
  usersController.updateUserByAdmin
);
router.patch(
  "/admin/student/:uid",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("phoneNumber").not().isEmpty().isLength({ min: 10 }),
    check("studentNumber").not().isEmpty().isLength({ min: 10 }),
    check("tcNumber").not().isEmpty().isLength({ min: 11 }),
    check("birthDate").not().isEmpty(),
  ],
  usersController.updateStudentByAdmin
);
router.get("/details/:uid", usersController.userInfo);
router.delete("/:uid", usersController.deleteUser);

module.exports = router;
