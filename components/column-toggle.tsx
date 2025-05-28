"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColumnToggleProps {
  columns: string[]
  visibleColumns: string[]
  setVisibleColumns: (columns: string[]) => void
}

export function ColumnToggle({ columns, visibleColumns, setVisibleColumns }: ColumnToggleProps) {
  const [open, setOpen] = React.useState(false)

  const toggleColumn = (column: string) => {
    if (visibleColumns.includes(column)) {
      // Don't allow removing the last column
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== column))
      }
    } else {
      setVisibleColumns([...visibleColumns, column])
    }
  }

  const selectAll = () => {
    setVisibleColumns([...columns])
  }

  const clearAll = () => {
    // Always keep at least one column
    setVisibleColumns([columns[0]])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
          Columns ({visibleColumns.length}/{columns.length})
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {columns.map((column) => (
                <CommandItem key={column} value={column} onSelect={() => toggleColumn(column)}>
                  <Check
                    className={cn("mr-2 h-4 w-4", visibleColumns.includes(column) ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{column}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex border-b p-2 gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="text-xs">
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearAll} className="text-xs">
              Clear All
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
