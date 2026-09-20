import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import { ActionButton } from "@/components/action-feedback";

export function SearchableSelect({
  value,
  onChange,
  options,
  label,
  className = "",
  allowCustom = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; keywords?: string }>;
  label: string;
  className?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ActionButton
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          className={`flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2 text-left text-[13px] ${className}`}
        >
          <span className="truncate">
            {options.find((option) => option.value === value)?.label ||
              value ||
              label}
          </span>
          <ChevronsUpDown size={15} className="shrink-0" />
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(420px,calc(100vw-32px))] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            aria-label={`Search ${label.toLowerCase()}`}
            placeholder="Type to search…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Clear selection" onSelect={() => select("")}>
                Clear selection
              </CommandItem>
              {options.map((option, index) => (
                <CommandItem
                  key={`${option.value}-${index}`}
                  value={`${option.value} ${option.label} ${option.keywords || ""}`}
                  onSelect={() => select(option.value)}
                >
                  <Check
                    size={14}
                    className={
                      value === option.value ? "opacity-100" : "opacity-0"
                    }
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
              {allowCustom &&
                query.trim() &&
                !options.some(
                  (option) =>
                    option.value.toLowerCase() === query.trim().toLowerCase(),
                ) && (
                  <CommandItem
                    value={query}
                    onSelect={() => select(query.trim().toUpperCase())}
                  >
                    Use code “{query.trim().toUpperCase()}”
                  </CommandItem>
                )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
