import { useEffect, useRef, useState } from 'react';

// Lightweight scroll-reveal: adds 'in-view' once the element crosses the
// viewport threshold. Respects prefers-reduced-motion via CSS (see index.css).
export function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}
