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

const RADIUS = 40
const MAX_DASH_WIDTH = 110
const SCROLL_IDLE_RESET_DELAY = 80

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

  const distance = useTransform(mouseY, (y) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return RADIUS
    return y - (rect.top + rect.height / 2)
  })

  const targetScaleX = useTransform(
    distance,
    [-RADIUS, 0, RADIUS],
    [
      preset.base / MAX_DASH_WIDTH,
      activeWidth / MAX_DASH_WIDTH,
      preset.base / MAX_DASH_WIDTH,
    ],
    { clamp: true }
  )

  const scaleX = useSpring(targetScaleX, {
    stiffness: 320,
    damping: 34,
    mass: 0.7,
  })

  return (
    <button
      ref={ref}
      type="button"
      aria-current={active ? "location" : undefined}
      aria-label={`Ir a ${section.label}`}
      title={section.label}
      className={cn(
        "group relative flex h-5 w-[110px] items-center border-0 bg-transparent p-0 outline-none cursor-pointer",
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
          active ? "bg-[#8c9276] shadow-sm shadow-[#8c9276]/30" : preset.className
        )}
        style={{
          height: active ? Math.max(preset.thickness, 2.5) : preset.thickness,
          scaleX,
          transformOrigin: side === "left" ? "left center" : "right center",
          width: MAX_DASH_WIDTH,
        }}
      />
    </button>
  )
}

const ProximitySidebar = ({
  activeOffset = 0.4,
  className = "",
  side = "right",
  sections,
}: ProximitySidebarProps) => {
  const mouseY = useMotionValue(Infinity)
  const shouldReduceMotion = useReducedMotion()
  const dashRefs = useRef(new Map<string, HTMLButtonElement>())
  const pointerInside = useRef(false)
  const resetTimer = useRef<number | null>(null)
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

  const clearPendingReset = useCallback(() => {
    if (!resetTimer.current) return

    window.clearTimeout(resetTimer.current)
    resetTimer.current = null
  }, [])

  const setMouseToDash = useCallback(
    (id?: string) => {
      if (!id) {
        mouseY.set(Infinity)
        return
      }

      const node = dashRefs.current.get(id)
      if (!node) return

      const rect = node.getBoundingClientRect()
      mouseY.set(rect.top + rect.height / 2)
    },
    [mouseY]
  )

  const pulseDash = useCallback(
    (id?: string) => {
      setMouseToDash(id)
      clearPendingReset()

      if (!id || pointerInside.current) return

      resetTimer.current = window.setTimeout(() => {
        mouseY.set(Infinity)
        resetTimer.current = null
      }, SCROLL_IDLE_RESET_DELAY)
    },
    [clearPendingReset, mouseY, setMouseToDash]
  )

  const selectSection = useCallback(
    (id: string) => {
      // 1. "Inicio" -> Scroll cleanly to top of page
      if (id === "hero-section" || id === "inicio" || id === "top" || id === "shop-header") {
        window.scrollTo({
          top: 0,
          behavior: shouldReduceMotion ? "auto" : "smooth",
        })
        window.history.replaceState(null, "", `#${id}`)
        setActiveId(id)
        return
      }

      // 2. "Envíos & Garantías" -> Scroll cleanly to footer / pie de página
      if (id === "envios-garantias" || id === "trust-badges" || id === "footer") {
        const footerEl = document.getElementById("envios-garantias") || document.querySelector("footer")
        if (footerEl) {
          footerEl.scrollIntoView({
            behavior: shouldReduceMotion ? "auto" : "smooth",
            block: "start",
          })
        } else {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: shouldReduceMotion ? "auto" : "smooth",
          })
        }
        window.history.replaceState(null, "", `#${id}`)
        setActiveId(id)
        return
      }

      const element = getSectionElement(id)
      if (!element) return

      element.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      })

      window.history.replaceState(null, "", `#${id}`)
      setActiveId(id)
    },
    [shouldReduceMotion]
  )

  useEffect(() => () => clearPendingReset(), [clearPendingReset])

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

    const updateActiveSection = () => {
      frame = 0

      // Special case 1: If scrolled to top, always select the first section (Inicio)
      if (window.scrollY < 180 && sections.length > 0) {
        const topId = sections[0].id
        setActiveId(topId)
        return
      }

      // Special case 2: If scrolled near bottom, select the last section (Envíos & Garantías)
      if (typeof document !== "undefined" && window.innerHeight + window.scrollY >= (document.documentElement.scrollHeight - 240) && sections.length > 0) {
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
      frame = window.requestAnimationFrame(updateActiveSection)
    }

    const scrollParents = new Set<EventTarget>([window])

    for (const section of sections) {
      const element = getSectionElement(section.id)
      if (element) scrollParents.add(getScrollParent(element))
    }

    updateActiveSection()

    for (const parent of scrollParents) {
      parent.addEventListener("scroll", scheduleUpdate, { passive: true })
    }

    window.addEventListener("resize", scheduleUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)

      for (const parent of scrollParents) {
        parent.removeEventListener("scroll", scheduleUpdate)
      }

      window.removeEventListener("resize", scheduleUpdate)
    }
  }, [activeOffset, pulseDash, sectionIds, sections])

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
        className={cn(
          "mx-4 flex flex-col",
          side === "right" ? "items-end" : "items-start"
        )}
        style={{ gap: 10 }}
        onPointerMove={(event) => {
          clearPendingReset()
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
