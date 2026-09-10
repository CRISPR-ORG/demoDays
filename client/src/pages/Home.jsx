import { useState } from 'react';
import { Link } from 'react-router-dom';
import Tape from '../components/Tape.jsx';
import Countdown from '../components/Countdown.jsx';
import Reveal from '../components/Reveal.jsx';
import { ArrowRight, Check, Download, MapPin } from '../components/Icons.jsx';
import {
  about,
  dates,
  eligibility,
  event,
  faqs,
  heroStats,
  prizes,
  rules,
  stages,
} from '../content/event.js';

function SectionHead({ eyebrow, title, children, id }) {
  return (
    <Reveal className="section-head" id={id}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display-l">{title}</h2>
      {children && <p className="lead">{children}</p>}
    </Reveal>
  );
}

function Faq({ item, index }) {
  const [open, setOpen] = useState(index === 0);
  const panelId = `faq-panel-${index}`;

  return (
    <div className="faq__item" data-open={open}>
      <button
        type="button"
        className="faq__q"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {item.q}
        <span className="faq__sign" aria-hidden="true">+</span>
      </button>
      {open && (
        <p className="faq__a" id={panelId}>
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <div className="shell hero__grid">
          <div>
            <Reveal>
              <span className="eyebrow">{event.host}</span>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="display-xl hero__title">
                <span>Demo</span>
                <span>
                  Days<span className="hero__plus">+</span>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="lead" style={{ maxWidth: '52ch' }}>
                {event.tagline} Spot a real problem on campus, build the fix, and pitch it to a room
                that can help you ship it.
              </p>
            </Reveal>

            <Reveal delay={180} className="hero__meta">
              <span className="chip">
                <span className="chip__dot" /> {event.eventDate}
              </span>
              <span className="chip">
                <MapPin width="13" height="13" /> Seminar Hall, IIITN
              </span>
              <span className="chip">{event.prizePool} prize pool</span>
              <span className="chip">Teams of 2–4</span>
            </Reveal>

            <Reveal delay={240}>
              <Countdown target={event.registrationClosesAt} />
              <p className="hero__note">Registration closes {event.registrationClosesLabel}</p>
            </Reveal>

            <Reveal delay={300} className="hero__actions" style={{ marginTop: 26 }}>
              <Link to="/register" className="btn btn--accent btn--lg">
                Register your team <ArrowRight className="btn__arrow" width="17" height="17" />
              </Link>
              <a href={event.pptTemplateUrl} download className="btn btn--ghost btn--lg">
                <Download width="15" height="15" /> PPT template
              </a>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <figure className="poster" style={{ margin: 0 }}>
              <img
                src="/demoDays.jpeg"
                alt={`${event.name} ${event.year} poster — 17 September, ₹15,000 prize pool`}
                width="1024"
                height="1280"
              />
              <figcaption className="poster__tag">Official poster · 17 Sep 2026</figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="stats-band">
          <div className="shell stats">
            {heroStats.map((stat) => (
              <div className="stats__item" key={stat.label}>
                <div className="stats__label">{stat.label}</div>
                <div className="stats__value">{stat.value}</div>
                <div className="stats__note">{stat.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Tape
        tilt
        items={[
          'Demo Days 2026',
          '17 September',
          'Prize pool 15,000 INR',
          'IIIT Nagpur',
          'Ideas welcome',
        ]}
      />

      {/* ── About ──────────────────────────────────────── */}
      <section className="section" id="about">
        <div className="shell">
          <SectionHead eyebrow="The premise" title={about.heading} />

          <div className="about">
            <Reveal>
              {about.paragraphs.map((paragraph) => (
                <p className="lead" key={paragraph.slice(0, 24)}>
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <Reveal delay={100}>
              <ul className="about__list">
                {about.highlights.map((highlight, index) => (
                  <li key={highlight}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Format ─────────────────────────────────────── */}
      <section className="section section--alt" id="format">
        <div className="shell">
          <SectionHead eyebrow="Three rounds" title="How it runs">
            One online screening, one on-campus prelim, then a month of mentorship before the finals.
          </SectionHead>

          <div className="stages">
            {stages.map((stage, index) => (
              <Reveal className="stage" key={stage.index} delay={index * 80}>
                <div className="stage__index">{stage.index}</div>
                <div>
                  <h3 className="display-m">{stage.title}</h3>
                  <div className="stage__when">{stage.when}</div>
                  <p style={{ color: 'var(--cream-2)' }}>{stage.body}</p>
                  <ul className="stage__points">
                    {stage.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dates ──────────────────────────────────────── */}
      <section className="section" id="dates">
        <div className="shell">
          <SectionHead eyebrow="Calendar" title="Important dates">
            Dates marked as pending are confirmed by the organisers as the rounds are announced.
          </SectionHead>

          <Reveal className="dates">
            {dates.map((date) => (
              <div className="dates__row" key={date.label}>
                <span className="dates__label">{date.label}</span>
                <span className={`dates__value ${date.locked ? 'dates__value--tba' : ''}`}>
                  {date.value}
                </span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Prizes ─────────────────────────────────────── */}
      <section className="section section--alt" id="prizes">
        <div className="shell">
          <SectionHead eyebrow="Rewards" title="Prizes">
            Cash prizes, a mentor for a month, and the support to take the winning ideas further.
          </SectionHead>

          <div className="prizes">
            {prizes.map((prize, index) => (
              <Reveal
                className={`prize ${prize.featured ? 'prize--featured' : ''}`}
                key={prize.place}
                delay={index * 80}
              >
                <div className="prize__place">{prize.place}</div>
                <div className="prize__amount">{prize.amount}</div>
                <div className="prize__note">{prize.note}</div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="prize__pool">
              Total prize pool <b>{event.prizePool}</b>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Eligibility + rules ────────────────────────── */}
      <section className="section" id="rules">
        <div className="shell duo">
          <Reveal>
            <span className="eyebrow">Who can enter</span>
            <h2 className="display-m" style={{ marginTop: 12 }}>Eligibility</h2>
            <ul className="checklist">
              {eligibility.map((item) => (
                <li key={item}>
                  <Check width="15" height="15" color="var(--blue)" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="notice">
              <b>Team size:</b> 2 to 4 members per team, per the official brief.
            </div>
          </Reveal>

          <Reveal delay={90}>
            <span className="eyebrow">Play fair</span>
            <h2 className="display-m" style={{ marginTop: 12 }}>Rules</h2>
            <ol className="rulelist">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
            <div className="notice">
              <b>Bring your own setup:</b> every participant needs their own laptop for the offline
              rounds.
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section className="section section--alt" id="faq">
        <div className="shell">
          <SectionHead eyebrow="Questions" title="Good to know" />
          <Reveal className="faq">
            {faqs.map((item, index) => (
              <Faq item={item} index={index} key={item.q} />
            ))}
          </Reveal>
        </div>
      </section>

      <Tape reverse items={['Register now', 'Deadline 15 September', 'Demo Days 2026', 'Build. Pitch. Ship.']} />

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="cta">
        <div className="shell cta__inner">
          <span className="eyebrow">One form, five minutes</span>
          <h2 className="display-l" style={{ maxWidth: '18ch' }}>
            Got an idea? Put it on the board.
          </h2>
          <p className="lead" style={{ maxWidth: '54ch' }}>
            Register your team, list your members with their BT IDs, and upload your idea deck.
            You'll see a confirmation the moment it lands.
          </p>
          <Link to="/register" className="btn btn--accent btn--lg">
            Register your team <ArrowRight className="btn__arrow" width="17" height="17" />
          </Link>
        </div>
      </section>
    </>
  );
}
