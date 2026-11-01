
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({
          email: email.toLowerCase().trim(),
        }).select("+password");

        // Check if user exists
        if (!user) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!isMatch) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        // Login successful
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Store user ID in session
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// Retrieve user using stored ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
