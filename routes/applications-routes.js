const express = require("express");
const { check } = require("express-validator");

const applicationsControllers = require("../controllers/applications-controllers");
// const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:iaid", applicationsControllers.getIntershipApplicationById);
router.get("/send-mail-to-company/:iaid", applicationsControllers.sendMailToCompany);

router.get(
  "/user/:uid",
  applicationsControllers.getIntershipApplicationsByUserId
);
router.use(checkAuth);

router.post(
  "/",
  [
    check("data.studentName").not().isEmpty(),
    check("data.studentEmail").not().isEmpty().isEmail().normalizeEmail(),
    check("data.doubleMajor").not().isEmpty(),
    check("data.doubleMajorDepartment"),
    check("data.studentId").not().isEmpty().isNumeric(),
    check("data.semesterCompleted").not().isEmpty().isNumeric(),
    check("data.creditsCompleted").not().isEmpty().isNumeric(),
    check("data.studentTC").not().isEmpty().isNumeric(),
    check("data.studentBday").not().isEmpty(),
    check("data.studentPhone").not().isEmpty().isMobilePhone(),
    check("data.companyName").not().isEmpty(),
    check("data.companyAddress").not().isEmpty(),
    check("data.companyPhone").not().isEmpty().isMobilePhone(),
    check("data.supervisorName").not().isEmpty(),
    check("data.supervisorEmail")
      .not()
      .isEmpty()
      .isEmail()
      .normalizeEmail(),
    check("data.supervisorPhone").not().isEmpty().isMobilePhone(),
    check("data.saturdayWork").not().isEmpty(),
    check("data.internshipDepartment").not().isEmpty(),
    check("data.internshipArea").not().isEmpty(),
    check("data.startDate").not().isEmpty(),
    check("data.endDate").not().isEmpty(),
    check("data.duration").not().isEmpty().isNumeric(),
    check("data.internshipDescription").not().isEmpty(),
    check("data.internResponsibilities").not().isEmpty(),
    check("data.supportOffered").not().isEmpty(),
    check("data.studentApproval").not().isEmpty().isBoolean(),
  ],
  applicationsControllers.createIntershipApplication
);

router.patch(
  "/:iaid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  applicationsControllers.updateIntershipApplication
);

router.delete("/:iaid", applicationsControllers.deleteIntershipApplication);

module.exports = router;
