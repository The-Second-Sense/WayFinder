import * as PopoverPrimitive from "@rn-primitives/popover";
import * as React from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { cn } from "../hooks/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.ContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border border-border bg-popover p-4 shadow-md shadow-foreground/5",
          className,
        )}
        {...props}
      >
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
        >
          {props.children}
        </Animated.View>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

// Note: PopoverAnchor is removed because it is not supported in the @rn-primitives/popover namespace
export { Popover, PopoverContent, PopoverTrigger };
