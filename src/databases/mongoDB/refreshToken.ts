import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const refreshTokenSchema = new Schema({
  token: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const RefreshTokenModel =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);

/**
 * Insert a new refresh token into the database
 * @param token - The access token string
 * @returns - The token object
 */
async function create(token: string) {
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
  }
  const refreshToken = new RefreshTokenModel({ token });
  await refreshToken.save();
  return refreshToken;
}

/**
 * Find an refresh token by its token string
 * @param token - The token string
 * @returns - The access token object or null if not found
 */
async function findOne(token: string) {
  const refreshToken = await RefreshTokenModel.findOne({
    token,
  });
  return refreshToken;
}

/**
 * Delete a refresh token by its id
 * @param id - id of the token
 * @returns - the deleted token
 */
async function remove(id: string) {
  const token = await RefreshTokenModel.findByIdAndDelete(id);
  return token;
}

export { create, findOne, remove };
