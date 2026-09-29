import Image from "next/image";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Image className="footer-logo" src="/sims-raipur-logo.png" alt="SIMS Raipur logo" width={122} height={122} />
          <div>
            <div className="footer-title">SIMS RAIPUR</div>
            <div className="footer-text">NIMCET Online Test Series designed for fast practice, timed examinations and instant performance analysis.</div>
          </div>
        </div>
        <div>
          <div className="footer-title">Academic Guidance</div>
          <div className="footer-text">Teacher<br /><strong className="gold">P. Nishad Sir</strong><br /><br />Contact<br /><strong>8959774702</strong></div>
        </div>
        <div>
          <div className="footer-title">Visit SIMS</div>
          <div className="footer-text">Floor - 3, Main Road Choubey Colony,<br />Samta, Raipur - 492001</div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} SIMS Raipur. All Rights Reserved.</span>
        <span>Website created by <strong>Aakash Vaishnav</strong></span>
      </div>
    </footer>
  );
}
