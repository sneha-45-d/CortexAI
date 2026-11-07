import redis from "../../shared/redis/redis.js";

const parseCookies = (req) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie || "";

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (!name) continue;
    cookies[name] = decodeURIComponent(valueParts.join("="));
  }

  return cookies;
};

export const protect = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session ?? parseCookies(req).session;

    if (!sessionId) {
     req.user = { userId: "anonymous", userID: "anonymous" };
     return next();
    }

    const session = await redis.get(`session-${sessionId}`);

    if (!session) {
     req.user = { userId: "anonymous", userID: "anonymous" };
     return next();
    }

    req.user = JSON.parse(session);
    return next();
  } catch (error) {
    req.user = { userId: "anonymous", userID: "anonymous" };
    return next();
  }
};

export default protect;