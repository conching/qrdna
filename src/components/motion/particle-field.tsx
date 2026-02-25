"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  opacityBase: number;
  opacityPhase: number;
  opacitySpeed: number;
}

const COLORS = [
  "124, 92, 255",  // brand purple
  "6, 214, 160",   // teal
  "255, 182, 39",  // amber
];

function createParticle(width: number, height: number): Particle {
  const colorRGB = COLORS[Math.floor(Math.random() * COLORS.length)];
  const opacityBase = 0.15 + Math.random() * 0.15;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    radius: 1.5 + Math.random() * 2.5,
    color: colorRGB,
    opacity: opacityBase,
    opacityBase,
    opacityPhase: Math.random() * Math.PI * 2,
    opacitySpeed: 0.3 + Math.random() * 0.5,
  };
}

interface ParticleFieldProps {
  /** Particles per 100,000 square pixels. Default: 15 */
  density?: number;
  className?: string;
}

export function ParticleField({ density = 15, className }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx!.scale(dpr, dpr);

      // Recalculate particle count based on viewport area
      const area = window.innerWidth * window.innerHeight;
      const count = Math.round((area / 100_000) * density);
      const current = particlesRef.current;

      if (current.length < count) {
        for (let i = current.length; i < count; i++) {
          current.push(createParticle(window.innerWidth, window.innerHeight));
        }
      } else if (current.length > count) {
        current.length = count;
      }
    }

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    function animate() {
      if (!ctx || !canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      time += 0.016; // ~60fps time step

      for (const p of particlesRef.current) {
        // Update position with slow drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Subtle opacity pulse
        p.opacity =
          p.opacityBase +
          Math.sin(time * p.opacitySpeed + p.opacityPhase) * 0.08;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none fixed inset-0 z-0", className)}
      aria-hidden="true"
    />
  );
}
