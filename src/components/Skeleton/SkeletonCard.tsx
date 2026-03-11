import type { CSSProperties } from "react";
import Skeleton from "./Skeleton";
import SkeletonAvatar from "./SkeletonAvatar";
import SkeletonButton from "./SkeletonButton";
import SkeletonText from "./SkeletonText";
import styles from "./Skeleton.module.css";

type SkeletonCardProps = {
  className?: string;
  titleWidth?: CSSProperties["width"];
  lines?: number;
  lineWidths?: Array<CSSProperties["width"]>;
  mediaHeight?: CSSProperties["height"];
  actionCount?: number;
  avatar?: boolean;
  avatarSize?: CSSProperties["width"];
};

function SkeletonCard({
  className = "",
  titleWidth = "42%",
  lines = 2,
  lineWidths,
  mediaHeight,
  actionCount = 0,
  avatar = false,
  avatarSize = 48,
}: SkeletonCardProps) {
  return (
    <div aria-hidden="true" className={`${styles.card} ${className}`.trim()}>
      {avatar ? (
        <div className={styles.cardHeader}>
          <SkeletonAvatar size={avatarSize} />
          <div className={styles.cardHeaderText}>
            <Skeleton width={titleWidth} height={18} />
            <Skeleton width="58%" height={13} />
          </div>
        </div>
      ) : (
        <Skeleton width={titleWidth} height={18} />
      )}

      {lines > 0 ? <SkeletonText lines={lines} widths={lineWidths} /> : null}

      {mediaHeight ? (
        <Skeleton className={styles.media} height={mediaHeight} />
      ) : null}

      {actionCount > 0 ? (
        <div className={styles.cardActions}>
          {Array.from({ length: actionCount }).map((_, index) => (
            <SkeletonButton key={`skeleton-action-${index}`} width={index === 0 ? 120 : 96} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default SkeletonCard;
