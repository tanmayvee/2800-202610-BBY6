const supabase = require("../db/supabase");
 
//Middleware to protect routes that require authentication
//Checks for a valid Supabase session token in the Authorization header

//Usage: add requireAuth as a parameter to any route you want to protect

 
const requireAuth = async (req, res, next) => 
  {
  try 
  {
    const authHeader = req.headers.authorization;
 
    if (!authHeader || !authHeader.startsWith("Bearer ")) 
    {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
 
    const token = authHeader.split(" ")[1];
 
    //Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
 
    if (error || !data.user) 
    {
      return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }
 
    // Attach user to the request so routes can access it
    req.user = data.user;
    next();
  } catch (error) 
    {
    console.error("Auth middleware error:", error.message);
    res.status(500).json({ error: "Authentication error" });
    }
};
 
module.exports = requireAuth;
 