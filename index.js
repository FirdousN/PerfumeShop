const express = require("express");
const session = require("express-session");
const dbConnection = require("./config/dbConnect")
const userRoute = require("./router/userRoute");
const adminRoute = require("./router/adminRoute");
const app = express();
const path = require("path");
require("dotenv").config()

app.use("/static", express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

// dbConnection()
app.use(
  session({
    secret: process.env.SESSIONSECRET,
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

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use(( req, res, next) => {
  res.status(404).render("./layouts/404Error", { userData: null });
  next()
});

app.listen(8000, () => {
  console.log("Server is running ..... http://localhost:8000/");
});