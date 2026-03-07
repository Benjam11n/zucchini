interface ProgressRingProps {
  progress: number;
}

export function ProgressRing({ progress }: ProgressRingProps) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <article className="panel progress-panel">
      <div>
        <p className="eyebrow">Progress</p>
        <h2>{progress}% complete</h2>
      </div>

      <svg className="progress-ring" viewBox="0 0 120 120">
        <circle className="progress-track" cx="60" cy="60" r="52" />
        <circle
          className="progress-value"
          cx="60"
          cy="60"
          r="52"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <text className="progress-label" x="50%" y="50%">
          {progress}%
        </text>
      </svg>
    </article>
  );
}
