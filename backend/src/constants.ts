import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const isDevelopment = process.env.IS_DEVELOPMENT === "true" ? true : false;

const hostnameValue = process.env.TRANSCENDENCE_HOSTNAME || 'localhost';

export const FRONT_END_URL = isDevelopment
  ? `http://${hostnameValue}:5173`
  : `https://${hostnameValue}:4443`;

export const SESSION_COOKIE_NAME = "user-session";
