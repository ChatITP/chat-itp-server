import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  email: String,
  password: String,
  name: String,
  created_at: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

/**
 * Find a user by email.
 * @param email - email of the user.
 * @returns - the user or null if not found.
 * @private
 */
async function getUser(email: string) {
  return await UserModel.findOne({ email });
}

/**
 * Register a new user if the user does not already exist.
 * @param email - email of the user.
 * @param password - password of the user.
 * @param name - name of the user.
 * @returns - an object containing the user ID and email if created, null if the user already exists.
 */
async function register(email: string, password: string, name: string) {
  const userExists = await getUser(email);
  if (userExists) {
    return null;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = new UserModel({
    email,
    password: hashed,
    name,
  });
  await user.save();
  return { id: user._id, email: user.email };
}

/**
 * Verify a user.
 * @param email - email of the user.
 * @param password - password of the user.
 * @returns - an object containing the user ID and email if login is successful, null otherwise.
 */
async function login(email: string, password: string) {
  const user = await getUser(email);
  if (!user) {
    return null;
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return { id: user._id, email: user.email };
  } else {
    return null;
  }
}

export { register, login };
