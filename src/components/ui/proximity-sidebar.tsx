"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { cn } from "@/lib/utils"

type Side = "left" | "right"
type SectionKind = "title" | "subtitle" | "section" | "body"
type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6

export type ProximitySection = {
  id: string
  label: string
  kind?: SectionKind
  level?: SectionLevel
}

type DashPreset = {
  base: number
  bump: number
  thickness: number
  className: string
}

type DashProps = {
  active: boolean
  mouseY: MotionValue<number>
  waveY: MotionValue<number>
  onSelect: (id: string) => void
  registerDash: (id: string, node: HTMLButtonElement | null) => void
  section: ProximitySection
  sectionKind: SectionKind
  side: Side
  isSidebarHovered?: boolean
}

export type ProximitySidebarProps = {
  activeOffset?: number
  className?: string
  sections: ProximitySection[]
  side?: Side
}

const RADIUS = 50
const MAX_DASH_WIDTH = 110

const DASH_PRESETS: Record<SectionKind, DashPreset> = {
  title: {
    base: 38,
    bump: 68,
    thickness: 2,
    className: "bg-[#8c9276] dark:bg-[#a3aa8c]",
  },
  subtitle: {
    base: 32,
    bump: 60,
    thickness: 1.5,
    className: "bg-gray-800 dark:bg-gray-200",
  },
  section: {
    base: 26,
    bump: 52,
    thickness: 1.5,
    className: "bg-gray-400 dark:bg-gray-500",
  },
  body: {
    base: 20,
    bump: 44,
    thickness: 1,
    className: "bg-gray-300 dark:bg-gray-600",
  },
}

const getSectionElement = (id: string) =>
  typeof document === "undefined" ? null : document.getElementById(id)

const getSectionKind = (section: ProximitySection): SectionKind => {
  if (section.kind) return section.kind
  if (section.level === 1) return "title"
  if (section.level === 2) return "subtitle"
  if (section.level === 3) return "section"
  return "body"
}

const getElementSectionKind = (id: string): SectionKind | undefined => {
  const heading = getSectionElement(id)?.querySelector("h1, h2, h3, h4, h5, h6")
  const tagName = heading?.tagName.toLowerCase()

  if (tagName === "h1") return "title"
  if (tagName === "h2") return "subtitle"
  if (tagName === "h3") return "section"
  if (tagName) return "body"
}

const getScrollParent = (element: HTMLElement) => {
  let parent = element.parentElement

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent)

    if (/(auto|scroll|overlay)/.test(overflowY)) {
      return parent
    }

    parent = parent.parentElement
  }

  return window
}

