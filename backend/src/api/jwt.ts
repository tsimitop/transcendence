import dotenv from "dotenv";
import { sign, verify, Secret, Algorithm } from "jsonwebtoken";
dotenv.config({ path: "./.env" });

// export const signJwtAccessToken = function (userId: string) {
//   const algorithm = process.env.ACCESS_TOKEN_ALGORITHM as Algorithm;
//   return sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
//     algorithm,
//     expiresIn: "15m",
//   });
// };

export const signJwtAccessToken = function (userId: string, username: string) {
	const algorithm = process.env.ACCESS_TOKEN_ALGORITHM as Algorithm;
	return sign({ userId, username }, process.env.ACCESS_TOKEN_SECRET!, {
	  algorithm,
	  expiresIn: "15m",
	});
  };
  

export const signJwtRefreshToken = function (userId: string) {
  const algorithm = process.env.REFRESH_TOKEN_ALGORITHM as Algorithm;
  return sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    algorithm,
    expiresIn: "1d",
  });
};

export const isAccessTokenExpired = function (accessToken: string) {
  const secretKey = process.env.ACCESS_TOKEN_SECRET as Secret;
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
