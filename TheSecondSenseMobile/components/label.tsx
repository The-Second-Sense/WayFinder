import * as React from "react";
import { Text } from "react-native";
import { cn } from "../hooks/utils";

// We use ComponentPropsWithoutRef<typeof Text> for native compatibility
function Label({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none text-foreground",
        // Handling disabled state via opacity if needed
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
