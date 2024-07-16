import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const earlyAccessCodeSchema = new Schema({
  code: String,
});

const EarlyAccessCodeModel =
  mongoose.models.EarlyAccessCode || mongoose.model("EarlyAccessCode", earlyAccessCodeSchema);

/**
 * Insert a new early access code into the database
 * @param token - The access code string or null to generate a random code
 * @returns - The access code object
 */
async function create(code: string | null) {
  if (!code) {
    code = crypto.randomBytes(16).toString("hex");
  }
  const accessCode = new EarlyAccessCodeModel({ code });
  await accessCode.save();
  return accessCode;
}

/**
 * Find an access code by its token string
 * @param code - The token string
 * @returns - The access code object or null if not found
 */
async function findOne(code: string) {
  const accessCode = await EarlyAccessCodeModel.findOne({
    code,
  });
  return accessCode;
}

/**
 * Delete an early access code by its id
 * @param id - id of the early access code
 * @returns - the deleted code object
 */
async function remove(id: string) {
  const accessCode = await EarlyAccessCodeModel.findByIdAndDelete(id);
  return accessCode;
}

export { create, findOne, remove };
