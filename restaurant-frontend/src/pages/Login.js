import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  // ✅ YOUR ORIGINAL STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ EXTRA UI STATES
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ CHECK SUBSCRIPTION AFTER LOGIN
  const checkSubscription = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/subscription/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Has active subscription → go to Dashboard
      if (data.status === "success" && data.data) {
        window.location.href = "/dashboard";
      } else {
        // No subscription → go to Subscription page
        window.location.href = "/subscription";
      }
    } catch (err) {
      // If subscription check fails → go to dashboard anyway
      window.location.href = "/dashboard";
    }
  };

  // ✅ YOUR ORIGINAL LOGIN FUNCTION + subscription check
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // ✅ Save token
        localStorage.setItem("token", data.token);

        // ✅ Check if user has subscription
        await checkSubscription(data.token);
      } else {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError("Server error. Please try again.");
      setIsLoading(false);
    }
  };

  // ✅ SIGN UP FUNCTION
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        alert("Account created! Please login.");
        setShowSignUp(false);
        setEmail(signUpData.email);
        setSignUpData({ name: "", email: "", password: "", confirmPassword: "" });
        setError("");
      } else {
        setError(data.message || "Sign up failed.");
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError("Server error. Please try again.");
      setIsLoading(false);
    }
  };

  // ✅ GOOGLE SIGN IN
  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="login-content">

        {/* ── LEFT SIDE ── */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">🍽️</div>
              <h1 className="brand-title">Restaurant SaaS</h1>
            </div>
            <h2 className="brand-headline">Manage Your Restaurant Empire</h2>
            <p className="brand-description">
              Take control of your restaurant operations with our powerful
              management platform. Track orders, manage inventory, and scale
              your business effortlessly.
            </p>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div><h4>Lightning Fast</h4><p>Real-time order processing</p></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div><h4>Secure & Reliable</h4><p>Enterprise-grade security</p></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div><h4>Advanced Analytics</h4><p>Data-driven insights</p></div>
              </div>
            </div>
            <div className="restaurant-image">
              <div className="image-placeholder">
                <div className="image-icon">🏪</div>
                <div className="image-text">
                  <h3>Join 1000+ Restaurants</h3>
                  <p>Managing their business with us</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE ── */}
        <div className="login-form-container">
          <div className="login-form-wrapper">

            {!showSignUp ? (
              <>
                <div className="form-header">
                  <h2 className="form-title">Welcome Back</h2>
                  <p className="form-subtitle">Sign in to continue to your dashboard</p>
                </div>

                {error && (
                  <div className="error-message shake-animation">
                    <span className="error-icon">⚠️</span> {error}
                  </div>
                )}

                {/* Checking subscription loading overlay */}
                {isLoading && (
                  <div className="checking-sub">
                    <div className="checking-spinner"></div>
                    <span>Verifying your account...</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📧</span>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input type="checkbox" className="checkbox-input" />
                      <span className="checkbox-text">Remember me</span>
                    </label>
                    <a href="#" className="forgot-link">Forgot password?</a>
                  </div>

                  <button
                    type="submit"
                    className={`submit-btn ${isLoading ? "loading" : ""}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><span className="spinner"></span><span>Checking...</span></>
                    ) : (
                      <><span>Sign In</span><span className="btn-arrow">→</span></>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p className="footer-text">
                    Don't have an account?
                    <button onClick={() => { setShowSignUp(true); setError(""); }} className="signup-link">
                      Sign up
                    </button>
                  </p>
                </div>

                <div className="divider"><span>or continue with</span></div>

                <button onClick={handleGoogleSignIn} className="google-btn">
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            ) : (
              <>
                <div className="form-header">
                  <h2 className="form-title">Create Account</h2>
                  <p className="form-subtitle">Join and start managing your restaurant</p>
                </div>

                {error && (
                  <div className="error-message shake-animation">
                    <span className="error-icon">⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSignUp} className="login-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input type="text" placeholder="Enter your name" value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        className="form-input" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📧</span>
                      <input type="email" placeholder="Enter your email" value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className="form-input" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input type={showPassword ? "text" : "password"} placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="form-input" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔐</span>
                      <input type={showPassword ? "text" : "password"} placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className="form-input" required />
                    </div>
                  </div>
                  <button type="submit" className={`submit-btn ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                    {isLoading ? (
                      <><span className="spinner"></span><span>Creating...</span></>
                    ) : (
                      <><span>Create Account</span><span className="btn-arrow">→</span></>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p className="footer-text">
                    Already have an account?
                    <button onClick={() => { setShowSignUp(false); setError(""); }} className="signup-link">
                      Sign in
                    </button>
                  </p>
                </div>

                <div className="divider"><span>or continue with</span></div>

                <button onClick={handleGoogleSignIn} className="google-btn">
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="floating-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>
    </div>
  );
}