const Dash = ({
  active,
  mouseY,
  waveY,
  onSelect,
  registerDash,
  section,
  sectionKind,
  side,
  isSidebarHovered = false,
}: DashProps) => {
  const ref = useRef<HTMLButtonElement>(null)
  const preset = DASH_PRESETS[sectionKind]
  const activeWidth = preset.base + preset.bump

  useEffect(() => {
    registerDash(section.id, ref.current)
    return () => registerDash(section.id, null)
  }, [registerDash, section.id])

  // Distance computation blending mouse proximity and scroll wave
  const distance = useTransform([mouseY, waveY], ([mY, wY]: number[]) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return RADIUS

    const dashCenter = rect.top + rect.height / 2

    // Priority 1: When user hovers sidebar, mouse proximity rules
    if (isSidebarHovered && Number.isFinite(mY)) {
      return mY - dashCenter
    }

    // Priority 2: When scrolling or moving on page, wave ripple rules
    if (Number.isFinite(wY) && wY > 0) {
      return wY - dashCenter
    }

    return RADIUS
  })

  // Cosine bell curve for fluid liquid wave expansion ("efecto Ola")
  const targetScaleX = useTransform(distance, (d) => {
    const absD = Math.abs(d)
    const baseScale = preset.base / MAX_DASH_WIDTH
    const fullActiveScale = activeWidth / MAX_DASH_WIDTH

    if (absD >= RADIUS) {
      // At rest: active dash retains slight prominence
      return active
        ? Math.min(fullActiveScale, (preset.base + preset.bump * 0.35) / MAX_DASH_WIDTH)
        : baseScale
    }

    // Smooth wave crest factor: 1.0 at center, 0.0 at RADIUS
    const waveFactor = Math.cos((absD / RADIUS) * (Math.PI / 2))
    const extraWidth = preset.bump * waveFactor
    const currentBase = active ? preset.base + preset.bump * 0.35 : preset.base

    return Math.min(fullActiveScale, (currentBase + extraWidth) / MAX_DASH_WIDTH)
  })

  const scaleX = useSpring(targetScaleX, {
    stiffness: 280,
    damping: 26,
    mass: 0.6,
  })

  // Subtle lateral crest displacement (wave bulge towards viewer)
  const targetTranslateX = useTransform(distance, (d) => {
    const absD = Math.abs(d)
    if (absD >= RADIUS) return 0
    const waveFactor = Math.cos((absD / RADIUS) * (Math.PI / 2))
    return side === "right" ? -4 * waveFactor : 4 * waveFactor
  })

  const translateX = useSpring(targetTranslateX, {
    stiffness: 280,
    damping: 26,
    mass: 0.6,
  })

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-current={active ? "location" : undefined}
      aria-label={`Ir a ${section.label}`}
      title={section.label}
      style={{ x: translateX }}
      className={cn(
        "group relative flex h-5 w-[110px] items-center border-0 bg-transparent p-0 outline-none cursor-pointer select-none",
        side === "right" ? "justify-end" : "justify-start"
      )}
      onClick={() => onSelect(section.id)}
    >
      {/* Floating tooltip preview: strictly only visible when user hovers or interacts with the sidebar */}
      <span
        className={cn(
          "pointer-events-none absolute text-[11px] font-medium px-2.5 py-1 rounded-full shadow-lg backdrop-blur-xl whitespace-nowrap transition-all duration-200 border select-none z-50",
          side === "right" ? "right-[118px]" : "left-[118px]",
          !isSidebarHovered
            ? "opacity-0 pointer-events-none scale-95 translate-x-2"
            : active
              ? "opacity-100 scale-100 translate-x-0 bg-[#8c9276] text-white border-[#8c9276]/50 font-semibold shadow-[#8c9276]/25"
              : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 bg-white/95 dark:bg-[#1e1e20]/95 text-gray-800 dark:text-gray-200 border-black/10 dark:border-white/10 translate-x-1 group-hover:translate-x-0"
        )}
      >
        {section.label}
      </span>

      <motion.span
        className={cn(
          "block rounded-full transition-colors duration-200 ease-out group-focus-visible:ring-2 group-focus-visible:ring-[#8c9276]",
          active 
            ? "bg-[#8c9276] dark:bg-[#a3aa8c] shadow-sm shadow-[#8c9276]/40" 
            : preset.className
        )}
        style={{
          height: active ? Math.max(preset.thickness, 2.5) : preset.thickness,
          scaleX,
          transformOrigin: side === "left" ? "left center" : "right center",
          width: MAX_DASH_WIDTH,
        }}
      />
    </motion.button>
  )
}

