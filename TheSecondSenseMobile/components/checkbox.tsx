import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import { Check } from "lucide-react-native";
import * as React from "react";
import { cn } from "../hooks/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-[4px] border border-primary shadow-sm outline-none",
        "web:focus-visible:ring-ring web:focus-visible:ring-[3px] disabled:opacity-50",
        props.checked ? "bg-primary" : "bg-transparent", // Logică de fundal manuală
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn("flex items-center justify-center h-full w-full")}
      >
        <Check
          size={14}
          strokeWidth={3}
          className="text-primary-foreground" // Culoarea bifei
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
