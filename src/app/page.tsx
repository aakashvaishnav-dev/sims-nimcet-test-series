import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const features = [
  ["⏱", "Server-timed tests", "The test deadline is enforced on the server, so refreshing or reopening the browser cannot reset the exam timer."],
  ["✓", "Automatic submission", "When time expires, the attempt is closed and scored automatically. A scheduled safety job also finalizes expired attempts."],
  ["↥", "One-click question import", "Upload XLSX, CSV or DOCX question files, preview validation, then add them directly to the selected test."],
  ["▤", "Instant results", "Students get score, correct/wrong/unanswered counts, rank and answer review immediately after submission."],
  ["⌁", "Admin monitoring", "View students, live attempts, completed results and test performance from one secure admin dashboard."],
  ["⚡", "Fast on every device", "Responsive Next.js interface built for mobile, tablet, laptop and desktop with minimal client-side overhead."]
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">SIMS Raipur • P. Nishad Sir</div>
              <h1>NIMCET <span>Online Test Series</span></h1>
              <p>Practice in a clean CBT-style environment with timed mock tests, automatic answer saving, auto-submit and instant result analysis.</p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/dashboard">Start Test Series</Link>
                <Link className="btn btn-secondary" href="/auth/login">Student Login</Link>
              </div>
              <div className="hero-points" aria-label="Key features">
                <span className="pill">Timed Mock Tests</span>
                <span className="pill">Instant Results</span>
                <span className="pill">Auto Submit</span>
                <span className="pill">Mobile Friendly</span>
              </div>
            </div>
            <div className="hero-logo-card" aria-label="SIMS Raipur branding">
              <div className="hero-glow" />
              <Image src="/sims-raipur-logo.png" alt="SIMS Raipur golden logo" width={540} height={540} priority />
            </div>
          </div>
        </section>

        <section className="section section-soft">
          <div className="container">
            <div className="section-title">
              <div>
                <div className="eyebrow">Built for reliable testing</div>
                <h2>Everything needed for a simple test series</h2>
                <p>No unnecessary complexity. Students test, results are recorded, and questions can be imported in bulk.</p>
              </div>
            </div>
            <div className="grid-3">
              {features.map(([icon, title, text]) => (
                <article className="card feature-card" key={title}>
                  <div className="feature-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container card card-pad guidance-card">
            <div className="guidance-grid">
              <div>
                <div className="eyebrow">Academic guidance</div>
                <h2 className="page-title" style={{ marginTop: 10 }}>Prepare with SIMS Raipur</h2>
                <p className="page-lead">Teacher: <strong className="gold">P. Nishad Sir</strong><br />Contact: <strong>8959774702</strong><br />Floor - 3, Main Road Choubey Colony, Samta, Raipur - 492001</p>
              </div>
              <div className="guidance-logo-wrap">
                <Image src="/sims-raipur-logo.png" alt="SIMS Raipur full logo" width={300} height={300} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
