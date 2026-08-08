type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
};

export function Skeleton({ width = '100%', height = 16, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
      }}
      aria-hidden
    />
  );
}
