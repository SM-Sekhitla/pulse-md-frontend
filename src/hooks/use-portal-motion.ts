import { useEffect, useState } from "react";

/** Animate navigation without remounting forms or changing fixed-panel positioning. */
export function usePortalMotion(path: string) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || !element.animate) return;
    const animation = preference.matches
      ? null
      : element.animate([{ opacity: 0.65 }, { opacity: 1 }], {
          duration: 220,
          easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        });
    const onPreferenceChange = () => {
      if (preference.matches) animation?.cancel();
    };
    preference.addEventListener("change", onPreferenceChange);
    return () => {
      animation?.cancel();
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, [path, element]);
  return setElement;
}
