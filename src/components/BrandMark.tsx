import Svg, { Path, Rect, Line } from "react-native-svg";
export function BrandMark({
  corporate = false,
  color = "#216A50",
  size = 38,
}: {
  corporate?: boolean;
  color?: string;
  size?: number;
}) {
  if (!corporate)
    return (
      <Svg
        width={size}
        height={size * 0.78}
        viewBox="0 0 56 44"
        accessibilityLabel="Tune Into Her"
      >
        <Path
          d="M33 6 A19 19 0 1 0 22 40 M34 32 A19 19 0 0 0 35 9 M34 37 A15 15 0 1 1 45 34"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessibilityLabel="THEA"
    >
      <Path d="M3 4 H37 V4.8 H38 V4 H45 V6 H38 V5.2 H37 V6 H3 Z" fill={color} />
      <Rect x="12" y="9" width="1.5" height="35" fill={color} />
      <Rect x="34" y="9" width="1.5" height="35" fill={color} />
      <Rect x="23" y="17" width="1.5" height="27" fill={color} />
      <Path d="M20 16 A4 4 0 0 1 28 16 Z" fill={color} />
      {[
        [18, 16, 16, 16],
        [19, 12, 18, 11],
        [21, 10, 20, 8],
        [24, 10, 24, 7],
        [27, 10, 28, 8],
        [29, 12, 30, 11],
        [30, 16, 32, 16],
      ].map((a, i) => (
        <Line
          key={i}
          x1={a[0]}
          y1={a[1]}
          x2={a[2]}
          y2={a[3]}
          stroke={color}
          strokeWidth=".6"
        />
      ))}
    </Svg>
  );
}
