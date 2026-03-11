import type { CSSProperties } from "react";
import Skeleton from "./Skeleton";
import styles from "./Skeleton.module.css";

type SkeletonButtonProps = {
  width?: CSSProperties["width"];
  className?: string;
};

function SkeletonButton({
  width = "100%",
  className = "",
}: SkeletonButtonProps) {
  return (
    <Skeleton
      className={`${styles.button} ${className}`.trim()}
      width={width}
      height={40}
    />
  );
}

export default SkeletonButton;
