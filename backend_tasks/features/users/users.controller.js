import dotenv from "dotenv";
import pool from "../../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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