const nodemailer = require("nodemailer");

const sendVerifyMail = async (email, req) => {
  try {
    const otp = generateOTP(4);
    req.session.otp = otp;

    console.log(req.session.otp, "otp");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "pranamikapk18@gmail.com",
        pass: "eyxo ndrs bwir dyam",
      },
    });

    const mailOptions = {
      from: "perfumeshop@gmail.com",
      to: email,
      subject: "For verification purpose",
      html: `<p>Please Enter this OTP : <strong> ${otp}</strong> to verify your email. </p>`,
    };
    const information = await transporter.sendMail(mailOptions);
    console.log(information.messageId);
  } catch (error) {
    console.log(error);
  }
};

function generateOTP(length) {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }
  return otp;
}

module.exports = {
  sendVerifyMail,
};
