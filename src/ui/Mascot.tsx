export function Mascot({ size }: { size: "small" | "large" }) {
  return (
    <img
      className={`mascot mascot-${size}`}
      src={`${import.meta.env.BASE_URL}icon-192.png`}
      srcSet={`${import.meta.env.BASE_URL}icon-192.png 192w, ${import.meta.env.BASE_URL}icon-512.png 512w`}
      sizes={size === "small" ? "48px" : "176px"}
      width={size === "small" ? 48 : 176}
      height={size === "small" ? 48 : 176}
      alt=""
      decoding="async"
    />
  );
}
