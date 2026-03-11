import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

type SkeletonProps = {
  className?: string;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  circle?: boolean;
  style?: CSSProperties;
};

function Skeleton({
  className = "",
  width = "100%",
  height = 16,
  circle = false,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${circle ? styles.circle : ""} ${className}`.trim()}
      style={{ width, height, ...style }}
    />
  );
}

export default Skeleton;
