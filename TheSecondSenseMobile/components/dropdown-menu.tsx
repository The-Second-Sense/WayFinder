import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu";
import { Check } from "lucide-react-native";
import * as React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { cn } from "../hooks/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * Helper pentru a gestiona "children" care pot fi funcții (render props)
 * specifice componentelor Pressable din React Native.
 */
function renderChildren(children: any) {
  if (typeof children === "function") {
    return children({ pressed: false });
  }
  return children;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: DropdownMenuPrimitive.ContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md shadow-foreground/5",
          className,
        )}
        {...props}
      >
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
        >
          {renderChildren(children)}
        </Animated.View>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  children,
  ...props
}: DropdownMenuPrimitive.ItemProps & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex flex-row items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none active:bg-accent",
        inset && "pl-8",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <Text className="text-foreground">{renderChildren(children)}</Text>
    </DropdownMenuPrimitive.Item>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: DropdownMenuPrimitive.CheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex flex-row items-center rounded-sm py-2 pl-8 pr-2 text-sm active:bg-accent",
        className,
      )}
      checked={checked}
      {...props}
    >
      <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={14} strokeWidth={3} className="text-foreground" />
        </DropdownMenuPrimitive.ItemIndicator>
      </View>
      <Text className="text-foreground">{renderChildren(children)}</Text>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuPrimitive.SeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  children,
  ...props
}: DropdownMenuPrimitive.LabelProps & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-2 py-1.5 text-sm font-semibold text-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      <Text className="text-foreground">{renderChildren(children)}</Text>
    </DropdownMenuPrimitive.Label>
  );
}

function DropdownMenuShortcut({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    >
      <Text className="text-foreground">{children}</Text>
    </View>
  );
}

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuTrigger
};

