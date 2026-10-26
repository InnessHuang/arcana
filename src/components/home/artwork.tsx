export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function TarotArt({
  variant = "sun",
  className = "",
}: {
  variant?: "sun" | "moon" | "back";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 350"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="218"
        height="348"
        rx="108"
        fill={variant === "back" ? "#423f35" : "#f0e8d7"}
        stroke="currentColor"
      />
      <rect
        x="12"
        y="12"
        width="196"
        height="326"
        rx="97"
        stroke="currentColor"
        opacity=".5"
      />
      {variant === "back" ? (
        <>
          <path d="M110 57 178 175 110 293 42 175Z" stroke="#c9bb94" />
          <path d="m110 99 44 76-44 76-44-76Z" stroke="#c9bb94" />
          <circle cx="110" cy="175" r="29" stroke="#c9bb94" />
          <path d="M110 136v78m-39-39h78" stroke="#c9bb94" />
        </>
      ) : (
        <>
          <text
            x="110"
            y="44"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Georgia, serif"
            fontSize="11"
            letterSpacing="3"
          >
            {variant === "sun" ? "XIX" : "XVIII"}
          </text>
          <path
            d="M29 247c30-26 45-9 75-27 36-22 61-3 87-28M27 266c40-26 61-4 93-24 29-18 48-11 73-17M35 285c33-19 50-1 84-17 31-15 49-7 67-17"
            stroke="currentColor"
            opacity=".6"
          />
          {variant === "sun" ? (
            <>
              <circle cx="110" cy="137" r="38" fill="#b76439" />
              {Array.from({ length: 16 }, (_, i) => (
                <path
                  key={i}
                  d="M110 84v-14"
                  stroke="#b76439"
                  transform={`rotate(${i * 22.5} 110 137)`}
                />
              ))}
              <path
                d="M103 131h1m12 0h1m-12 17q6 5 12 0"
                stroke="#f0e8d7"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <path
                d="M128 91a45 45 0 1 0 9 78 43 43 0 0 1-9-78Z"
                fill="#747c6a"
              />
              <path
                d="m60 89 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm99 69 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"
                fill="#a17b40"
              />
            </>
          )}
          <path
            d="M71 217v-21m-7 8 7 7 7-7m71 12v-27m-7 9 7 7 7-7"
            stroke="currentColor"
          />
          <text
            x="110"
            y="314"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Georgia, serif"
            fontSize="12"
            letterSpacing="3"
          >
            {variant === "sun" ? "THE SUN" : "THE MOON"}
          </text>
        </>
      )}
    </svg>
  );
}

export function TopicIcon({ kind }: { kind: string }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      {kind === "circles" ? (
        <>
          <circle cx="18" cy="24" r="12" />
          <circle cx="30" cy="24" r="12" />
        </>
      ) : kind === "path" ? (
        <>
          <path d="M8 38 24 10l16 28ZM24 10v28M8 38l16-10 16 10" />
          <circle cx="24" cy="10" r="3" fill="currentColor" />
        </>
      ) : kind === "star" ? (
        <>
          <path d="M24 5c0 13 6 19 19 19-13 0-19 6-19 19 0-13-6-19-19-19 13 0 19-6 19-19Z" />
          <circle cx="24" cy="24" r="6" />
        </>
      ) : (
        <>
          <path d="M10 10h28v28H10ZM10 10l28 28M38 10 10 38" />
          <circle cx="24" cy="24" r="8" />
        </>
      )}
    </svg>
  );
}
