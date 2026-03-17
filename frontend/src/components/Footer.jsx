import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>📱 BlueTrack</h4>
          <p className="footer-version">v1.0.0 - Attendance Management System</p>
        </div>

        <div className="footer-section">
          <h4>👨‍💻 Developer</h4>
          <div className="footer-developer">
            <p className="developer-name">Ramakrishna Bootla</p>
            <a 
              href="https://ramakrishnab.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="portfolio-link"
            >
              🔗 View Portfolio
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>✨ Tech Stack</h4>
          <p className="tech-stack">React • Node.js • MySQL • Express</p>
        </div>

        <div className="footer-section">
          <h4>📧 Support</h4>
          <p className="footer-text">Have questions? Contact via portfolio</p>
          <a 
            href="mailto:bootlaramakrishna0@gmail.com" 
            className="footer-email"
          >
            bootlaramakrishna0@gmail.com
          </a>
        </div>
      </div>

      {/* <div className="footer-bottom">
        <p className="copyright">
          © {currentYear} BlueTrack. Built with ❤️ by Rama Krishna B
        </p>
      </div> */}
    </footer>
  )
}

export default Footer
