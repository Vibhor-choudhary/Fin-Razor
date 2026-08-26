import React from "react";
import type { CSSProperties } from "react";
import './Ripple.css';

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.5,
  numCircles = 8,
  className = "",
}: RippleProps) {
  return (
    <div className={`ripple-container ${className}`}>
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.04;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";
        const borderOpacity = 5 + i * 5;

        return (
          <div
            key={i}
            className="ripple-circle"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderStyle,
                borderWidth: "1px",
                borderColor: `rgba(0, 0, 0, ${borderOpacity / 100})`,
                "--i": i,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});
