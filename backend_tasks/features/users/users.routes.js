import express from "express";
import { registerUser,loginUser ,searchUserByEmailorName,getCurrentUser,updateUserName} from "./users.controller.js";
import {authGuard} from "../../midlewares/authGuard.js"
const router = express.Router();
// Protected routes
router.get("/me", authGuard, getCurrentUser);
router.put("/me/name", authGuard, updateUserName);

//'/api/users'
router.post("/register", registerUser);


router.post("/login", loginUser);
 
router.post("/search",searchUserByEmailorName);
export default router;
