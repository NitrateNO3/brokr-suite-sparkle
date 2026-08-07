import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Icon-only action button with an accessible, animated tooltip.
 * Keeps aria-label and tooltip label in sync across the app.
 */
export function IconAction({
  label,
  children,
  className,
  asChild,
  active,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; active?: boolean }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            asChild={asChild}
            aria-label={label}
            className={cn(
              "h-9 w-9 cursor-pointer rounded-full text-muted-foreground transition-all duration-200",
              "hover:bg-accent hover:text-foreground hover:scale-110 active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active && "text-primary",
              className,
            )}
            {...props}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Tooltip wrapper for non-button elements such as badges and counters. */
export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
