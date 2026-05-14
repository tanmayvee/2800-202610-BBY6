const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");
const rateLimit = require("express-rate-limit");

//Limit login attempts to 10 per 15 minutes per IP
const loginLimiter = rateLimit(
{
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//POST /api/auth/signup
//Body: { email, password }
router.post("/signup", async (req, res) => 
{
  try 
  {
    const { email, password } = req.body;

    if (!email || !password) 
    {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!emailRegex.test(email)) 
    {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (password.length < 8) 
    {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    res.status(201).json(
    {
      message: "Signup successful. Please check your email to confirm your account.",
      user: data.user,
    });

  } catch (error) 
    {
    console.error("Signup error:", error.message);
    res.status(error.status || 500).json({ error: error.message });
    }
});

//POST /api/auth/login
//Body: { email, password }
router.post("/login", loginLimiter, async (req, res) => 
{
  try 
  {
    const { email, password } = req.body;

    if (!email || !password) 
    {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!emailRegex.test(email)) 
    {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    res.status(200).json(
    {
      message: "Login successful",
      user: data.user,
      session: data.session,
    });

  } catch (error) 
    {
    console.error("Login error:", error.message);
    const status = error.status || (error.message.includes("Invalid") ? 401 : 500);
    res.status(status).json({ error: error.message });
    }
});

//POST /api/auth/logout
router.post("/logout", async (req, res) => 
{
  try 
  {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    res.status(200).json({ message: "Logged out successfully" });

  } catch (error) 
    {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: error.message });
    }
});

module.exports = router;
