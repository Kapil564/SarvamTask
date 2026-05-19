import React, { createContext, useContext, useEffect, useState } from 'react'

type SelectContextType = {
  id: string
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = createContext<SelectContextType | null>(null)

export function Select({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [id] = useState(
    () => `select-${Math.random().toString(36).slice(2)}`
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-select-root]')) {
        setOpen(false)
      }
    }

    const handleSelectOpened = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string }>
      if (customEvent.detail?.source !== id) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('click', handleClickOutside)
    }

    window.addEventListener('react-select-open', handleSelectOpened)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('react-select-open', handleSelectOpened)
    }
  }, [open, id])

  return (
    <SelectContext.Provider
      value={{
        id,
        value,
        onValueChange,
        open,
        setOpen,
      }}
    >
      <div data-select-root className="select-root">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(SelectContext)
  if (!context) return null

  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        if (!context.open) {
          window.dispatchEvent(
            new CustomEvent('react-select-open', {
              detail: { source: context.id },
            })
          )
        }
        context.setOpen(!context.open)
      }}
      aria-haspopup="listbox"
      aria-expanded={context.open}
    >
      {children}
    </button>
  )
}

export function SelectValue({
  placeholder,
}: {
  placeholder?: string
}) {
  const context = useContext(SelectContext)
  if (!context) return null

  return <span className="select-value">{context.value ?? placeholder}</span>
}

export function SelectContent({
  children,
}: {
  children: React.ReactNode
}) {
  const context = useContext(SelectContext)
  if (!context || !context.open) return null

  return <div className="select-content">{children}</div>
}

export function SelectGroup({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="select-group">{children}</div>
}

export function SelectLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="select-label">{children}</div>
}

export function SelectItem({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const context = useContext(SelectContext)
  if (!context) return null

  return (
    <button
      type="button"
      className="select-item"
      onClick={() => {
        context.onValueChange?.(value)
        window.dispatchEvent(
          new CustomEvent('react-select-open', {
            detail: { source: context.id },
          })
        )
        context.setOpen(false)
      }}
    >
      {children}
    </button>
  )
}
