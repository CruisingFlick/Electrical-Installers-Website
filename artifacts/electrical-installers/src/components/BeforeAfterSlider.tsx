import { useState, useRef, useCallback, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  onBeforeError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onAfterError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  onBeforeError,
  onAfterError,
}: Props) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX != null) setFromClientX(clientX);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, setFromClientX]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none cursor-ew-resize ${className}`}
      onMouseDown={(e) => { setDragging(true); setFromClientX(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); const x = e.touches[0]?.clientX; if (x != null) setFromClientX(x); }}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
        else if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
      }}
    >
      <img
        src={afterUrl}
        alt={afterLabel}
        draggable={false}
        onError={onAfterError}
        className="block w-full h-full object-cover pointer-events-none"
      />
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          draggable={false}
          onError={onBeforeError}
          className="block h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.getBoundingClientRect().width}px` : "100%", maxWidth: "none" }}
        />
      </div>

      <span className="absolute top-3 left-3 bg-[hsl(214,60%,14%)]/80 text-white text-xs font-semibold px-2.5 py-1 rounded pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 bg-[hsl(25,95%,53%)]/90 text-white text-xs font-semibold px-2.5 py-1 rounded pointer-events-none">
        {afterLabel}
      </span>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <MoveHorizontal size={18} className="text-[hsl(214,60%,14%)]" />
        </div>
      </div>
    </div>
  );
}
