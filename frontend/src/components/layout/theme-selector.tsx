"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const themes = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="grid grid-cols-3 gap-2"
    >
      {themes.map(({ value, label, Icon }) => {
        const selected = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(value)}
            className={[
              "flex min-h-11 flex-col items-center justify-center gap-1",
              "rounded-lg border px-2 py-2 text-xs font-medium",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            ].join(" ")}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
