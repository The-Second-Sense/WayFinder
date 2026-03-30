import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "../hooks/utils";

const badgeVariants = cva(
  // Am adăugat self-start pentru ca Badge-ul să nu se întindă pe toată lățimea containerului părinte
  "flex-row items-center justify-center rounded-md border px-2 py-0.5 self-start",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary",
        secondary: "border-transparent bg-secondary",
        destructive: "border-transparent bg-destructive",
        outline: "border-border bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground", // Folosim foreground pentru consistență
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BadgeProps
  extends
    React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  labelClassName?: string;
  label?: string; // Adăugat pentru comoditate
}

function Badge({
  className,
  labelClassName,
  variant,
  children,
  label,
  ...props
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {/* Verificăm dacă avem label sau string children */}
      {label || typeof children === "string" ? (
        <Text className={cn(badgeTextVariants({ variant }), labelClassName)}>
          {label || children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Badge, badgeVariants };
