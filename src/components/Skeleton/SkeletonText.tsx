import type { CSSProperties } from "react";
import Skeleton from "./Skeleton";
import styles from "./Skeleton.module.css";

type SkeletonTextProps = {
  lines?: number;
  widths?: Array<CSSProperties["width"]>;
  lineHeight?: CSSProperties["height"];
  className?: string;
};

function SkeletonText({
  lines = 3,
  widths = ["100%", "86%", "62%"],
  lineHeight = 14,
  className = "",
}: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={`${styles.textGroup} ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={`skeleton-line-${index}`}
          width={widths[index] ?? widths[widths.length - 1] ?? "100%"}
          height={lineHeight}
        />
      ))}
    </div>
  );
}

export default SkeletonText;
