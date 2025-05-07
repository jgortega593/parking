// src/components/Emoji.jsx
export default function Emoji({ symbol, label }) {
  return (
    <span role="img" aria-label={label} aria-hidden={label ? "false" : "true"}>
      {symbol}
    </span>
  )
}
