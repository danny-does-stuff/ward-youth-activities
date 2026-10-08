import { useEffect, useId, useMemo, useRef, useState } from 'react'

const inputClassName =
  'w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'

export function YouthNameInput({
  id,
  value,
  knownNames,
  placeholder = 'First and last name',
  required = false,
  onChange,
}: {
  id: string
  value: string
  knownNames: Array<string>
  placeholder?: string
  required?: boolean
  onChange: (value: string) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase()
    return knownNames.filter((name) => {
      if (name.toLowerCase() === query) return false
      return query.length === 0 || name.toLowerCase().includes(query)
    })
  }, [knownNames, value])

  const showList = open && suggestions.length > 0

  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    function handleBlur() {
      setOpen(false)
    }

    input.addEventListener('blur', handleBlur)
    return () => input.removeEventListener('blur', handleBlur)
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }
      setOpen(false)
      inputRef.current?.blur()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [open])

  function selectName(name: string) {
    onChange(name)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true)
        setHighlight(0)
        e.preventDefault()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((index) => (index + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      )
    } else if (e.key === 'Enter') {
      const name = suggestions[highlight]
      if (name) {
        e.preventDefault()
        selectName(name)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={id}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList ? `${listId}-option-${highlight}` : undefined
        }
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => {
          setOpen(true)
          setHighlight(0)
        }}
        onClick={() => {
          setOpen(true)
          setHighlight(0)
        }}
        onKeyDown={handleKeyDown}
        required={required}
        autoComplete="off"
        className={inputClassName}
        placeholder={placeholder}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="mt-1 max-h-48 overflow-auto rounded-lg border border-white/20 bg-zinc-900 py-1 shadow-xl"
        >
          {suggestions.map((name, index) => (
            <li key={name} role="presentation">
              <button
                type="button"
                tabIndex={-1}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === highlight}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  index === highlight
                    ? 'bg-blue-500 text-white'
                    : 'text-white/90 hover:bg-white/10'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectName(name)
                }}
                onMouseEnter={() => setHighlight(index)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
