import dotenv from "dotenv";
import { sign, verify, Secret } from "jsonwebtoken";
dotenv.config({ path: "./.env" });

export const signJwtAccessToken = function (userId: string) {
  return sign({ userId }, process.env.ACCESS_TOKEN!, {
    algorithm: "HS256",
    // expiresIn: "15m",
    expiresIn: 15,
  });
};

export const signJwtRefreshToken = function (userId: string) {
  return sign({ userId }, process.env.REFRESH_TOKEN!, {
    algorithm: "HS256",
    expiresIn: 40,
  });
};

export const isAccessTokenExpired = function (accessToken: string) {
  const secretKey = process.env.ACCESS_TOKEN as Secret;
  try {
    const decoded = verify(accessToken, secretKey);
    const isDecodedValid =
      typeof decoded === "object" && decoded !== null && "exp" in decoded;

    if (!isDecodedValid) {
      return false;
    }

    if (decoded.exp && decoded.exp < new Date().getTime() + 1 / 1000) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.log("Error occured when checking access token expiry", error);
    return false;
  }
};
