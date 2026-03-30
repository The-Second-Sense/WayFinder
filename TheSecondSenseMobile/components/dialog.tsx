import * as DialogPrimitive from "@rn-primitives/dialog";
import { X } from "lucide-react-native";
import * as React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    ZoomOut,
} from "react-native-reanimated";

import { cn } from "../hooks/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: DialogPrimitive.OverlayProps) {
  return (
    <DialogPrimitive.Overlay asChild {...props}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className={cn(
          "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4",
          className,
        )}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.ContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay>
        <DialogPrimitive.Content asChild {...props}>
          <Animated.View
            entering={ZoomIn.duration(200)}
            exiting={ZoomOut.duration(200)}
            className={cn(
              "bg-background w-full max-w-lg gap-4 rounded-lg border border-border p-6 shadow-lg",
              className,
            )}
          >
            {children}
            <DialogPrimitive.Close
              asChild
              className="absolute right-4 top-4 rounded-sm opacity-70"
            >
              <Pressable hitSlop={10}>
                <X size={20} className="text-muted-foreground" />
              </Pressable>
            </DialogPrimitive.Close>
          </Animated.View>
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn(
        "flex flex-col gap-1.5 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.TitleProps) {
  return (
    <DialogPrimitive.Title asChild {...props}>
      <Text
        className={cn(
          "text-lg font-semibold leading-none text-foreground",
          className,
        )}
      >
        {props.children}
      </Text>
    </DialogPrimitive.Title>
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.DescriptionProps) {
  return (
    <DialogPrimitive.Description asChild {...props}>
      <Text className={cn("text-sm text-muted-foreground", className)}>
        {props.children}
      </Text>
    </DialogPrimitive.Description>
  );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger
};

