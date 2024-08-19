import jwt = require("jsonwebtoken");

if (!process.env.JWT_ACCESS_SECRET) {
  console.error("JWT access token not set.");
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.error("JWT refresh token not set.");
  process.exit(1);
}

/**
 * Generate an access token
 * @param email - The email of the user
 * @returns - The access token
 */
function generateAccessToken(userId: string) {
  const token = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "10m" });
  return token;
}

/**
 * Generate a refresh token
 * @param email - The email of the user
 * @returns - The refresh token
 */
function generateRefreshToken(userId: string) {
  const token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string);
  return token;
}

/**
 * Verify an access token
 * @param token - The access token
 * @returns - The decoded token or null if invalid
 */
function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
    return decoded as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 * @param token - The refresh token
 * @returns - The decoded token or null if invalid
 */
function verifyRefreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
    return decoded as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
