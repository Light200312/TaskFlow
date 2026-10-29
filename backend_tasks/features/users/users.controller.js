import dotenv from "dotenv";
import pool from "../../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAvatarCollection } from "../../db/mongo.js";
dotenv.config();
export const registerUser=async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !email.trim() ||
    password.length < 8
  ) {
    return res.status(400).json({
      message:
        "Valid username, email, and password (at least 8 characters) are required.",
    });
  }

  try {
    // Hash password before storing it
    const hashed_password = await bcrypt.hash(password, 10);

    // Insert all three columns
    const [result] = await pool.execute(
      "INSERT INTO users (name, password_hash, email) VALUES (?, ?, ?)",
      [username.trim(), hashed_password, email.trim()],
    );

    // Generate token after successful registration
    const token = jwt.sign(
      { userId: result.insertId, username: username.trim() },
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
    );

  return res.status(201).json({
  message: "User registered successfully",
  userId: result.insertId,
  username: username.trim(),
  token,
});
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export const loginUser=async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    password.length < 8
  ) {
    return res.status(400).json({
      message: "Valid email and password (at least 8 characters) are required.",
    });
  }

  try {
    // Find user by email
    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    // Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT after successful authentication
    const token = jwt.sign(
      { userId: user.id, username: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

  return res.status(200).json({
  message: "Login successful!",
  userId: user.id,
  username: user.name,
  token,
});
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export const searchUserByEmailorName=async (req,res)=>{
const {username ,email}=req.body;
if (
  (username !== undefined &&
    (typeof username !== "string" || !username.trim())) ||
  (email !== undefined && (typeof email !== "string" || !email.trim())) ||
  (typeof username !== "string" && typeof email !== "string")
) {
  return res.status(400).json({
    message: "A valid username or email is required.",
  });
}
try{
  const conditions = [];
  const values = [];

  if (typeof username === "string") {
    conditions.push("name = ?");
    values.push(username.trim());
  }
  if (typeof email === "string") {
    conditions.push("email = ?");
    values.push(email.trim());
  }

  const [rows]=await pool.query(
    `SELECT name, id, email FROM users WHERE ${conditions.join(" AND ")}`,
    values,
  );
  return res.status(200).json(rows);
}catch(err){
  console.error("User search error:", err);
  return res.status(500).json({ message: "Internal server error" });
}
}

// GET /api/users/me
export const getCurrentUser = async (req, res) => {
  const userId = req.user.userId ?? req.user.id;

  try {
    const [users] = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: users[0],
    });
  } catch (error) {
    console.error("Error fetching current user:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// PUT /api/users/me/name
export const updateUserName = async (req, res) => {
  const userId = req.user.userId ?? req.user.id;
  const name =
    typeof req.body.name === "string"
      ? req.body.name.trim()
      : "";

  if (!name) {
    return res.status(400).json({
      message: "Name is required.",
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      message: "Name cannot exceed 100 characters.",
    });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const [users] = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = ?`,
      [userId],
    );

    return res.status(200).json({
      message: "Name updated successfully.",
      user: users[0],
    });
  } catch (error) {
    console.error("Error updating user name:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

const isSupportedImage = (buffer, contentType) => {
  if (contentType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (contentType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  if (contentType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
};

// PUT /api/users/me/avatar
export const uploadCurrentUserAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Select a PNG, JPEG, or WebP image to upload.",
    });
  }

  if (!isSupportedImage(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({
      message: "The uploaded file is not a valid PNG, JPEG, or WebP image.",
    });
  }

  try {
    const avatars = await getAvatarCollection();
    await avatars.updateOne(
      { _id: req.user.userId },
      {
        $set: {
          contentType: req.file.mimetype,
          data: req.file.buffer,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return res.status(200).json({
      message: "Profile picture updated successfully.",
      hasAvatar: true,
    });
  } catch (error) {
    console.error("Avatar storage operation failed:", error.name);
    return res.status(503).json({
      message: "Profile picture storage is temporarily unavailable.",
    });
  }
};

// GET /api/users/me/avatar
export const getCurrentUserAvatar = async (req, res) => {
  try {
    const avatars = await getAvatarCollection();
    const avatar = await avatars.findOne(
      { _id: req.user.userId },
      { projection: { contentType: 1, data: 1 } },
    );

    if (!avatar) {
      return res.status(404).json({
        message: "No profile picture has been uploaded.",
      });
    }

    const imageBuffer = Buffer.isBuffer(avatar.data)
      ? avatar.data
      : avatar.data.value(true);

    res
      .status(200)
      .set({
        "Content-Type": avatar.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(imageBuffer);
  } catch (error) {
    console.error("Avatar storage operation failed:", error.name);
    return res.status(503).json({
      message: "Profile picture storage is temporarily unavailable.",
    });
  }
};

// DELETE /api/users/me/avatar
export const deleteCurrentUserAvatar = async (req, res) => {
  try {
    const avatars = await getAvatarCollection();
    await avatars.deleteOne({ _id: req.user.userId });

    return res.status(200).json({
      message: "Profile picture removed successfully.",
      hasAvatar: false,
    });
  } catch (error) {
    console.error("Avatar storage operation failed:", error.name);
    return res.status(503).json({
      message: "Profile picture storage is temporarily unavailable.",
    });
  }
};