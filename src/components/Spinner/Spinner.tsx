import { ClipLoader } from "react-spinners";

type SpinnerProps = {
  size?: number;
  color?: string;
  loadingLabel?: string;
};

function Spinner({
  size = 18,
  color = "currentColor",
  loadingLabel,
}: SpinnerProps) {
  return (
    <span
      aria-hidden={loadingLabel ? undefined : "true"}
      aria-label={loadingLabel}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
    >
      <ClipLoader color={color} size={size} speedMultiplier={0.9} />
    </span>
  );
}

export default Spinner;
