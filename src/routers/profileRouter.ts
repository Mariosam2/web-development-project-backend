import { singleProfile, updateProfile } from "@src/controllers/profileController";
import { handleUpload } from "@src/shared/storage";
import { Router } from "express";

const profileRouter = Router();

profileRouter.get("/", singleProfile);
profileRouter.put("/update", handleUpload("image"), updateProfile);

export default profileRouter;
