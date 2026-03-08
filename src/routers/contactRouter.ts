import { contact } from "@src/controllers/contactController";
import { Router } from "express";

const contactRouter = Router();

contactRouter.post("/", contact);

export default contactRouter;
