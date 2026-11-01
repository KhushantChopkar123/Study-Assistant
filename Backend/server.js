
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./config/passport.js";
import helmet from "helmet";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = 8080;

// 1. Security headers
app.use(helmet());

// 2. Limit incoming JSON request body size
app.use(express.json({
    limit: "32kb"
}));

// 3. CORS
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    credentials: true,
}));

// 4. Session configuration
app.use(session({
    name: "sigma.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions",
        ttl: 24 * 60 * 60,
    }),

    cookie: {
        httpOnly: true,
        secure: false, // Local HTTP development only
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// 5. Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// 6. Routes
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);

// 7. Error handling
app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            error: "Request body is too large."
        });
    }

    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        return res.status(400).json({
            error: "Invalid JSON request body."
        });
    }

    next(err);
});

// 8. Connect Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected with Database!");

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });

    } catch (err) {
        console.error("Failed to connect with DB", err);
        process.exitCode = 1;
    }
};

connectDB();
