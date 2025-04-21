// components/ui/tooltip-wrapper.tsx
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
  
  interface TooltipWrapperProps {
    children: React.ReactNode;
    tooltipText: string;
    side?: "top" | "right" | "bottom" | "left";
    disabled?: boolean; // Prevent tooltip from showing if action is disabled
  }
  
  export function TooltipWrapper({ children, tooltipText, side = "top", disabled = false }: TooltipWrapperProps) {
    if (disabled) {
        return <>{children}</>; // Render children directly if disabled
    }
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side={side}>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }