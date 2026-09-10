import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import {
  Alert,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  FileIcon,
  Upload,
} from '../components/Icons.jsx';
import { event } from '../content/event.js';
import {
  ACCEPTED_EXTENSIONS,
  BT_ID_EXAMPLE,
  BT_ID_PATTERN,
  EMAIL_DOMAIN,
  MAX_UPLOAD_MB,
  TEAM_MAX,
  TEAM_MIN,
} from '../config.js';

const emptyMember = () => ({ name: '', btId: '' });

const sizeOptions = Array.from({ length: TEAM_MAX - TEAM_MIN + 1 }, (_, i) => TEAM_MIN + i);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validate({ teamName, leaderEmail, leaderPhone, members, file }) {
  const errors = {};

  if (teamName.trim().length < 3) errors.teamName = 'Team name must be at least 3 characters';
  else if (teamName.trim().length > 60) errors.teamName = 'Team name must be 60 characters or fewer';

  const email = leaderEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.leaderEmail = 'Enter a valid email address';
  } else if (!email.endsWith(EMAIL_DOMAIN)) {
    errors.leaderEmail = `Use your ${EMAIL_DOMAIN} email address`;
  }

  if (!/^(\+91)?[6-9]\d{9}$/.test(leaderPhone.replace(/[\s\-()]/g, ''))) {
    errors.leaderPhone = 'Enter a valid 10-digit mobile number';
  }

  const seen = new Set();
  members.forEach((member, index) => {
    if (member.name.trim().length < 2) {
      errors[`members.${index}.name`] = 'Enter this member’s full name';
    }
    const btId = member.btId.trim().toUpperCase();
    if (!BT_ID_PATTERN.test(btId)) {
      errors[`members.${index}.btId`] = `Format: ${BT_ID_EXAMPLE} (BT26 + branch + 3 digits)`;
    } else if (seen.has(btId)) {
      errors[`members.${index}.btId`] = 'This BT ID is already listed above';
    }
    if (btId) seen.add(btId);
  });

  if (!file) {
    errors.presentation = 'Attach your presentation before submitting';
  } else if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    errors.presentation = `File must be under ${MAX_UPLOAD_MB} MB`;
  } else if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    errors.presentation = 'Only PDF, PPT or PPTX files are accepted';
  }

  return errors;
}

/** Posts the form with XHR so the upload progress bar reflects real bytes sent. */
function postRegistration(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/register');
    request.responseType = 'json';

    request.upload.addEventListener('progress', (progressEvent) => {
      if (progressEvent.lengthComputable) {
        onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      }
    });

    request.addEventListener('load', () => {
      const body = request.response ?? {};
      if (request.status >= 200 && request.status < 300) resolve(body);
      else reject(Object.assign(new Error(body.message ?? 'Registration failed'), { body }));
    });

    request.addEventListener('error', () =>
      reject(new Error('Network error — check your connection and try again')),
    );

    request.send(formData);
  });
}

