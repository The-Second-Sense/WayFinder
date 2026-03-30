import * as DrawerPrimitive from "@rn-primitives/dialog";
import * as React from "react";
import { Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";
import { cn } from "../hooks/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

function DrawerOverlay({ className, ...props }: DrawerPrimitive.OverlayProps) {
  return (
    <DrawerPrimitive.Overlay asChild {...props}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        // Changed 'fixed' to 'absolute' for Mobile
        className={cn("absolute inset-0 z-50 bg-black/50", className)}
      />
    </DrawerPrimitive.Overlay>
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.ContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content asChild {...props}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          // Removed 'fixed', used 'absolute' and ensured it sits at the bottom
          className={cn(
            "absolute inset-x-0 bottom-0 z-50 flex h-auto flex-col rounded-t-[20px] border-t border-border bg-background pb-10",
            className,
          )}
        >
          {/* The Handle / Drag Indicator */}
          <View className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

          {children}
        </Animated.View>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
  );
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.TitleProps) {
  return (
    <DrawerPrimitive.Title asChild {...props}>
      <Text className={cn("text-lg font-semibold text-foreground", className)}>
        {props.children}
      </Text>
    </DrawerPrimitive.Title>
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.DescriptionProps) {
  return (
    <DrawerPrimitive.Description asChild {...props}>
      <Text className={cn("text-sm text-muted-foreground", className)}>
        {props.children}
      </Text>
    </DrawerPrimitive.Description>
  );
}

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger
};

