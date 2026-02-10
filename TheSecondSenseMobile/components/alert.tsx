import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "../hooks/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 flex-row items-start",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        destructive: "bg-destructive/10 border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const alertTitleVariants = cva("font-medium tracking-tight mb-1", {
  variants: {
    variant: {
      default: "text-card-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const alertDescriptionVariants = cva("text-sm leading-relaxed", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      destructive: "text-destructive/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Creăm un context pentru a transmite varianta către copii (Title/Description)
const AlertContext = React.createContext<{
  variant?: VariantProps<typeof alertVariants>["variant"];
}>({});

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof alertVariants>) {
  return (
    <AlertContext.Provider value={{ variant }}>
      <View
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {/* Container pentru conținutul text care stă lângă iconiță */}
        <View className="flex-1 ml-3">{children}</View>
      </View>
    </AlertContext.Provider>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  const { variant } = React.useContext(AlertContext);
  return (
    <Text
      className={cn(alertTitleVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  const { variant } = React.useContext(AlertContext);
  return (
    <Text
      className={cn(alertDescriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