export default function Register() {
  const [teamName, setTeamName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [members, setMembers] = useState(() =>
    Array.from({ length: Math.max(TEAM_MIN, 2) }, emptyMember),
  );
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const [closed, setClosed] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/api/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.registrationClosed) setClosed(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filled = useMemo(() => {
    const checks = [
      teamName.trim().length >= 3,
      leaderEmail.trim().toLowerCase().endsWith(EMAIL_DOMAIN),
      /^(\+91)?[6-9]\d{9}$/.test(leaderPhone.replace(/[\s\-()]/g, '')),
      members.every(
        (member) => member.name.trim().length >= 2 && BT_ID_PATTERN.test(member.btId.trim().toUpperCase()),
      ),
      Boolean(file),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [teamName, leaderEmail, leaderPhone, members, file]);

  function setTeamSize(size) {
    setMembers((current) => {
      if (size === current.length) return current;
      if (size < current.length) return current.slice(0, size);
      return [...current, ...Array.from({ length: size - current.length }, emptyMember)];
    });
    setErrors((current) => {
      const next = { ...current };
      Object.keys(next)
        .filter((key) => key.startsWith('members.'))
        .forEach((key) => delete next[key]);
      return next;
    });
  }

  function updateMember(index, key, value) {
    setMembers((current) =>
      current.map((member, i) => (i === index ? { ...member, [key]: value } : member)),
    );
    clearError(`members.${index}.${key}`);
  }

  function clearError(key) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function pickFile(selected) {
    if (!selected) return;
    setFile(selected);
    clearError('presentation');
  }

  async function onSubmit(submitEvent) {
    submitEvent.preventDefault();
    setFormError('');

    const found = validate({ teamName, leaderEmail, leaderPhone, members, file });
    setErrors(found);

    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      document.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const formData = new FormData();
    formData.append('teamName', teamName.trim());
    formData.append('leaderEmail', leaderEmail.trim());
    formData.append('leaderPhone', leaderPhone.replace(/[\s\-()]/g, ''));
    formData.append(
      'members',
      JSON.stringify(
        members.map((member) => ({
          name: member.name.trim(),
          btId: member.btId.trim().toUpperCase(),
        })),
      ),
    );
    formData.append('presentation', file);

    setSubmitting(true);
    setProgress(0);

    try {
      const data = await postRegistration(formData, setProgress);
      setResult(data);
    } catch (error) {
      const fieldErrors = error.body?.fieldErrors;
      if (fieldErrors) {
        setErrors(fieldErrors);
        setFormError('Please fix the highlighted fields and submit again.');
      } else {
        setFormError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <section className="reg">
        <div className="shell success">
          <div className="success__mark">
            <CheckCircle />
          </div>
          <span className="eyebrow">Registration confirmed</span>
          <h1 className="display-l" style={{ marginTop: 14 }}>
            You’re in.
          </h1>
          <p className="lead" style={{ marginTop: 14 }}>
            Your team and idea deck have been recorded under your team name.
          </p>

          <dl className="success__summary">
            <div>
              <dt>Team</dt>
              <dd>{result.teamName}</dd>
            </div>
            <div>
              <dt>Members</dt>
              <dd>{result.teamSize}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{result.submittedAt}</dd>
            </div>
          </dl>

          <div className="success__actions">
            <Link to="/" className="btn btn--accent">
              <ArrowLeft width="15" height="15" /> Back to event
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="reg">
      <div className="shell">
        <Link to="/" className="back-link">
          <ArrowLeft width="14" height="14" /> Event details
        </Link>

        <div className="reg__grid">
          <div>
            <Reveal className="section-head" style={{ marginBottom: 26 }}>
              <span className="eyebrow">Team registration · {event.year}</span>
              <h1 className="display-l">Register your team</h1>
              <p className="lead">
                One submission per team. The details below go straight to the organisers’ sheet and
                your deck lands in the official Drive folder.
              </p>
            </Reveal>

            {closed && (
              <div className="closed-note">
                <Alert />
                <span>
                  Registration closed on {event.registrationClosesLabel}. Submissions are no longer
                  accepted — contact the organisers if you need an exception.
                </span>
              </div>
            )}

            <div className="progress" aria-hidden="true">
              <div className="progress__bar" style={{ width: `${filled}%` }} />
            </div>

            <form className="form" onSubmit={onSubmit} noValidate>
              {/* Step 1 — team */}
              <fieldset className="fieldset">
                <div className="fieldset__head">
                  <span className="fieldset__num">1</span>
                  <div>
                    <div className="fieldset__title">Your team</div>
                    <div className="fieldset__hint">Pick a name you would say out loud on stage.</div>
                  </div>
                </div>

                <div className="field" data-field="teamName">
                  <label className="label" htmlFor="teamName">
                    Team name <span className="label__req">*</span>
                  </label>
                  <input
                    id="teamName"
                    className="input"
                    value={teamName}
                    maxLength={60}
                    placeholder="e.g. Campus Compass"
                    aria-invalid={Boolean(errors.teamName)}
                    onChange={(inputEvent) => {
                      setTeamName(inputEvent.target.value);
                      clearError('teamName');
                    }}
                  />
                  {errors.teamName ? (
                    <span className="error">
                      <Alert width="12" height="12" /> {errors.teamName}
                    </span>
                  ) : (
                    <span className="hint">Must be unique — duplicate names are rejected.</span>
                  )}
                </div>

                <div className="field__row" style={{ marginTop: 16 }}>
                  <div className="field" data-field="leaderEmail">
                    <label className="label" htmlFor="leaderEmail">
                      Team lead email <span className="label__req">*</span>
                    </label>
                    <input
                      id="leaderEmail"
                      className="input"
                      type="email"
                      value={leaderEmail}
                      placeholder="you@iiitn.ac.in"
                      aria-invalid={Boolean(errors.leaderEmail)}
                      onChange={(inputEvent) => {
                        setLeaderEmail(inputEvent.target.value);
                        clearError('leaderEmail');
                      }}
                    />
                    {errors.leaderEmail && (
                      <span className="error">
                        <Alert width="12" height="12" /> {errors.leaderEmail}
                      </span>
                    )}
                  </div>

                  <div className="field" data-field="leaderPhone">
                    <label className="label" htmlFor="leaderPhone">
                      Team lead phone <span className="label__req">*</span>
                    </label>
                    <input
                      id="leaderPhone"
                      className="input"
                      type="tel"
                      value={leaderPhone}
                      placeholder="9876543210"
                      aria-invalid={Boolean(errors.leaderPhone)}
                      onChange={(inputEvent) => {
                        setLeaderPhone(inputEvent.target.value);
                        clearError('leaderPhone');
                      }}
                    />
                    {errors.leaderPhone && (
                      <span className="error">
                        <Alert width="12" height="12" /> {errors.leaderPhone}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Step 2 — members */}
              <fieldset className="fieldset">
                <div className="fieldset__head">
                  <span className="fieldset__num">2</span>
                  <div>
                    <div className="fieldset__title">Members</div>
                    <div className="fieldset__hint">
                      Between {TEAM_MIN} and {TEAM_MAX} members. Member 1 is the team lead.
                    </div>
                  </div>
                </div>

                <div className="field">
                  <span className="label" id="team-size-label">
                    Number of members <span className="label__req">*</span>
                  </span>
                  <div className="sizes" role="group" aria-labelledby="team-size-label">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="size"
                        aria-pressed={members.length === size}
                        aria-label={`${size} member${size === 1 ? '' : 's'}`}
                        onClick={() => setTeamSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="members" style={{ marginTop: 18 }}>
                  {members.map((member, index) => (
                    <div className="member" key={index}>
                      <div className="member__head">
                        <span className="member__tag">Member {index + 1}</span>
                        {index === 0 && <span className="member__badge">Team lead</span>}
                      </div>

                      <div className="field__row">
                        <div className="field" data-field={`members.${index}.name`}>
                          <label className="label" htmlFor={`member-name-${index}`}>
                            Full name <span className="label__req">*</span>
                          </label>
                          <input
                            id={`member-name-${index}`}
                            className="input"
                            value={member.name}
                            placeholder="Full name"
                            autoComplete="off"
                            aria-invalid={Boolean(errors[`members.${index}.name`])}
                            onChange={(inputEvent) =>
                              updateMember(index, 'name', inputEvent.target.value)
                            }
                          />
                          {errors[`members.${index}.name`] && (
                            <span className="error">
                              <Alert width="12" height="12" /> {errors[`members.${index}.name`]}
                            </span>
                          )}
                        </div>

                        <div className="field" data-field={`members.${index}.btId`}>
                          <label className="label" htmlFor={`member-bt-${index}`}>
                            BT ID <span className="label__req">*</span>
                          </label>
                          <input
                            id={`member-bt-${index}`}
                            className="input input--mono"
                            value={member.btId}
                            placeholder={BT_ID_EXAMPLE}
                            autoComplete="off"
                            aria-invalid={Boolean(errors[`members.${index}.btId`])}
                            onChange={(inputEvent) =>
                              updateMember(index, 'btId', inputEvent.target.value.toUpperCase())
                            }
                          />
                          {errors[`members.${index}.btId`] ? (
                            <span className="error">
                              <Alert width="12" height="12" /> {errors[`members.${index}.btId`]}
                            </span>
                          ) : (
                            <span className="hint">ECE / ECI / CSE / CSD / CSH / CSA</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Step 3 — deck */}
              <fieldset className="fieldset">
                <div className="fieldset__head">
                  <span className="fieldset__num">3</span>
                  <div>
                    <div className="fieldset__title">Idea deck</div>
                    <div className="fieldset__hint">
                      Built on the official template. PDF, PPT or PPTX, up to {MAX_UPLOAD_MB} MB.
                    </div>
                  </div>
                </div>

                <div className="field" data-field="presentation">
                  {file ? (
                    <div className="file">
                      <span className="file__icon">
                        <FileIcon />
                      </span>
                      <span className="file__body">
                        <span className="file__name">{file.name}</span>
                        <span className="file__size">{formatBytes(file.size)}</span>
                      </span>
                      <button
                        type="button"
                        className="file__remove"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="drop"
                      data-dragging={dragging}
                      data-invalid={Boolean(errors.presentation)}
                      onDragOver={(dragEvent) => {
                        dragEvent.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(dropEvent) => {
                        dropEvent.preventDefault();
                        setDragging(false);
                        pickFile(dropEvent.dataTransfer.files?.[0]);
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS.join(',')}
                        onChange={(inputEvent) => pickFile(inputEvent.target.files?.[0])}
                      />
                      <span className="drop__icon">
                        <Upload />
                      </span>
                      <span className="drop__title">Drop your deck here</span>
                      <span className="drop__sub">
                        or click to browse · {ACCEPTED_EXTENSIONS.join(' / ')} · max {MAX_UPLOAD_MB} MB
                      </span>
                    </label>
                  )}

                  {errors.presentation && (
                    <span className="error">
                      <Alert width="12" height="12" /> {errors.presentation}
                    </span>
                  )}
                </div>

                <a
                  href={event.pptTemplateUrl}
                  download
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: 16 }}
                >
                  <Download width="14" height="14" /> Download the PPT template
                </a>
              </fieldset>

              {formError && (
                <div className="alert alert--error">
                  <Alert />
                  <span>{formError}</span>
                </div>
              )}

              {submitting && progress > 0 && (
                <div className="progress" aria-live="polite">
                  <div className="progress__bar" style={{ width: `${progress}%` }} />
                </div>
              )}

              <div className="submit-bar">
                <p className="submit-bar__note">
                  By submitting you confirm the details are accurate and that your team agrees to the
                  event rules.
                </p>
                <button
                  type="submit"
                  className="btn btn--accent btn--lg"
                  disabled={submitting || closed}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" /> {progress < 100 ? `Uploading ${progress}%` : 'Saving…'}
                    </>
                  ) : (
                    <>
                      Submit registration <ArrowRight className="btn__arrow" width="16" height="16" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Aside */}
          <aside className="reg__aside">
            <Reveal className="aside-card">
              <div className="aside-card__title">Before you submit</div>
              <ul className="aside-list">
                <li>
                  <span>01</span>
                  <span>Every member’s name and BT ID, spelled as on record.</span>
                </li>
                <li>
                  <span>02</span>
                  <span>Your idea deck built on the official Demo Days template.</span>
                </li>
                <li>
                  <span>03</span>
                  <span>A reachable email and phone number for the team lead.</span>
                </li>
                <li>
                  <span>04</span>
                  <span>A team name you are happy to see on the leaderboard.</span>
                </li>
              </ul>
            </Reveal>

            <div className="aside-card">
              <div className="aside-card__title">Event at a glance</div>
              <div className="aside-meta">
                <div className="aside-meta__row">
                  <span className="aside-meta__k">Prelims</span>
                  <span className="aside-meta__v">{event.eventDate}</span>
                </div>
                <div className="aside-meta__row">
                  <span className="aside-meta__k">Venue</span>
                  <span className="aside-meta__v">Seminar Hall, IIITN</span>
                </div>
                <div className="aside-meta__row">
                  <span className="aside-meta__k">Prize pool</span>
                  <span className="aside-meta__v">{event.prizePool}</span>
                </div>
                <div className="aside-meta__row">
                  <span className="aside-meta__k">Deadline</span>
                  <span className="aside-meta__v">{event.registrationClosesLabel}</span>
                </div>
              </div>
            </div>

            <div className="aside-card">
              <div className="aside-card__title">Need help?</div>
              <p style={{ fontSize: '0.87rem', color: 'var(--cream-2)', margin: 0 }}>
                Stuck on the form or the template? Reach the organising team on campus at the{' '}
                {event.presentedBy} desk before the deadline.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
