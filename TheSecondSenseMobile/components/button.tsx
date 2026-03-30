import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Pressable, Text } from "react-native";

import { cn } from "../hooks/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-md text-sm font-medium transition-opacity disabled:opacity-50 self-start",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ButtonProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof Pressable>, "children">, // Scoatem children-ul original
    VariantProps<typeof buttonVariants> {
  labelClassName?: string;
  label?: string;
  children?: React.ReactNode; // Îl definim noi ca fiind doar conținut React, nu funcție
}

function Button({
  className,
  variant,
  size,
  labelClassName,
  label,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      {...props}
    >
      {/* Verificăm dacă afișăm label-ul sau children ca text */}
      {label || typeof children === "string" ? (
        <Text className={cn(buttonTextVariants({ variant }), labelClassName)}>
          {label || (children as string)}
        </Text>
      ) : (
        // Dacă e un element (ex: o iconiță), îl randezi direct
        children
      )}
    </Pressable>
  );
}

export { Button, buttonVariants };
