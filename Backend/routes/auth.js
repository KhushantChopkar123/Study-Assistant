

import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

import User from "../models/user.js";
import passport from "../config/passport.js";

const router = express.Router();

// Allowed frontend origins
const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
     "https://study-assistant-1-q42o.onrender.com",
]);

// Origin validation for state-changing requests
const validateOrigin = (req, res, next) => {
    const origin = req.get("Origin");

    // Browser requests should provide an allowed Origin
    if (!origin || !allowedOrigins.has(origin)) {
        return res.status(403).json({
            message: "Request origin not allowed",
        });
    }

    next();
};

// 1. Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again later.",
    },
});

// 2. Signup rate limiter
const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many signup attempts. Please try again later.",
    },
});

// Helper: regenerate session and log in user
const establishSession = (req, user) => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);

            req.login(user, (loginErr) => {
                if (loginErr) return reject(loginErr);

                resolve();
            });
        });
    });
};

// SIGNUP
router.post(
    "/signup",
    validateOrigin,
    signupLimiter,
    async (req, res) => {
        try {
            const { name, email, password } = req.body ?? {};

            // Basic validation
            if (
                typeof name !== "string" ||
                typeof email !== "string" ||
                typeof password !== "string" ||
                !name.trim() ||
                !email.trim() ||
                !password
            ) {
                return res.status(400).json({
                    message: "Please provide valid name, email and password.",
                });
            }

            if (name.trim().length > 100) {
                return res.status(400).json({
                    message: "Name must be within 100 characters.",
                });
            }

            if (email.trim().length > 254) {
                return res.status(400).json({
                    message: "Email is too long.",
                });
            }

            // bcrypt has a 72-byte input limit
            if (
                password.length < 8 ||
                Buffer.byteLength(password, "utf8") > 72
            ) {
                return res.status(400).json({
                    message:
                        "Password must be at least 8 characters and at most 72 bytes.",
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Basic email format validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(normalizedEmail)) {
                return res.status(400).json({
                    message: "Please enter a valid email address.",
                });
            }

            // Check existing user
            const existingUser = await User.findOne({
                email: normalizedEmail,
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Email already registered",
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
            });

            // Regenerate session and log in
            try {
                await establishSession(req, user);
            } catch (sessionError) {
                console.error("Signup session error:", sessionError);

                return res.status(500).json({
                    message:
                        "Account created, but login failed. Please log in.",
                });
            }

            return res.status(201).json({
                message: "Signup successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "Email already registered",
                });
            }

            console.error("Signup error:", error);

            return res.status(500).json({
                message: "Server error during signup",
            });
        }
    }
);

// LOGIN
router.post(
    "/login",
    validateOrigin,
    loginLimiter,
    (req, res, next) => {
        passport.authenticate("local", async (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                return res.status(401).json({
                    message:
                        info?.message || "Invalid email or password",
                });
            }

            try {
                await establishSession(req, user);

                return res.json({
                    message: "Login successful",
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    },
                });
            } catch (loginError) {
                return next(loginError);
            }
        })(req, res, next);
    }
);

// CHECK CURRENT USER
router.get("/me", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            message: "Not logged in",
        });
    }

    return res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        },
    });
});

// LOGOUT
router.post(
    "/logout",
    validateOrigin,
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                message: "Not logged in",
            });
        }

        req.logout((err) => {
            if (err) return next(err);

            req.session.destroy((sessionErr) => {
                if (sessionErr) return next(sessionErr);

                res.clearCookie("sigma.sid", {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    path: "/",
                });

                return res.json({
                    message: "Logout successful",
                });
            });
        });
    }
);

export default router;
