"use client";
// beui.dev/components/blocks/morphing-search

import { Clock, LoaderCircle, Search, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from "@/lib/ease";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { useOnOpen } from "@/lib/hooks/use-on-open";
import { useRowCursor } from "@/lib/hooks/use-row-cursor";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";

// The panel's glass grows out of the bar on a spring with a little give
const SPRING_MORPH = { type: "spring", stiffness: 380, damping: 28, mass: 0.8 } as const;
const MORPH_ENTER: Transition = { ...SPRING_MORPH, opacity: { duration: 0.1 } };
const MORPH_EXIT: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 40,
  mass: 0.6,
  opacity: { duration: 0.12, delay: 0.1 },
};
// The pill the panel starts from and returns to
const SEED = { width: 112, height: 40 };
const SEED_TUCK = 28;
// Content fades in once the shape has mostly arrived
const CONTENT_IN: Transition = { duration: 0.18, ease: EASE_OUT, delay: 0.12 };
const CONTENT_OUT: Transition = { duration: 0.08, ease: EASE_OUT };

const GLASS =
  "border border-foreground/[0.08] bg-white/80 dark:bg-[#1c1c22]/85 backdrop-blur-[20px] backdrop-saturate-[1.6] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1),0_24px_60px_-24px_rgb(0_0_0/0.45)]";

const CHIP_HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const CHIP_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const CHIP_ENTER: Transition = {
  ...SPRING_SWAP,
  opacity: { duration: 0.16 },
  filter: { duration: 0.2 },
};
const CHIP_EXIT: Transition = { duration: 0.16, ease: EASE_OUT };

const PANEL_ROOM = 320;

export type MorphingSearchChipRow = { id: string; label: string; kind: "query" | "recent" | "suggestion" };
type Side = "top" | "bottom";

export interface MorphingSearchChipsProps {
  /** Active filters shown as chips inside the bar. */
  chips?: string[];
  defaultChips?: string[];
  onChipsChange?: (chips: string[]) => void;
  /** Text in the field. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Recent searches, newest first. */
  recents?: string[];
  defaultRecents?: string[];
  onRecentsChange?: (recents: string[]) => void;
  /** Persist uncontrolled recents in localStorage under this key. */
  storageKey?: string;
  /** How many recent searches to keep. Default 5. */
  maxRecents?: number;
  /** Terms offered while typing. */
  suggestions?: string[];
  /**
   * How suggestions match the query. Default: case-insensitive substring.
   * Pass `false` when `suggestions` already arrive filtered, e.g. from a server.
   */
  filter?: ((term: string, query: string) => boolean) | false;
  /** How many matches to list under the typed query. Default 6. */
  maxSuggestions?: number;
  /** Suggestions are being fetched. */
  loading?: boolean;
  /** Most chips allowed at once. */
  maxChips?: number;
  /** Clean a term before it becomes a chip; return null to reject it. */
  normalize?: (term: string) => string | null;
  /** Shown when the field is empty and there are no recent searches. */
  emptyState?: ReactNode;
  /** Which way the surface grows. "auto" grows up unless there is no room. Default "top". */
  side?: "top" | "bottom" | "auto";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Compact sizing (e.g. h-10 for header search bars) */
  compact?: boolean;
  /** Callback triggered when a row is selected */
  onSelectRow?: (row: MorphingSearchChipRow) => void;
  /** Submit each chip with a form under this name. */
  name?: string;
  placeholder?: string;
  /** Accessible name for the search field. */
  label?: string;
  /** Trailing controls inside the bar, such as filter buttons. */
  actions?: ReactNode;
  className?: string;
}

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [internal, setInternal] = useState(initial);
  const current = value ?? internal;
  const set = useCallback(
    (next: T) => {
      if (value === undefined) setInternal(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, set, setInternal] as const;
}

const sameTerm = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const contains = (term: string, query: string) => term.toLowerCase().includes(query.toLowerCase());

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold text-amber-500">{text.slice(at, at + query.length)}</span>
      {text.slice(at + query.length)}
    </>
  );
}

