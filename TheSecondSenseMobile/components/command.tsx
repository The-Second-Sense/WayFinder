import { Search } from "lucide-react-native";
import * as React from "react";
import {
    Pressable,
    Text,
    TextInput,
    View,
    type TextInputProps,
    type ViewProps,
} from "react-native";
import { cn } from "../hooks/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./dialog";

function Command({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="command"
      className={cn(
        "bg-popover flex h-full w-full flex-col overflow-hidden rounded-md",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  open,
  onOpenChange,
  ...props
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }: TextInputProps) {
  return (
    <View
      data-slot="command-input-wrapper"
      className="flex-row h-12 items-center gap-2 border-b border-border px-3"
    >
      <Search size={18} className="text-muted-foreground opacity-50" />
      <TextInput
        placeholderTextColor="#64748b"
        className={cn("flex-1 h-full text-foreground text-sm py-2", className)}
        {...props}
      />
    </View>
  );
}

function CommandList({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="command-list"
      className={cn("max-h-[300px] flex-col", className)}
      {...props}
    />
  );
}

function CommandEmpty({ children, ...props }: ViewProps) {
  return (
    <View
      data-slot="command-empty"
      className="py-6 items-center justify-center"
      {...props}
    >
      <Text className="text-sm text-muted-foreground">
        {children || "No results found."}
      </Text>
    </View>
  );
}

function CommandGroup({
  className,
  label,
  children,
  ...props
}: ViewProps & { label?: string }) {
  return (
    <View data-slot="command-group" className={cn("p-1", className)} {...props}>
      {label && (
        <Text className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
          {label}
        </Text>
      )}
      {children}
    </View>
  );
}

function CommandSeparator({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px my-1", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  onPress,
  disabled,
  ...props
}: ViewProps & { onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      data-slot="command-item"
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
        },
      ]}
      className={cn(
        "relative flex-row items-center gap-2 rounded-sm px-2 py-3",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-sm text-foreground">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function CommandShortcut({ className, children, ...props }: any) {
  return (
    <Text
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut
};

