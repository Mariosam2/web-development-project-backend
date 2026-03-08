import { NextFunction, Request, Response } from "express";
import { ContactSchema } from "@src/shared/schemas/ContactSchema";
import { transporter } from "@src/shared/transporter";
import { contactNotificationTemplate, contactThankYouTemplate, getEnvOrThrow } from "@src/shared/helpers";
import { prisma } from "@src/../lib/prisma";
export const contact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = ContactSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { email, message } = result.data;
    await prisma.contacts.create({ data: { senderEmail: email, message } });

    await Promise.all([
      transporter.sendMail({
        from: '"ManMot" <noreply.manmot@gmail.com>',
        to: email,
        subject: "We got your message!",
        html: contactThankYouTemplate(message),
      }),
      transporter.sendMail({
        from: '"ManMot" <noreply.manmot@gmail.com>',
        to: getEnvOrThrow("CONTACT_EMAIL"),
        subject: `New message from ${email}`,
        html: contactNotificationTemplate(email, message),
      }),
    ]);

    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    next(error);
  }
};
