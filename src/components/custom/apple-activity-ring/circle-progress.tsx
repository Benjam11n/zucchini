"use client";

import { useEffect, useState } from "react";

import type { CircleProgressProps } from "./types";

export function CircleProgress({ data, index }: CircleProgressProps) {
  const strokeWidth = 20;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsVisible(true);
    }, index * 120);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [index]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.92)",
      }}
    >
      <div className="relative">
        <svg
          aria-label={`${data.label} Activity Progress - ${data.value}%`}
          className="transform -rotate-90"
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          width={data.size}
        >
          <title>{`${data.label} Activity Progress - ${data.value}%`}</title>

          <circle
            className="text-zinc-200/40 dark:text-zinc-800/60"
            cx={data.size / 2}
            cy={data.size / 2}
            fill="none"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />

          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            fill="none"
            r={radius}
            stroke={data.color}
            strokeDasharray={circumference}
            strokeDashoffset={isVisible ? progress : circumference}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            style={{
              filter: `drop-shadow(0 0 6px ${data.color}55)`,
              transition: `stroke-dashoffset 1200ms ease-in-out ${index * 120}ms`,
            }}
          />
        </svg>
      </div>
    </div>
  );
}
