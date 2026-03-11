import type { CSSProperties } from "react";
import Skeleton from "./Skeleton";

type SkeletonAvatarProps = {
  size?: CSSProperties["width"];
  className?: string;
};

function SkeletonAvatar({
  size = 48,
  className = "",
}: SkeletonAvatarProps) {
  return <Skeleton className={className} width={size} height={size} circle />;
}

export default SkeletonAvatar;
