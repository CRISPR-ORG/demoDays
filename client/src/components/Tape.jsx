/**
 * The diagonal caution-tape strip from the poster. Content is duplicated so the
 * marquee can loop seamlessly at -50%.
 */
export default function Tape({ items, tilt = false, reverse = false }) {
  const group = (
    <div className="tape__group" aria-hidden="true">
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>
          {item}
          <span className="tape__dot"> ✦ </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`tape ${tilt ? 'tape--tilt' : ''} ${reverse ? 'tape--reverse' : ''}`}>
      <div className="tape__track">
        {group}
        {group}
      </div>
    </div>
  );
}
