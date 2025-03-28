import dotenv from "dotenv";
import { sign } from "jsonwebtoken";
dotenv.config({ path: "./env" });

export const signJwtAccessToken = function (userId: string) {
  return sign({ userId }, process.env.ACCESS_TOKEN!, { expiresIn: 30 });
};

export const signJwtRefreshToken = function (userId: string) {
  return sign({ userId }, process.env.REFRESH_TOKEN!, { expiresIn: 40 });
};
