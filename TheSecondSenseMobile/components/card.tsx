import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cn } from "../hooks/utils";

function Card({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card"
      className={cn(
        "bg-card flex flex-col gap-6 rounded-xl border border-border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-header"
      className={cn(
        "flex-row items-start justify-between px-6 pt-6 gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

// Container pentru Titlu și Descriere (pentru a le ține în stânga când există CardAction)
function CardTitleContainer({ className, ...props }: ViewProps) {
  return (
    <View className={cn("flex-1 flex-col gap-1.5", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="card-title"
      className={cn(
        "text-card-foreground text-xl font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-action"
      className={cn("self-start", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="card-footer"
      className={cn("flex-row items-center px-6 pb-6", className)}
      {...props}
    />
  );
}

export {
    Card,
    CardAction,
    CardContent,
    CardDescription, // Adăugat pentru layout
    CardFooter,
    CardHeader,
    CardTitle,
    CardTitleContainer
};

