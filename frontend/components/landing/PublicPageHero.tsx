"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function PublicPageHero({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="px-2 pt-3 sm:px-3">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-10 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="absolute -right-32 -top-48 h-[30rem] w-[30rem] rounded-full bg-[#608db9]/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#c8dae8]/10 blur-3xl" />
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09 } },
          }}
          className="relative mx-auto grid max-w-[1440px] gap-7 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <motion.span
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55, ease: easeOut }}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8dae8]" />
              {eyebrow}
            </motion.span>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8, ease: easeOut }}
              className="mt-4 max-w-4xl text-[clamp(2.5rem,4.8vw,5rem)] font-medium leading-[0.91] tracking-[-0.06em]"
            >
              {title}
            </motion.h1>
            {description && (
              <motion.p
                variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.65, ease: easeOut }}
                className="mt-5 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7"
              >
                {description}
              </motion.p>
            )}
          </div>
          {aside && (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.65, ease: easeOut }}
              className="w-full lg:w-auto"
            >
              {aside}
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
