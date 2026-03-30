import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "../hooks/utils";

function Input({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextInput
      data-slot="input"
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor="#a1a1aa" // Matches text-muted-foreground
      // In RN, we use textAlignVertical: 'top' for multiline, but here we keep it standard
      className={cn(
        "border-input h-10 w-full rounded-md border bg-background px-3 text-base text-foreground transition-all",
        // Focus ring simulation
        isFocused && "border-ring ring-2 ring-ring/50",
        // Disabled state
        props.editable === false && "opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
