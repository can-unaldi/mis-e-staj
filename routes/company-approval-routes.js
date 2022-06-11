const express = require("express");
const { check } = require("express-validator");

const companyApprovalControllers = require("../controllers/company-approval-controllers");

const router = express.Router();

router.get("/:iaid", companyApprovalControllers.getApplicationById);
router.get("/internship/:iid", companyApprovalControllers.getInternshipById);

router.get("/send-mail/:iaid", companyApprovalControllers.sendConfirmationMail);
router.get("/send-mail/internship/:iid", companyApprovalControllers.sendEvalutionFormConfirmationMail);

router.get(
  "/user/:uid",
  companyApprovalControllers.getIntershipApplicationsByUserId
);

router.patch(
  "/:iaid",
  // [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  companyApprovalControllers.approveIntershipApplication
);
router.patch(
  "/internship/:iid",
  // [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  companyApprovalControllers.approveIntershipEvalutionForm
);

module.exports = router;
