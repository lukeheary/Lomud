"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";

interface CategoryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryMultiSelect({
  value,
  onChange,
  placeholder = "Select categories...",
  className,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleCategory = (category: Category) => {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  };

  const removeCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((c) => c !== category));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-12 w-full justify-between rounded-xl bg-muted px-4 py-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
                  value.map((category) => {
                if (!category) return null;
                const label = CATEGORY_LABELS[category as Category];
                return (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="mr-1 gap-1"
                  >
                    {label || category}
                    <button
                      type="button"
                      className="ml-1 rounded-full hover:bg-muted-foreground/20"
                      onClick={(e) => removeCategory(category, e)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="grid gap-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                value.includes(category) && "bg-accent"
              )}
            >
              <span>{CATEGORY_LABELS[category]}</span>
              {value.includes(category) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
