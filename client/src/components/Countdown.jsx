import { useEffect, useMemo, useState } from 'react';

const UNITS = [
  { key: 'days', label: 'days', ms: 86400000 },
  { key: 'hours', label: 'hrs', ms: 3600000 },
  { key: 'minutes', label: 'min', ms: 60000 },
  { key: 'seconds', label: 'sec', ms: 1000 },
];

function breakdown(remaining) {
  let left = remaining;
  return UNITS.map((unit) => {
    const value = Math.floor(left / unit.ms);
    left -= value * unit.ms;
    return { ...unit, value };
  });
}

/** Live countdown to the registration deadline. */
export default function Countdown({ target }) {
  const deadline = useMemo(() => new Date(target).getTime(), [target]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = deadline - now;

  if (Number.isNaN(deadline)) return null;

  if (remaining <= 0) {
    return <p className="countdown--closed">Registration is closed</p>;
  }

  return (
    <div className="countdown" role="timer" aria-label="Time left to register">
      {breakdown(remaining).map((unit) => (
        <div className="countdown__cell" key={unit.key}>
          <div className="countdown__num">{String(unit.value).padStart(2, '0')}</div>
          <div className="countdown__label">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