export function MorphingSearchChips({
  chips: chipsProp,
  defaultChips = [],
  onChipsChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  recents: recentsProp,
  defaultRecents = [],
  onRecentsChange,
  storageKey,
  maxRecents = 5,
  suggestions = [],
  filter,
  maxSuggestions = 6,
  loading = false,
  maxChips,
  normalize,
  emptyState,
  side = "top",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  compact = false,
  onSelectRow,
  name,
  placeholder = "Buscar...",
  label = "Buscar",
  actions,
  className,
}: MorphingSearchChipsProps) {
  const reduce = useReducedMotion();
  const [chips, setChips] = useControllable(chipsProp, defaultChips, onChipsChange);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
  const [recents, setRecentsState, setStoredRecents] = useControllable(
    recentsProp,
    defaultRecents,
    onRecentsChange,
  );
  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const open = openState && !disabled;
  const [announcement, setAnnouncement] = useState({ text: "", count: 0 });
  const [markedChip, setMarkedChip] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Side>(side === "bottom" ? "bottom" : "top");
  const [rtl, setRtl] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const surfaceRadius = compact ? 20 : 28;

  const announce = useCallback(
    (text: string) => setAnnouncement((current) => ({ text, count: current.count + 1 })),
    [],
  );

  const marked = markedChip !== null && chips.includes(markedChip) ? markedChip : null;
  if (markedChip !== null && marked === null) setMarkedChip(null);

  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelObserver = useRef<ResizeObserver | null>(null);
  const measurePanel = useCallback((node: HTMLDivElement | null) => {
    panelObserver.current?.disconnect();
    panelObserver.current = null;
    if (!node) return;
    const read = () => setPanelSize({ width: node.offsetWidth, height: node.offsetHeight });
    read();
    panelObserver.current = new ResizeObserver(read);
    panelObserver.current.observe(node);
  }, []);

  const chipsLatest = useRef(chips);
  useLayoutEffect(() => {
    chipsLatest.current = chips;
  });

  useLayoutEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === "rtl");
  }, []);

  const persist = storageKey && recentsProp === undefined ? storageKey : null;
  useEffect(() => {
    if (!persist) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(persist) ?? "null");
      if (Array.isArray(stored)) {
        setStoredRecents(
          stored.filter((term): term is string => typeof term === "string").slice(0, maxRecents),
        );
      }
    } catch {
      // Storage can be blocked; recents simply start empty.
    }
  }, [persist, maxRecents, setStoredRecents]);

  const setRecents = (next: string[]) => {
    setRecentsState(next);
    if (!persist) return;
    try {
      window.localStorage.setItem(persist, JSON.stringify(next));
    } catch {}
  };

  const trimmed = query.trim();
  const rows = useMemo<MorphingSearchChipRow[]>(() => {
    if (!trimmed) {
      return recents.map((term) => ({ id: `recent:${term}`, label: term, kind: "recent" }));
    }
    const seen = new Set([trimmed.toLowerCase(), ...chips.map((chip) => chip.toLowerCase())]);
    const matches: MorphingSearchChipRow[] = [];
    const pools = [
      ["recent", recents, contains],
      ["suggestion", suggestions, filter === false ? () => true : (filter ?? contains)],
    ] as const;
    for (const [kind, pool, matchFn] of pools) {
      for (const term of pool) {
        const key = term.toLowerCase();
        if (seen.has(key) || !matchFn(term, trimmed)) continue;
        seen.add(key);
        matches.push({ id: `${kind}:${term}`, label: term, kind: kind as "recent" | "suggestion" });
      }
    }
    return [
      { id: `query:${trimmed}`, label: trimmed, kind: "query" },
      ...matches.slice(0, maxSuggestions),
    ];
  }, [trimmed, recents, suggestions, chips, filter, maxSuggestions]);

  const { activeIndex, moveTo, moveActive } = useRowCursor(rows, trimmed);
  const active = rows[activeIndex];
  const showList = rows.length > 0;
  const hasPanel = showList || loading || (!trimmed && emptyState != null);
  const panelOpen = open && hasPanel;

  useOnOpen(open, () => moveTo(null));

  const [panelFloor, setPanelFloor] = useState(0);
  useOnOpen(panelOpen, () => setPanelFloor(0));
  const rowsObserver = useRef<ResizeObserver | null>(null);
  const measureRows = useCallback((node: HTMLDivElement | null) => {
    rowsObserver.current?.disconnect();
    rowsObserver.current = null;
    if (!node) return;
    const read = () => setPanelFloor((floor) => Math.max(floor, node.offsetHeight + 16));
    read();
    rowsObserver.current = new ResizeObserver(read);
    rowsObserver.current.observe(node);
  }, []);

  useLayoutEffect(() => {
    if (!panelOpen) return;
    if (side !== "auto") {
      setPlaced(side);
      return;
    }
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const above = rect.top;
    const below = window.innerHeight - rect.bottom;
    setPlaced(above < PANEL_ROOM && below > above ? "bottom" : "top");
  }, [panelOpen, side]);

  const activeOptionId = panelOpen && showList ? optionId(activeIndex) : undefined;
  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" });
  }, [activeOptionId]);

  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(open, close, rootRef);

  const chipCount = useRef(chips.length);
  useEffect(() => {
    const row = chipsRef.current;
    const added = chips.length > chipCount.current;
    chipCount.current = chips.length;
    if (!row || !added || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: rtl ? -row.scrollWidth : row.scrollWidth, behavior: reduce ? "auto" : "smooth" });
  }, [chips.length, reduce, rtl]);

  const full = maxChips !== undefined && chips.length >= maxChips;

  const addChip = (term: string) => {
    const value = normalize ? normalize(term) : term.trim();
    if (!value) return;
    const exists = chips.some((chip) => sameTerm(chip, value));
    if (!exists && full) {
      announce(`Máximo ${maxChips} filtros`);
      return;
    }
    if (!exists) {
      setChips([...chips, value]);
      announce(`Filtro añadido: ${value}`);
    }
    setRecents([value, ...recents.filter((recent) => !sameTerm(recent, value))].slice(0, maxRecents));
    setQuery("");
  };

  const removeChip = (term: string) => {
    setChips(chips.filter((chip) => chip !== term));
    announce(`Filtro eliminado: ${term}`);
    inputRef.current?.focus();
  };

  const removeRecent = (term: string) => {
    setRecents(recents.filter((recent) => recent !== term));
    announce(`Eliminado ${term} de búsquedas recientes`);
  };

  const stepMark = (direction: 1 | -1) =>
    setMarkedChip((current) => {
      const list = chipsLatest.current;
      if (list.length === 0) return null;
      const at = current === null ? list.length : list.indexOf(current);
      const next = at + direction;
      if (next >= list.length) return null;
      return list[Math.max(next, 0)];
    });

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const field = event.currentTarget;
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";

    if (marked !== null) {
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setMarkedChip(null);
        removeChip(marked);
        return;
      }
      if (event.key === back || event.key === forward) {
        event.preventDefault();
        stepMark(event.key === back ? -1 : 1);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMarkedChip(null);
        return;
      }
      setMarkedChip(null);
    }

    if (event.key === "Escape" && query !== "") {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else moveActive(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter") {
      if (!panelOpen || !active) return;
      event.preventDefault();
      onSelectRow?.(active);
      addChip(active.label);
      return;
    }
    if (event.key === "Delete" && panelOpen && active?.kind === "recent") {
      event.preventDefault();
      removeRecent(active.label);
      return;
    }
    if (event.key === "Backspace" && atStart && chips.length > 0) {
      event.preventDefault();
      const last = chips[chips.length - 1];
      setMarkedChip(last);
      announce(`${last} seleccionado. Presiona Backspace para eliminar.`);
      return;
    }
    if (event.key === back && atStart && chips.length > 0) {
      event.preventDefault();
      stepMark(-1);
    }
  };

  const focusField = (event: ReactPointerEvent) => {
    if (disabled || (event.target as Element).closest("button, input, a")) return;
    event.preventDefault();
    inputRef.current?.focus();
    setOpen(true);
  };

  const layout = reduce ? { duration: 0 } : SPRING_LAYOUT;
  const below = placed === "bottom";
  const seed = { ...SEED, y: below ? -SEED_TUCK : SEED_TUCK };

  const panel = (
    <>
      <div className="flex h-8 items-center justify-between px-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {trimmed ? "Coincidencias" : "Búsquedas Recientes"}
        </span>
        {!trimmed && recents.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setRecents([]);
              announce("Historial borrado");
              inputRef.current?.focus();
            }}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label={trimmed ? "Sugerencias" : "Búsquedas recientes"}
          aria-busy={loading || undefined}
          className="max-h-[min(20rem,45vh)] overflow-y-auto overscroll-contain [scrollbar-width:thin] space-y-0.5 py-1"
        >
          {rows.map((row, index) => {
            const selected = index === activeIndex;
            return (
              <motion.div
                key={row.id}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => moveTo(row.id)}
                onClick={() => {
                  onSelectRow?.(row);
                  addChip(row.label);
                }}
                className="relative flex h-10 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-xs text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {selected ? (
                  <motion.span
                    layoutId={`${id}-active`}
                    transition={layout}
                    className="absolute inset-0 rounded-xl bg-[#e07a3f]/10 dark:bg-white/10"
                  />
                ) : null}
                {row.kind === "recent" ? (
                  <Clock aria-hidden="true" className="relative size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Search aria-hidden="true" className="relative size-3.5 shrink-0 text-[#e07a3f]" />
                )}
                <span className="relative min-w-0 flex-1 truncate font-medium">
                  {row.kind === "query" ? row.label : <Highlight text={row.label} query={trimmed} />}
                </span>
                {row.kind === "recent" ? (
                  <span
                    aria-hidden="true"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeRecent(row.label);
                    }}
                    className="relative grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </span>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      ) : !trimmed && emptyState != null ? (
        <div className="px-3 pb-2 pt-1 text-xs text-muted-foreground">{emptyState}</div>
      ) : null}
      {loading ? (
        <div className="flex h-10 items-center gap-2.5 px-3 text-xs text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
          Buscando…
        </div>
      ) : null}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex w-full max-w-xl justify-center",
        compact ? "h-9 sm:h-10" : "h-14",
        disabled && "opacity-60",
        className,
      )}
      onBlur={(event) => {
        if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
        setMarkedChip(null);
        close();
      }}
    >
      <AnimatePresence>
        {panelOpen ? (
          <PresenceGate key="panel">
            {({ gate }) => (
              <div
                {...gate}
                className={cn(
                  "absolute inset-x-0 z-50",
                  below ? "top-full mt-2" : "bottom-full mb-2",
                )}
              >
                <motion.div
                  aria-hidden="true"
                  initial={reduce ? { opacity: 0 } : { ...seed, opacity: 0 }}
                  animate={{
                    width: panelSize.width || SEED.width,
                    height: panelSize.height || SEED.height,
                    y: 0,
                    opacity: 1,
                  }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.12 } }
                      : { ...seed, opacity: 0, transition: MORPH_EXIT }
                  }
                  transition={reduce ? { duration: 0 } : MORPH_ENTER}
                  style={{ borderRadius: surfaceRadius, x: "-50%" }}
                  className={cn("absolute left-1/2", below ? "top-0" : "bottom-0", GLASS)}
                />
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : below ? -6 : 6 }}
                  animate={{ opacity: 1, y: 0, transition: reduce ? { duration: 0.15 } : CONTENT_IN }}
                  exit={{ opacity: 0, transition: CONTENT_OUT }}
                  ref={measurePanel}
                  style={{ minHeight: panelFloor || undefined }}
                  className="relative p-2"
                >
                  <div ref={measureRows}>{panel}</div>
                </motion.div>
              </div>
            )}
          </PresenceGate>
        ) : null}
      </AnimatePresence>

      <motion.div
        layout
        transition={layout}
        onPointerDown={focusField}
        style={{ borderRadius: surfaceRadius }}
        className={cn(
          "relative z-20 flex min-w-0 items-center gap-2",
          compact ? "h-9 sm:h-10 ps-3 pe-2 text-xs" : "h-14 ps-4 pe-4 text-sm",
          GLASS,
          disabled ? "cursor-not-allowed" : "cursor-text",
          actions ? "pe-2" : compact ? "pe-2.5" : "pe-4",
          open ? "w-full ring-2 ring-[#e07a3f]/40 border-[#e07a3f]" : "w-fit max-w-full hover:border-[#e07a3f]/50",
        )}
      >
        <Search aria-hidden="true" className={cn("shrink-0 text-[#e07a3f]", compact ? "size-3.5" : "size-5")} />
        <div
          ref={chipsRef}
          className={cn(
            "relative flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]",
            chips.length > 0 &&
              "-mx-1 px-2 [mask-image:linear-gradient(to_right,transparent,#000_8px,#000_calc(100%-8px),transparent)]",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {chips.map((chip) => (
              <motion.span
                key={chip}
                layout={reduce ? false : "position"}
                initial={reduce ? { opacity: 0 } : CHIP_HIDDEN}
                animate={reduce ? { opacity: 1 } : CHIP_SHOWN}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.1 } }
                    : { ...CHIP_HIDDEN, transition: CHIP_EXIT }
                }
                transition={reduce ? { duration: 0.12 } : CHIP_ENTER}
                style={{ transformOrigin: rtl ? "right center" : "left center" }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full font-medium text-foreground transition-[background-color,box-shadow] duration-150",
                  compact ? "h-6.5 text-[11px] ps-2 pe-0.5" : "h-9 text-sm ps-3 pe-1",
                  marked === chip
                    ? "bg-[#e07a3f]/20 ring-2 ring-inset ring-[#e07a3f]"
                    : "bg-black/5 dark:bg-white/10",
                )}
              >
                <span className="max-w-32 truncate" title={chip}>
                  {chip}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Quitar filtro ${chip}`}
                  onClick={() => removeChip(chip)}
                  className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none cursor-pointer"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <motion.input
          ref={inputRef}
          layout={reduce ? false : "position"}
          transition={layout}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={panelOpen}
          aria-controls={panelOpen && showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-describedby={hintId}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={open ? undefined : { width: `${Math.max(placeholder.length, 6) + 1}ch` }}
          className={cn(
            "min-w-20 text-ellipsis bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
            compact ? "h-7 text-xs" : "h-9 text-base",
            open && "flex-1",
          )}
        />
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </motion.div>

      {name
        ? chips.map((chip) => <input key={chip} type="hidden" name={name} value={chip} />)
        : null}
      <span id={hintId} className="sr-only">
        Enter añade un filtro. Backspace elimina el último filtro.
      </span>
      <span aria-live="polite" className="sr-only">
        {announcement.text}
        {announcement.count % 2 ? " " : ""}
      </span>
    </div>
  );
}
