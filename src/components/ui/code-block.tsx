'use client'

import { Copy, Maximize2, Minimize2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Highlight, Prism, type PrismTheme } from 'prism-react-renderer'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// Register dedicated grammars for .env and shell files so Prism properly tokenizes variables, strings, numbers & booleans
if (typeof Prism !== 'undefined' && Prism.languages) {
    const envGrammar = {
        comment: {
            pattern: /(^|[^\\])#.*/,
            lookbehind: true,
            greedy: true,
        },
        string: {
            pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
            greedy: true,
        },
        number: {
            pattern: /(=\s*)\d+\b/,
            lookbehind: true,
        },
        boolean: {
            pattern: /(=\s*)(?:true|false)\b/i,
            lookbehind: true,
        },
        value: {
            pattern: /(=\s*)[^\s#'"]+/,
            lookbehind: true,
        },
        keyword: /\b(?:NEXT_PUBLIC|export|env)\b/,
        variable: {
            pattern: /(^|[\r\n])[A-Za-z0-9_]+(?=\s*=)/,
            lookbehind: true,
        },
        operator: /=/,
        punctuation: /[{}[\]();:,]/,
    }

    Prism.languages.env = envGrammar
    Prism.languages.bash = envGrammar
    Prism.languages.sh = envGrammar
    Prism.languages.shell = envGrammar
}

const TAP_SPRING = { type: 'spring', stiffness: 500, damping: 30 } as const
const SWAP_SPRING = { type: 'spring', duration: 0.3, bounce: 0 } as const
const CHECK_SPRING = { type: 'spring', duration: 0.4, bounce: 0.35 } as const
const COPY_RESET_MS = 1800

export type CodeBlockProps = Omit<React.ComponentProps<'div'>, 'children'> & {
    /** The source code to render. */
    code: string
    /** Prism language id, e.g. "tsx", "css", "json", "bash", "env". */
    language?: string
    /** Any hex color. Defaults to rareUI vibrant orange #F75001. */
    accent?: string
    /** "auto" follows the page theme; pass "dark" or "light" to pin it. Defaults to dark for developer terminal aesthetic. */
    mode?: 'auto' | 'dark' | 'light'
    /** Filename or path shown in the header. Falls back to the language id when omitted. */
    filename?: string
    /** Show the outer frame — background, border, rounded corners, and header. */
    showFrame?: boolean
    /** Show the header bar. */
    showHeader?: boolean
    /** Show the line-number gutter. */
    showLineNumbers?: boolean
    /** Show the copy-to-clipboard button. */
    showCopyButton?: boolean
    /** Optional 1-based line numbers to highlight with an accent wash. */
    highlightLines?: number[]
    /** Controlled expand state to show full code without height limitation */
    isExpanded?: boolean
    /** Initial expand state (defaults to true so all code is visible) */
    defaultExpanded?: boolean
    /** Custom max-height constraint or 'none' / false for unlimited height */
    maxHeight?: string | number | false
    /** Show bottom action/summary bar */
    showFooter?: boolean
}

function buildTheme(accent: string) {
    const accentTone = accent || '#F75001'

    const colors = {
        accent: accentTone,
        bg: '#0d0d11',
        border: 'rgba(255, 255, 255, 0.08)',
        headerBg: 'rgba(255, 255, 255, 0.03)',
        plain: '#ffffff',
        muted: 'rgba(255, 255, 255, 0.6)',
        gutter: '#52525b',
        hoverWash: 'rgba(255, 255, 255, 0.08)',
        floatBg: 'rgba(255, 255, 255, 0.05)',
        selection: 'rgba(247, 80, 1, 0.28)',
        lineWash: 'rgba(247, 80, 1, 0.1)',
    }

    const theme: PrismTheme = {
        plain: { color: colors.plain, backgroundColor: 'transparent' },
        styles: [
            { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#71717a', fontStyle: 'italic' } },
            { types: ['punctuation'], style: { color: colors.plain } },
            { types: ['operator', 'combinator'], style: { color: colors.plain } },
            { types: ['keyword', 'selector', 'atrule', 'important', 'tag'], style: { color: accentTone } },
            { types: ['string', 'char', 'inserted', 'url', 'attr-value', 'value'], style: { color: accentTone } },
            { types: ['function'], style: { color: colors.plain } },
            { types: ['attr-name'], style: { color: accentTone } },
            { types: ['number', 'boolean', 'constant', 'symbol', 'deleted'], style: { color: accentTone } },
            { types: ['class-name', 'maybe-class-name', 'builtin'], style: { color: colors.plain } },
            { types: ['property', 'variable', 'parameter', 'assign-left', 'environment'], style: { color: colors.plain } },
            { types: ['regex'], style: { color: accentTone } },
        ],
    }

    return { colors, theme }
}

/* ------------------------------- copy button ------------------------------- */

function CopyButton({ code, floating }: { code: string; floating?: boolean }) {
    const [copied, setCopied] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current)
    }, [])

    const copy = useCallback(async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(code)
            } else {
                const area = document.createElement('textarea')
                area.value = code
                area.style.position = 'fixed'
                area.style.opacity = '0'
                document.body.appendChild(area)
                area.select()
                document.execCommand('copy')
                area.remove()
            }
        } catch {
            return
        }
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), COPY_RESET_MS)
    }, [code])

    const reduceMotion = useReducedMotion()
    const swap = reduceMotion
        ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
          }
        : {
              initial: { opacity: 0, scale: 0.5, filter: 'blur(4px)' },
              animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
              exit: { opacity: 0, scale: 0.5, filter: 'blur(4px)' },
          }

    return (
        <motion.button
            type='button'
            data-slot='code-block-copy'
            aria-label={copied ? 'Copiado' : 'Copiar código'}
            onClick={copy}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            transition={TAP_SPRING}
            className={cn(
                'relative grid size-8 place-items-center rounded-xl text-zinc-400 outline-none transition-all duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-500/60 cursor-pointer',
                copied && 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/25 hover:text-amber-300',
                floating && 'border border-white/10 bg-[#16161a]/85 backdrop-blur-md shadow-md hover:border-white/20',
            )}
        >
            <AnimatePresence initial={false}>
                {copied ? (
                    <motion.span
                        key='check'
                        className='col-start-1 row-start-1'
                        {...swap}
                        transition={reduceMotion ? { duration: 0.15 } : CHECK_SPRING}
                    >
                        <svg
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth={2.5}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            className='size-3.5 text-amber-400'
                            aria-hidden
                        >
                            <motion.path
                                d='M4 12.5l5 5L20 6.5'
                                initial={reduceMotion ? false : { pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
                            />
                        </svg>
                    </motion.span>
                ) : (
                    <motion.span
                        key='copy'
                        className='col-start-1 row-start-1'
                        {...swap}
                        transition={reduceMotion ? { duration: 0.15 } : SWAP_SPRING}
                    >
                        <Copy className='size-3.5' />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}

export function CodeBlock({
    code,
    language = 'env',
    accent = '#F75001',
    filename,
    showFrame = true,
    showHeader = false,
    showLineNumbers = true,
    showCopyButton = true,
    highlightLines,
    isExpanded: controlledExpanded,
    defaultExpanded = true,
    maxHeight,
    showFooter = true,
    className,
    style,
    ...props
}: CodeBlockProps) {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

    const safeLanguage = typeof language === 'string' ? language : 'env'
    const { colors, theme } = useMemo(() => buildTheme(accent), [accent])
    const trimmed = useMemo(() => {
        const source = typeof code === 'string' ? code : String(code ?? '')
        return source.replace(/^\n+/, '').trimEnd()
    }, [code])
    const highlighted = useMemo(
        () => new Set(Array.isArray(highlightLines) ? highlightLines : []),
        [highlightLines],
    )

    // Calculate viewport max-height based on expanded state
    const resolvedMaxHeight = useMemo(() => {
        if (isExpanded || maxHeight === false || maxHeight === 'none') {
            return undefined
        }
        if (maxHeight) {
            return typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
        }
        return '520px'
    }, [isExpanded, maxHeight])

    return (
        <div
            data-slot='code-block'
            className={cn(
                'group relative flex flex-col overflow-hidden text-left rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0d0d11] text-white shadow-2xl transition-all duration-300',
                className,
            )}
            style={{ backgroundColor: colors.bg, ...style }}
            {...props}
        >
            {/* Header if showHeader is active */}
            {showFrame && showHeader && (
                <div
                    data-slot='code-block-header'
                    className='flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 backdrop-blur-md'
                >
                    <div className='flex items-center gap-2 min-w-0'>
                        <span className='w-2.5 h-2.5 rounded-full bg-amber-500/80 ring-2 ring-amber-500/20' />
                        <span className='min-w-0 truncate font-mono text-xs font-semibold text-zinc-300'>
                            {filename ?? `${safeLanguage}.env`}
                        </span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            onClick={() => setInternalExpanded((prev) => !prev)}
                            className='flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/5'
                            title={isExpanded ? 'Ver en modo ventana' : 'Ver todo el código'}
                        >
                            {isExpanded ? <Minimize2 className='w-3 h-3' /> : <Maximize2 className='w-3 h-3' />}
                            <span className='hidden sm:inline'>{isExpanded ? 'Compactar' : 'Ver Todo'}</span>
                        </button>
                        {showCopyButton && <CopyButton code={trimmed} />}
                    </div>
                </div>
            )}

            {/* Floating actions when showHeader is off */}
            {!(showFrame && showHeader) && (
                <div className='absolute top-3 right-3 z-20 flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setInternalExpanded((prev) => !prev)}
                        className='grid size-8 place-items-center rounded-xl text-zinc-400 border border-white/10 bg-[#16161a]/85 backdrop-blur-md shadow-md hover:border-white/20 hover:text-white hover:bg-white/10 transition-all cursor-pointer'
                        title={isExpanded ? 'Reducir altura' : 'Ver todas las líneas'}
                        aria-label={isExpanded ? 'Reducir altura' : 'Ver todas las líneas'}
                    >
                        {isExpanded ? <Minimize2 className='size-3.5' /> : <Maximize2 className='size-3.5' />}
                    </button>
                    {showCopyButton && <CopyButton code={trimmed} floating />}
                </div>
            )}

            {/* Viewport with code tokens */}
            <div
                data-slot='code-block-viewport'
                role='region'
                aria-label={filename ?? `${safeLanguage} code`}
                tabIndex={0}
                style={{
                    maxHeight: resolvedMaxHeight,
                }}
                className={cn(
                    'min-h-0 flex-1 overflow-auto outline-none py-5 px-4 sm:px-6 transition-[max-height] duration-300',
                    'scrollbar-thin [scrollbar-width:thin] [scrollbar-color:rgba(113,113,122,0.4)_transparent]',
                    '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-black/10',
                    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500',
                )}
            >
                <Highlight code={trimmed} language={safeLanguage} theme={theme}>
                    {({ tokens, getLineProps, getTokenProps }) => {
                        const gutterWidth = `${String(tokens.length).length}ch`
                        return (
                            <pre
                                data-slot='code-block-pre'
                                className='w-max min-w-full font-mono text-[13px] sm:text-[13.5px] leading-relaxed [letter-spacing:-0.01em]'
                                style={{
                                    fontFamily: 'ui-monospace, "Geist Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
                                    lineHeight: '1.75',
                                    tabSize: 4,
                                }}
                            >
                                {tokens.map((line, i) => {
                                    const lineProps = getLineProps({ line })
                                    return (
                                        <div
                                            key={i}
                                            {...lineProps}
                                            className={cn(
                                                'relative flex min-w-full',
                                                highlighted.has(i + 1) && 'bg-amber-500/10',
                                                lineProps.className,
                                            )}
                                        >
                                            {showLineNumbers && (
                                                <span
                                                    aria-hidden
                                                    className='mr-5 sm:mr-6 shrink-0 text-right text-zinc-500 select-none font-mono text-[12.5px] sm:text-[13px]'
                                                    style={{ width: gutterWidth }}
                                                >
                                                    {i + 1}
                                                </span>
                                            )}
                                            <span className='pr-4'>
                                                {line.map((token, key) => (
                                                    <span key={key} {...getTokenProps({ token })} />
                                                ))}
                                            </span>
                                        </div>
                                    )
                                })}
                            </pre>
                        )
                    }}
                </Highlight>
            </div>

            {/* Bottom Footer Action Bar */}
            {showFooter && (
                <div className='flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-t border-white/10 bg-white/[0.02] text-xs font-mono text-zinc-400 select-none'>
                    <div className='flex items-center gap-2.5'>
                        <span className='inline-flex items-center gap-1.5'>
                            <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                            <span className='text-[11px] text-zinc-400'>Rare UI CodeEngine • {safeLanguage.toUpperCase()}</span>
                        </span>
                        <span className='text-zinc-600 hidden sm:inline'>•</span>
                        <span className='text-[11px] text-zinc-500 hidden sm:inline'>
                            {trimmed.split('\n').length} líneas generadas
                        </span>
                    </div>

                    <button
                        type='button'
                        onClick={() => setInternalExpanded((prev) => !prev)}
                        className='inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer font-sans font-medium'
                    >
                        {isExpanded ? (
                            <>
                                <Minimize2 className='size-3' />
                                <span>Contraer vista</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className='size-3' />
                                <span>Ver todas las líneas en pantalla</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

export default CodeBlock
