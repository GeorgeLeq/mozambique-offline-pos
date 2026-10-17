export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100/80 to-slate-200/90 dark:from-zinc-950 dark:via-zinc-900/95 dark:to-zinc-950" />
      {/* Top-left soft radial gradient ambient glow - 0% CPU Gaussian blur overhead */}
      <div className="absolute top-0 left-0 w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.09),transparent_70%)] pointer-events-none" />
      {/* Bottom-right soft radial gradient ambient glow */}
      <div className="absolute bottom-0 right-0 w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.07),transparent_70%)] pointer-events-none" />
    </div>
  );
}

