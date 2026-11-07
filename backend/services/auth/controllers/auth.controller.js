import crypto from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

const getSessionIdFromCookie = (req) => {
 const cookies = {};
 const cookieHeader = req.headers.cookie || "";

 for (const cookie of cookieHeader.split(";")) {
   const [name, ...valueParts] = cookie.trim().split("=");
   if (!name) continue;
   cookies[name] = decodeURIComponent(valueParts.join("="));
 }

 return req.cookies?.session ?? cookies.session;
};

export const login = async (req, res) => {
 try {
   const { token } = req.body || {};

   if (!token) {
     return res.status(400).json({ message: "Token is required" });
   }

   const decoded = await getAuth(app).verifyIdToken(token);
   let user = await User.findOne({ firebaseUid: decoded.uid });

   if (!user) {
     user = await User.create({
       firebaseUid: decoded.uid,
       name: decoded.name,
       email: decoded.email,
       avatar: decoded.picture,
     });
   }

   const sessionId = crypto.randomUUID();

   try {
     await redis.set(
       `session-${sessionId}`,
       JSON.stringify({
         userID: user._id,
         name: user.name,
         email: user.email,
         avatar: user.avatar,
       }),
       "EX",
       7 * 24 * 60 * 60
     );
   } catch (redisError) {
     return res.status(503).json({
       message: "Unable to create session. Redis is unavailable.",
     });
   }

   res.cookie("session", sessionId, {
     httpOnly: true,
     secure: false,
     sameSite: "strict",
     maxAge: 7 * 24 * 60 * 60 * 1000,
   });

   return res.status(200).json(user);
 } catch (error) {
   return res.status(500).json({ message: `login error ${error.message || error}` });
 }
};

export const logOut = async (req, res) => {
 try {
   const sessionId = getSessionIdFromCookie(req);

   if (sessionId) {
     await redis.del(`session-${sessionId}`);
   }

   res.clearCookie("session", { httpOnly: true, sameSite: "strict" });
   return res.status(200).json({ message: "logout successfully" });
 } catch (error) {
   return res.status(500).json({ message: `logout error ${error.message || error}` });
 }
};