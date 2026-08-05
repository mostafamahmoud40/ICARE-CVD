"use client"

import * as React from "react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AssistantProfileAvatar } from "@/app/(assistant)/AssistantProfileAvatar"

export type AppointmentPersonPickerItem = {
  id: string
  name: string
  subtitle: string | null
  avatarUrl?: string | null
  /** Extra text used only for search (e.g. phone); never shown in the UI */
  searchMatch?: string | null
}

type AppointmentPersonPickerProps = {
  value: string
  onValueChange: (id: string) => void
  items: AppointmentPersonPickerItem[]
  placeholder: string
  disabled?: boolean
  emptyText?: string
  searchPlaceholder?: string
}

export function AppointmentPersonPicker({
  value,
  onValueChange,
  items,
  placeholder,
  disabled,
  emptyText = "No options available",
  searchPlaceholder = "Search…",
}: AppointmentPersonPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [contentWidth, setContentWidth] = React.useState<number | undefined>(undefined)

  const selected = items.find((i) => i.id === value)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = React.useMemo(() => {
    if (!normalizedQuery) return items
    return items.filter((item) => {
      const name = item.name.toLowerCase()
      const sub = (item.subtitle ?? "").toLowerCase()
      const extra = (item.searchMatch ?? "").toLowerCase()
      return (
        name.includes(normalizedQuery) ||
        sub.includes(normalizedQuery) ||
        extra.includes(normalizedQuery)
      )
    })
  }, [items, normalizedQuery])

  const measureWidth = React.useCallback(() => {
    const el = wrapRef.current
    if (el) setContentWidth(el.offsetWidth)
  }, [])

  React.useLayoutEffect(() => {
    if (open) measureWidth()
  }, [open, measureWidth, items.length])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) requestAnimationFrame(measureWidth)
      }}
    >
      <div ref={wrapRef} className="w-full">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "h-auto min-h-12 w-full justify-between gap-3 rounded-xl border-[#E5EEEA] bg-white px-3 py-2.5 text-left font-normal shadow-sm transition-colors",
              "hover:border-[#1A5345]/25 hover:bg-white",
              "focus-visible:border-[#1A5345]/30 focus-visible:ring-[3px] focus-visible:ring-[#1A5345]/15",
              open && "border-[#1A5345]/30 shadow-[0_0_0_3px_rgba(26,83,69,0.08)]",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {selected ? (
              <span className="flex min-h-12 min-w-0 flex-1 items-center gap-3">
                <AssistantProfileAvatar
                  name={selected.name}
                  avatarUrl={selected.avatarUrl}
                  className="size-10 shrink-0 rounded-full border border-[#E8E6E0]/80"
                  sizes="40px"
                  initialsClassName="text-[12px]"
                />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-serif text-[15px] font-bold leading-tight text-[#1A1F1E]">
                    {selected.name}
                  </span>
                  {selected.subtitle ? (
                    <span className="mt-0.5 block truncate text-[13px] font-medium text-muted-foreground">
                      {selected.subtitle}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : (
              <span className="text-[15px] font-medium text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDownIcon
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={8}
        className="box-border overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white p-0 shadow-xl ring-1 ring-black/[0.03]"
        style={
          contentWidth != null
            ? { width: contentWidth, minWidth: contentWidth, maxWidth: contentWidth }
            : { minWidth: 280 }
        }
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-[#E8E6E0]/80 bg-[#F9F8F5]/70 px-3 py-2">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-10 w-full rounded-xl border-[#E5EEEA] bg-white pl-9 pr-3 text-[14px] font-medium shadow-sm placeholder:text-muted-foreground/75 focus-visible:ring-[#1A5345]/20"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  setOpen(false)
                }
              }}
            />
          </div>
        </div>

        <div className="max-h-[min(320px,48vh)] space-y-0.5 overflow-y-auto overscroll-contain px-3 py-2">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">{emptyText}</p>
          ) : filteredItems.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-muted-foreground">No matches</p>
          ) : (
            filteredItems.map((item) => {
              const isSel = item.id === value
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onValueChange(item.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-0 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1A5345]/25",
                    isSel ? "bg-[#E0E7E1]" : "hover:bg-[#E8F0EE]/70"
                  )}
                >
                  <AssistantProfileAvatar
                    name={item.name}
                    avatarUrl={item.avatarUrl}
                    className="size-10 shrink-0 rounded-full border border-[#E8E6E0]/70"
                    sizes="40px"
                    initialsClassName="text-[12px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[15px] font-bold leading-tight text-[#1A1F1E]">
                      {item.name}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate text-[13px] font-medium text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
