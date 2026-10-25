import bcrypt from "bcryptjs";
import pool from "../db.js";
import dummyUsers from "./dummyusers.js";

const registerDummyUsers = async () => {
  let created = 0;
  let skipped = 0;

  try {
    for (const { username, email, password } of dummyUsers) {
      const passwordHash = await bcrypt.hash(password, 10);

      try {
        await pool.execute(
          "INSERT INTO users (name, password_hash, email) VALUES (?, ?, ?)",
          [username, passwordHash, email],
        );
        console.log(`Created demo user: ${email}`);
        created += 1;
      } catch (error) {
        if (error?.code === "ER_DUP_ENTRY") {
          console.log(`Skipped existing demo user: ${email}`);
          skipped += 1;
          continue;
        }

        throw error;
      }
    }

    console.log(`Demo user seeding complete: ${created} created, ${skipped} skipped.`);
  } finally {
    await pool.end();
  }
};

registerDummyUsers().catch((error) => {
  console.error("Failed to seed demo users:", error);
  process.exitCode = 1;
});
