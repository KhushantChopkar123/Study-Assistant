
import "./landingpage.css";
import robotImage from "./assets/robot.png";

function LandingPage({ onLogin, onSignup, onGetStarted }) {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <a href="/" className="landing-brand">
          <span className="landing-logo">✦</span>
          <span>AI Learning Assistant</span>
        </a>

        <div className="landing-nav-actions">
          <button
            className="landing-login"
            onClick={onLogin}
          >
            Login
          </button>

          <button
            className="landing-signup"
            onClick={onSignup}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-main">
        <section className="landing-hero">
          {/* Hero Content */}
          <div className="landing-hero-content">
            <span className="landing-tagline">
              Your personal AI study companion.
            </span>

            <h1>
              Learn smarter.
              <br />
              <span>Understand better.</span>
            </h1>

            <p>
              Ask questions, understand difficult concepts,
              and explore your study materials with your
              AI learning assistant.
            </p>

            <button
              className="landing-cta"
              onClick={onGetStarted}
            >
              Get Started <span>→</span>
            </button>

            <div className="landing-subtext">
              Your AI-powered learning experience starts here.
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="landing-hero-art">
            <img
              src={robotImage}
              alt="AI study assistant robot with laptop and books"
            />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="landing-features">
          <article className="landing-feature">
            <span className="feature-icon">⚡</span>
            <div>
              <h3>Instant Answers</h3>
              <p>
                Get helpful responses to your questions.
              </p>
            </div>
          </article>

          <article className="landing-feature">
            <span className="feature-icon purple">▤</span>
            <div>
              <h3>Study Support</h3>
              <p>
                Understand difficult concepts with ease.
              </p>
            </div>
          </article>

          <article className="landing-feature">
            <span className="feature-icon cyan">▧</span>
            <div>
              <h3>Image &amp; PDF Analysis</h3>
              <p>
                Ask questions about your study materials.
              </p>
            </div>
          </article>

          <article className="landing-feature">
            <span className="feature-icon purple">◷</span>
            <div>
              <h3>Chat History</h3>
              <p>
                Revisit your previous conversations.
              </p>
            </div>
          </article>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        AI-Powered Student Learning Assistant
      </footer>
    </div>
  );
}

export default LandingPage;

