/**
 * Rotor annulus flanked by an opposing pair of pad arcs — the friction couple.
 *
 * Original geometry drawn for this demo — inspired by sector conventions, not by
 * any specific company's logo. Painted with currentColor so it inherits the theme.
 */
export function BrandMark({
  size = 26,
  className = '',
  title,
}: {
  size?: number
  className?: string
  title?: string
}) {
  return (
    <span className={`steve-brandmark ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="currentColor"
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        focusable="false"
      >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 3.5a12.5 12.5 0 1 0 0 25 12.5 12.5 0 0 0 0-25Zm0 6.1a6.4 6.4 0 1 1 0 12.8 6.4 6.4 0 0 1 0-12.8Z"
    />
    <path d="M5 27a15.5 15.5 0 0 1 0-22l1.4 1.4a13.6 13.6 0 0 0 0 19.2L5 27Z" />
    <path d="M27 5a15.5 15.5 0 0 1 0 22l-1.4-1.4a13.6 13.6 0 0 0 0-19.2L27 5Z" />
      </svg>
    </span>
  )
}
