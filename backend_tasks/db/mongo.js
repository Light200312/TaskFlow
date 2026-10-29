import { MongoClient } from "mongodb";

let client;
let connectionPromise;

export async function getAvatarCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  }

  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;

  const database = process.env.MONGODB_DB_NAME
    ? client.db(process.env.MONGODB_DB_NAME)
    : client.db();

  return database.collection(
    process.env.MONGODB_AVATAR_COLLECTION || "user_avatars",
  );
}

export async function closeMongoConnection() {
  if (!client) return;

  await client.close();
  client = null;
  connectionPromise = null;
}
