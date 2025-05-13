// components/settings/VerificationBadge.tsx
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  isVerified: boolean | undefined | null;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ isVerified }) => {
  if (isVerified === null || isVerified === undefined) return null; // Don't show if status unknown

  const status = isVerified
    ? { text: "Verified", icon: CheckCircle2, variant: "success", tooltip: "This position has been verified." }
    : { text: "Pending", icon: ShieldAlert, variant: "warning", tooltip: "This position is pending verification by an administrator." };

  const Icon = status.icon;

  return (
     <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge variant={status.variant as any} className="ml-2 cursor-help">
                    <Icon className="h-3.5 w-3.5 mr-1" />
                    {status.text}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <p>{status.tooltip}</p>
            </TooltipContent>
        </Tooltip>
     </TooltipProvider>
  );
};

// Add custom variants to Badge component styles if needed (e.g., success, warning)
// Or use default/secondary and adjust icon color.