// ResQNet — Server (Sprint 1: Authentication)
const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const adminRoutes = require("./routes/admin");

const app = express();
app.set("trust proxy", 1); // correct client IPs & cookies behind tunnels/hosting proxies
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "resqnet-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 },
  })
);

// API
app.use("/api", authRoutes);
app.use("/api", incidentRoutes);
app.use("/api", adminRoutes);

// Page routes (protect dashboard, keep auth pages away from logged-in users)
const pub = path.join(__dirname, "public");
const requireLogin = (req, res, next) => (req.session.user ? next() : res.redirect("/login"));
const requireGuest = (req, res, next) => (req.session.user ? res.redirect("/dashboard") : next());

app.get("/", (req, res) => res.sendFile(path.join(pub, "index.html")));
app.get("/login", requireGuest, (req, res) => res.sendFile(path.join(pub, "login.html")));
app.get("/register", requireGuest, (req, res) => res.sendFile(path.join(pub, "register.html")));
app.get("/dashboard", requireLogin, (req, res) => res.sendFile(path.join(pub, "dashboard.html")));
app.get("/report", requireLogin, (req, res) => res.sendFile(path.join(pub, "report.html")));
app.get("/map", requireLogin, (req, res) => res.sendFile(path.join(pub, "map.html")));
app.get("/incident/:id", requireLogin, (req, res) => res.sendFile(path.join(pub, "incident.html")));
const requireAdmin = (req, res, next) =>
  req.session.user?.role === "admin" ? next() : res.redirect("/dashboard");
app.get("/admin", requireLogin, requireAdmin, (req, res) => res.sendFile(path.join(pub, "admin.html")));
app.get("/feed", (req, res) => res.sendFile(path.join(pub, "feed.html")));

// Uploaded incident photos (login required)
app.use("/uploads", requireLogin, express.static(path.join(__dirname, "uploads")));

app.use(express.static(pub));

app.listen(PORT, () => {
  console.log(`\n  ResQNet running → http://localhost:${PORT}\n`);
});
