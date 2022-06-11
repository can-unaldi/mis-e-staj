const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload")

const approvalControllers = require("../controllers/approval-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// router.get("/:iaid", approvalControllers.getIntershipApplicationById);
router.use(checkAuth);

router.get("/", approvalControllers.getAllApplications);

router.get("/advisor/:advisorId", approvalControllers.getAdvisorApplications);
router.get("/department", approvalControllers.getDepartmentApplications);
router.get("/manager", approvalControllers.getManagerApplications);

router.get(
  "/send-mail-to-company/:iaid",
  approvalControllers.sendMailToCompany
);

router.get("/user/:uid", approvalControllers.getIntershipApplicationsByUserId);

router.patch("/advisor/approve/:iaid", approvalControllers.advisorAprrove);

router.patch("/approve/:iaid", approvalControllers.approveApplication);

router.patch("/reject/:iaid", approvalControllers.rejectApplication);

router.post("/insurance-certificate/:iaid",fileUpload.single("file"), approvalControllers.uploadInsuranceCertificate);

module.exports = router;
