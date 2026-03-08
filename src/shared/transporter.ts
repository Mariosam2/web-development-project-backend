import nodemailer from "nodemailer";
import { getEnvOrThrow } from "./helpers";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: getEnvOrThrow("SMTP_USER"),
    pass: getEnvOrThrow("SMTP_PASS"),
  },
});