const ProximitySidebar = ({
  activeOffset = 0.4,
  className = "",
  side = "right",
  sections,
}: ProximitySidebarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseY = useMotionValue(Infinity)
  const rawWaveY = useMotionValue(Infinity)

  // Spring-cushioned wave that flows naturally as you scroll up and down ("el sidebar debe seguirme")
  const springWaveY = useSpring(rawWaveY, {
    stiffness: 220,
    damping: 26,
    mass: 0.55,
  })

  const shouldReduceMotion = useReducedMotion()
  const dashRefs = useRef(new Map<string, HTMLButtonElement>())
  const pointerInside = useRef(false)
  const isProgrammaticScroll = useRef(false)
  const scrollLockTimeout = useRef<number | null>(null)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const [detectedKinds, setDetectedKinds] = useState<Record<string, SectionKind>>(
    {}
  )

  const sectionIds = useMemo(
    () => sections.map((section) => section.id).join("|"),
    [sections]
  )

  const registerDash = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        dashRefs.current.set(id, node)
        return
      }

      dashRefs.current.delete(id)
    },
    []
  )

  const selectSection = useCallback(
    (id: string) => {
      // Clear any pending scroll lock
      if (scrollLockTimeout.current) {
        window.clearTimeout(scrollLockTimeout.current)
      }
      isProgrammaticScroll.current = true
      setActiveId(id)

      // 1. "Inicio" -> Scroll cleanly to top of page (equivalent to clicking "Lumina" logo)
      if (id === "hero-section" || id === "inicio" || id === "top" || id === "shop-header") {
        window.scrollTo({
          top: 0,
          behavior: shouldReduceMotion ? "auto" : "smooth",
        })
        scrollLockTimeout.current = window.setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 850)
        return
      }

      // 2. "Envíos & Garantías" -> Scroll cleanly to footer / pie de página
      if (id === "envios-garantias" || id === "trust-badges" || id === "footer") {
        const footerEl = document.getElementById("envios-garantias") || document.querySelector("footer")
        if (footerEl) {
          const top = footerEl.getBoundingClientRect().top + window.pageYOffset - 90
          window.scrollTo({
            top: Math.max(0, top),
            behavior: shouldReduceMotion ? "auto" : "smooth",
          })
        } else {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: shouldReduceMotion ? "auto" : "smooth",
          })
        }
        scrollLockTimeout.current = window.setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 850)
        return
      }

      // 3. "Explora el Catálogo", "Productos Populares" and other sections (with header offset)
      const element = getSectionElement(id)
      if (!element) {
        isProgrammaticScroll.current = false
        return
      }

      const top = element.getBoundingClientRect().top + window.pageYOffset - 90
      window.scrollTo({
        top: Math.max(0, top),
        behavior: shouldReduceMotion ? "auto" : "smooth",
      })

      scrollLockTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 850)
    },
    [shouldReduceMotion]
  )

  useEffect(() => () => {
    if (scrollLockTimeout.current) window.clearTimeout(scrollLockTimeout.current)
  }, [])

  useEffect(() => {
    const kinds = sections.reduce<Record<string, SectionKind>>(
      (nextKinds, section) => {
        nextKinds[section.id] =
          section.kind || section.level
            ? getSectionKind(section)
            : getElementSectionKind(section.id) ?? getSectionKind(section)

        return nextKinds
      },
      {}
    )

    setDetectedKinds(kinds)
  }, [sectionIds, sections])

  useEffect(() => {
    if (!sections.length) return

    let frame = 0

    const updateScrollWave = () => {
      if (typeof window === "undefined") return

      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight

      // 1. Top of page: wave settles on first dash
      if (scrollY < 120 && sections.length > 0) {
        const firstNode = dashRefs.current.get(sections[0].id)
        if (firstNode) {
          const rect = firstNode.getBoundingClientRect()
          rawWaveY.set(rect.top + rect.height / 2)
          return
        }
      }

      // 2. Bottom of page: wave settles on last dash
      if (docHeight > 0 && scrollY >= docHeight - 160 && sections.length > 0) {
        const lastNode = dashRefs.current.get(sections[sections.length - 1].id)
        if (lastNode) {
          const rect = lastNode.getBoundingClientRect()
          rawWaveY.set(rect.top + rect.height / 2)
          return
        }
      }

      // 3. Section-based continuous wave interpolation:
      const points: { docTop: number; dashY: number }[] = []
      for (const s of sections) {
        const el = getSectionElement(s.id)
        const node = dashRefs.current.get(s.id)
        if (el && node) {
          const elRect = el.getBoundingClientRect()
          const nodeRect = node.getBoundingClientRect()
          points.push({
            docTop: elRect.top + scrollY,
            dashY: nodeRect.top + nodeRect.height / 2,
          })
        }
      }

      if (points.length >= 2) {
        const currentFocalScroll = scrollY + window.innerHeight * (activeOffset || 0.4)

        if (currentFocalScroll <= points[0].docTop) {
          rawWaveY.set(points[0].dashY)
          return
        }
        if (currentFocalScroll >= points[points.length - 1].docTop) {
          rawWaveY.set(points[points.length - 1].dashY)
          return
        }

        for (let i = 0; i < points.length - 1; i++) {
          const pA = points[i]
          const pB = points[i + 1]
          if (currentFocalScroll >= pA.docTop && currentFocalScroll <= pB.docTop) {
            const span = pB.docTop - pA.docTop
            const ratio = span > 0 ? (currentFocalScroll - pA.docTop) / span : 0
            rawWaveY.set(pA.dashY + ratio * (pB.dashY - pA.dashY))
            return
          }
        }
      }

      // 4. Fallback based on sidebar container geometry and global progress
      if (containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect()
        const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0
        const startY = cRect.top + 12
        const endY = cRect.bottom - 12
        rawWaveY.set(startY + progress * (endY - startY))
      }
    }

    const updateActiveSection = () => {
      // If smooth programmatic scroll is running from clicking a dash, do not override activeId
      if (isProgrammaticScroll.current) return

      // Special case 1: If scrolled to top, always select the first section (Inicio)
      if (window.scrollY < 180 && sections.length > 0) {
        const topId = sections[0].id
        setActiveId(topId)
        return
      }

      // Special case 2: If scrolled near bottom, select the last section (Envíos & Garantías)
      if (
        typeof document !== "undefined" &&
        window.innerHeight + window.scrollY >= (document.documentElement.scrollHeight - 240) &&
        sections.length > 0
      ) {
        const bottomId = sections[sections.length - 1].id
        setActiveId(bottomId)
        return
      }

      const anchorY = window.innerHeight * activeOffset
      let nextActiveId = sections[0]?.id
      let shortestDistance = Number.POSITIVE_INFINITY

      for (const section of sections) {
        const element = getSectionElement(section.id)
        if (!element) continue

        const rect = element.getBoundingClientRect()
        const containsAnchor = rect.top <= anchorY && rect.bottom >= anchorY
        const distance = containsAnchor
          ? 0
          : Math.min(Math.abs(rect.top - anchorY), Math.abs(rect.bottom - anchorY))

        if (distance < shortestDistance) {
          shortestDistance = distance
          nextActiveId = section.id
        }
      }

      setActiveId(nextActiveId)
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateActiveSection()
        updateScrollWave()
      })
    }

    const scrollParents = new Set<EventTarget>([window])

    for (const section of sections) {
      const element = getSectionElement(section.id)
      if (element) scrollParents.add(getScrollParent(element))
    }

    // Initial positioning
    scheduleUpdate()
    const timer = setTimeout(scheduleUpdate, 100)

    for (const parent of scrollParents) {
      parent.addEventListener("scroll", scheduleUpdate, { passive: true })
    }

    window.addEventListener("resize", scheduleUpdate)

    return () => {
      clearTimeout(timer)
      if (frame) window.cancelAnimationFrame(frame)

      for (const parent of scrollParents) {
        parent.removeEventListener("scroll", scheduleUpdate)
      }

      window.removeEventListener("resize", scheduleUpdate)
    }
  }, [activeOffset, rawWaveY, sectionIds, sections])

  return (
    <nav
      aria-label="Navegación del catálogo"
      className={cn(
        "flex h-full min-h-0 items-center select-none",
        side === "left" ? "justify-start" : "justify-end",
        className
      )}
      onPointerEnter={() => setIsSidebarHovered(true)}
      onPointerLeave={() => setIsSidebarHovered(false)}
      onTouchStart={() => setIsSidebarHovered(true)}
    >
      <div
        ref={containerRef}
        className={cn(
          "mx-4 flex flex-col",
          side === "right" ? "items-end" : "items-start"
        )}
        style={{ gap: 10 }}
        onPointerMove={(event) => {
          pointerInside.current = true
          setIsSidebarHovered(true)
          mouseY.set(event.clientY)
        }}
        onPointerLeave={() => {
          pointerInside.current = false
          setIsSidebarHovered(false)
          mouseY.set(Infinity)
        }}
      >
        {sections.map((section) => (
          <Dash
            key={section.id}
            active={section.id === activeId}
            mouseY={mouseY}
            waveY={springWaveY}
            onSelect={selectSection}
            registerDash={registerDash}
            section={section}
            sectionKind={detectedKinds[section.id] ?? getSectionKind(section)}
            side={side}
            isSidebarHovered={isSidebarHovered}
          />
        ))}
      </div>
    </nav>
  )
}

export { ProximitySidebar }
export default ProximitySidebar
