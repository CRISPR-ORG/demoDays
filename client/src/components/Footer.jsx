import { Link } from 'react-router-dom';
import { event } from '../content/event.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer__grid">
        <div>
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand__mark" aria-hidden="true">D+</span>
            <span>Demo Days {event.year}</span>
          </div>
          <p className="footer__meta">
            {event.host}
            <br />
            {event.venue}
            <br />
            Presented by {event.presentedBy}
          </p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <Link to="/register">Register a team</Link>
          <a href="/#format">Rounds &amp; format</a>
          <a href="/#prizes">Prizes</a>
          <a href={event.pptTemplateUrl} download>
            PPT template
          </a>
        </nav>

        <p className="footer__meta">
          Registration closes
          <br />
          <strong style={{ color: 'var(--cream)' }}>{event.registrationClosesLabel}</strong>
        </p>
      </div>
    </footer>
  );
}
