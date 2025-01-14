import nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport(<SMTPTransport.Options>{
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});


const sendMail = (to: string, subject: string, html: string) => {
    console.log("Sending email to: ", to);
    const mailOptions:MailOptions = {
        from: "info@slietshare.online",
        to,
        subject,
        html,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.dir(error);
                resolve(false);
            } else {
                console.log("Email sent: " + info.response);
                resolve(true);
            }
        });
    });
};


export { sendMail };

