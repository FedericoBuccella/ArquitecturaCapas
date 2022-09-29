import dotenv from 'dotenv'
dotenv.config()
import nodemailer from 'nodemailer'


export let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "fedec.fb@gmail.com", // generated ethereal user
      pass: process.env.MAILER_PASS, // generated ethereal password
    },
  });

  transporter.verify().then(()=>{
    console.log("ready")
  })

/* szgtdgzipcxkfykt */
