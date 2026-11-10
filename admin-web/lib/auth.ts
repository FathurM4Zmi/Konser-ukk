import Cookies from "js-cookie";
import type { User } from "./types";

const TOKEN_KEY = "konser_token";
const USER_KEY = "konser_user";

export const getToken = () => Cookies.get(TOKEN_KEY) || null;

export const getUser = (): User | null => {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    return null;
  }
};

export const setSession = (token: string, user: User) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
  Cookies.set(USER_KEY, encodeURIComponent(JSON.stringify(user)), { expires: 7, sameSite: "lax" });
};

export const clearSession = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
};
