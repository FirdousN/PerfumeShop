const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/user_management_system");

const config = require("./config/config");

const app = express();
const path = require("path");

app.use("/static", express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  next();
});

//for user routes
const userRoute = require("./router/userRoute");
app.use("/", userRoute);

//for admin routes
const adminRoute = require("./router/adminRoute");
app.use("/admin", adminRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(8000, () => {
  console.log("Server is running .... http://localhost:8000/");
});
