import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const isDevelopment = process.env.IS_DEVELOPMENT === "true" ? true : false;

export const FRONT_END_URL = isDevelopment
  ? "http://localhost:5173"
  : "https://localhost:443";
