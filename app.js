const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const applicationsRoutes = require("./routes/applications-routes");
const internshipsRoutes = require("./routes/internships-routes");
const finishedInternshipsRoutes = require("./routes/finished-internships-routes");

const approvalRoutes = require("./routes/approval-routes");
const companyApprovalRoutes = require("./routes/company-approval-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});
app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/public/uploads",
  express.static(path.join("public", "uploads"))
); 
app.use(
  "/public/files",
  express.static(path.join("public", "files"))
); 
app.use(
  "/public/documents",
  express.static(path.join("public", "documents"))
); 


app.use("/api/applications", applicationsRoutes);
app.use("/api/internships", internshipsRoutes);
app.use("/api/finished-internships", finishedInternshipsRoutes);

app.use("/api/approval", approvalRoutes);
app.use("/api/company-approval", companyApprovalRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rwl7m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });
