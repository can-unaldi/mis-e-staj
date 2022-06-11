const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

const internshipsControllers = require("../controllers/internships-controllers");
// const fileUpload = require("../middleware/file-upload");


const router = express.Router();


const checkAuth = require("../middleware/check-auth");

router.get("/download/all/:iid", internshipsControllers.downloadAllInternshipDocuments);

router.get("/:iid", internshipsControllers.getInternshipById);

router.get(
  "/send-mail-to-company/:iaid",
  internshipsControllers.sendMailToCompany
);

router.get("/user/:uid", internshipsControllers.getInternshipsByUserId);

router.get("/manager/sended-to-approval", internshipsControllers.getSendedInterships);

router.patch("/manager/approve/:iid", internshipsControllers.approveInternship);

router.patch("/manager/reject/:iid", internshipsControllers.rejectInternship);

router.use(checkAuth);

router.post("/", internshipsControllers.createInternship);

router.patch(
  "/company-evaluation/:iid",
  internshipsControllers.approveCompanyEvalutionForm
);

router.delete("/:iid", internshipsControllers.deleteInternship);

router.get("/send-to-approval/:iid", internshipsControllers.sendIntershipToApproval);

router.post(
  "/internship-ended-document/:iid",
  fileUpload.single("file"),
  internshipsControllers.uploadInternshipEndedDocument
);

router.post(
  "/internship-report/:iid",
  fileUpload.single("file"),
  internshipsControllers.uploadInternshipReport
);

router.post(
  "/payroll-document/:iid",
  fileUpload.single("file"),
  internshipsControllers.uploadPayrollDocument
);




module.exports = router;
