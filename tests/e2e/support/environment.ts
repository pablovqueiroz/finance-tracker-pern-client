import path from "node:path";

export const WEB_URL =
  process.env.E2E_WEB_URL ?? "http://127.0.0.1:4174";
export const API_URL =
  process.env.E2E_API_URL ?? "http://127.0.0.1:5015/api";
export const AUTH_STATE_PATH = path.resolve(
  "playwright",
  ".auth",
  "primary-user.json",
);
