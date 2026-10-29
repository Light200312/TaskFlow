import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  searchUserByEmailorName,
  getCurrentUser,
  updateUserName,
  uploadCurrentUserAvatar,
  getCurrentUserAvatar,
  deleteCurrentUserAvatar,
} from "./users.controller.js";
import {authGuard} from "../../midlewares/authGuard.js"
const router = express.Router();
//creates buffer storage for multer and sets file size limit to 2MB. Also filters for PNG, JPEG, or WebP images.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.mimetype)) {
      const error = new Error("Select a PNG, JPEG, or WebP image.");
      error.code = "INVALID_AVATAR_TYPE";
      callback(error);
      return;
    }
    callback(null, true);
  },
});
//handles multer errors and sends appropriate response to the client
function parseAvatarUpload(req, res, next) {
  avatarUpload.single("avatar")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res.status(status).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Profile pictures must be 2 MB or smaller."
            : "Upload one profile picture using the avatar field.",
      });
      return;
    }

    if (error.code === "INVALID_AVATAR_TYPE") {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  });
}

// Protected routes
router.get("/me", authGuard, getCurrentUser);
router.put("/me/name", authGuard, updateUserName);
router.get("/me/avatar", authGuard, getCurrentUserAvatar);
router.put(
  "/me/avatar",
  authGuard,
  parseAvatarUpload,
  uploadCurrentUserAvatar,
);
router.delete("/me/avatar", authGuard, deleteCurrentUserAvatar);

//'/api/users'
router.post("/register", registerUser);


router.post("/login", loginUser);
 
router.post("/search",searchUserByEmailorName);
export default router;
