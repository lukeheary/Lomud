"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

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
  const { data: categoryOptions, isLoading } = trpc.category.listActive.useQuery();

  const labelMap = Object.fromEntries(
    (categoryOptions || []).map((category) => [category.key, category.label])
  );

  const toggleCategory = (categoryKey: string) => {
    if (value.includes(categoryKey)) {
      onChange(value.filter((c) => c !== categoryKey));
    } else {
      onChange([...value, categoryKey]);
    }
  };

  const removeCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((c) => c !== category));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={0}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto min-h-12 w-full justify-between rounded-xl bg-muted px-4 py-2 cursor-pointer",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
                  value.map((category) => {
                if (!category) return null;
                const label = labelMap[category];
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
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="grid gap-1">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading categories...
            </div>
          )}
          {(categoryOptions || []).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.key)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                value.includes(category.key) && "bg-accent"
              )}
            >
              <span>{category.label}</span>
              {value.includes(category.key) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
