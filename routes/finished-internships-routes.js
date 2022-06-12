const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

const finishedInternshipsControllers = require("../controllers/finished-internships-controllers");
// const fileUpload = require("../middleware/file-upload");

const router = express.Router();

const checkAuth = require("../middleware/check-auth");

router.get(
  "/download/all/:iid",
  finishedInternshipsControllers.downloadAllInternshipDocuments
);

router.get("/:iid", finishedInternshipsControllers.getInternshipById);

router.get(
  "/manager/internships",
  finishedInternshipsControllers.getFinishedInterships
);

router.get(
  "/student/internships/:uid",
  finishedInternshipsControllers.getFinishedIntershipsByUserId
);

router.get(
  "/manager/sended-to-approval",
  finishedInternshipsControllers.getSendedInterships
);

router.patch(
  "/manager/approve/:iid",
  finishedInternshipsControllers.approveInternship
);

router.use(checkAuth);

router.post(
  "/admin/create-finished-interships",
  fileUpload.single("file"),
  finishedInternshipsControllers.createFinishedInternships
);

router.post(
  "/admin/create-intership", finishedInternshipsControllers.createFinishedInternshipByAdmin
);

router.patch(
  "/company-evaluation/:iid",
  finishedInternshipsControllers.approveCompanyEvalutionForm
);

router.delete("/:iid", finishedInternshipsControllers.deleteInternship);

router.get(
  "/send-to-approval/:iid",
  finishedInternshipsControllers.sendIntershipToApproval
);

router.post(
  "/internship-ended-document/:iid",
  fileUpload.single("file"),
  finishedInternshipsControllers.uploadInternshipEndedDocument
);

router.post(
  "/internship-report/:iid",
  fileUpload.single("file"),
  finishedInternshipsControllers.uploadInternshipReport
);

router.post(
  "/payroll-document/:iid",
  fileUpload.single("file"),
  finishedInternshipsControllers.uploadPayrollDocument
);

module.exports = router;
