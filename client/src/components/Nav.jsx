import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from './Icons.jsx';
import { event } from '../content/event.js';

const links = [
  { href: '/#about', label: 'About' },
  { href: '/#format', label: 'Format' },
  { href: '/#prizes', label: 'Prizes' },
  { href: '/#rules', label: 'Rules' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="shell nav__inner">
        <Link to="/" className="brand" aria-label={`${event.name} home`}>
          <span className="brand__mark" aria-hidden="true">D+</span>
          <span>Demo Days</span>
          <span className="brand__year">{event.year}</span>
        </Link>

        {pathname === '/' && (
          <nav className="nav__links" aria-label="Sections">
            {links.map((link) => (
              <a key={link.href} className="nav__link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {pathname === '/register' ? (
          <Link to="/" className="btn btn--ghost btn--sm">
            Back to event
          </Link>
        ) : (
          <Link to="/register" className="btn btn--accent btn--sm">
            Register <ArrowRight className="btn__arrow" width="14" height="14" />
          </Link>
        )}
      </div>
    </header>
  );
}
