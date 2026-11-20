"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

// Número que cuenta desde 0 al entrar en pantalla.
export function Counter({ to, className = "" }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = String(to);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const obj = { v: 0 };
    el.textContent = "0";
    const tw = gsap.to(obj, {
      v: to,
      duration: 1.6,
      ease: "power2.out",
      paused: true,
      onUpdate: () => {
        el.textContent = String(Math.round(obj.v));
      },
    });
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => tw.play(),
    });
    return () => {
      st.kill();
      tw.kill();
    };
  }, [to]);
  return <span ref={ref} className={className} />;
}
