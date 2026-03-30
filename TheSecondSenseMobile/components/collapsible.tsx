import * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import * as React from "react";
import { View } from "react-native";
import { cn } from "../hooks/utils";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>) {
  // SOLUȚIA: În @rn-primitives, hook-ul se numește de obicei useRootContext
  // sau poți folosi direct proprietățile native ale primitivei.

  return (
    <CollapsiblePrimitive.Content
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <View>{children}</View>
    </CollapsiblePrimitive.Content>
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
