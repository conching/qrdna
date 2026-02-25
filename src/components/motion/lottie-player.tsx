"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { AnimationItem } from "lottie-web";

interface LottiePlayerProps {
  /** Lottie JSON animation data object */
  animationData: object;
  /** When the animation plays. Default: "mount" */
  trigger?: "mount" | "hover" | "scroll";
  /** Whether the animation loops. Default: true */
  loop?: boolean;
  /** Playback speed multiplier. Default: 1 */
  speed?: number;
  className?: string;
}

export function LottiePlayer({
  animationData,
  trigger = "mount",
  loop = true,
  speed = 1,
  className,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  // Dynamically import lottie-web light build
  const initLottie = useCallback(async () => {
    if (!containerRef.current) return;

    const lottie = (await import("lottie-web/build/player/lottie_light"))
      .default;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay: trigger === "mount",
      animationData,
    });

    anim.setSpeed(speed);
    animRef.current = anim;
  }, [animationData, loop, speed, trigger]);

  useEffect(() => {
    initLottie();

    return () => {
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [initLottie]);

  // Hover trigger
  useEffect(() => {
    if (trigger !== "hover") return;
    const el = containerRef.current;
    if (!el) return;

    const handleEnter = () => animRef.current?.play();
    const handleLeave = () => animRef.current?.stop();

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [trigger]);

  // Scroll trigger via IntersectionObserver
  useEffect(() => {
    if (trigger !== "scroll") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animRef.current?.play();
        } else {
          animRef.current?.pause();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      className={cn("inline-flex", className)}
      aria-hidden="true"
    />
  );
}
