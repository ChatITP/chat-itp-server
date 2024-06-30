import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const accessTokenSchema = new Schema({
  token: String,
});

const AccessTokenModel =
  mongoose.models.AccessToken || mongoose.model("AccessToken", accessTokenSchema);

/**
 * Insert a new access token into the database
 * @param token - The access token string or null to generate a random token
 * @returns - The access token object
 */
async function create(token: string | null) {
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
  }
  const accessToken = new AccessTokenModel({ token });
  await accessToken.save();
  return accessToken;
}

/**
 * Find an access token by its token string
 * @param token - The token string
 * @returns - The access token object or null if not found
 */
async function findOne(token: string) {
  const accessToken = await AccessTokenModel.findOne({
    token,
  });
  return accessToken;
}

/**
 * Delete a token by its id
 * @param id - id of the token
 * @returns - the deleted token
 */
async function remove(id: string) {
  const token = await AccessTokenModel.findByIdAndDelete(id);
  return token;
}

export { create, findOne, remove };
