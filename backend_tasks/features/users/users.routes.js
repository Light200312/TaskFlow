import express from "express";
import { registerUser,loginUser ,searchUserByEmailorName} from "./users.controller.js";

const router = express.Router();

//'/api/users'
router.post("/register", registerUser);


router.post("/login", loginUser);
 
router.post("/search",searchUserByEmailorName);
export default router;
