import { Minus } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { cn } from "../hooks/utils";

interface OTPProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

// Context to mimic the web behavior
const OTPContext = React.createContext<{ value: string; maxLength: number }>({
  value: "",
  maxLength: 6,
});

function InputOTP({
  value,
  onChange,
  maxLength = 6,
  children,
}: OTPProps & { children: React.ReactNode }) {
  const inputRef = React.useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <OTPContext.Provider value={{ value, maxLength }}>
      <Pressable onPress={handlePress} className="flex-row items-center gap-2">
        {children}
        {/* Hidden TextInput to handle keyboard and logic */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          maxLength={maxLength}
          keyboardType="number-pad"
          autoFocus
          style={StyleSheet.absoluteFill}
          className="opacity-0"
        />
      </Pressable>
    </OTPContext.Provider>
  );
}

function InputOTPGroup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("flex-row items-center gap-1", className)}>
      {children}
    </View>
  );
}

function InputOTPSlot({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  const { value } = React.useContext(OTPContext);
  const char = value[index] || "";
  const isActive = value.length === index;

  return (
    <View
      className={cn(
        "relative flex h-12 w-10 items-center justify-center border-y border-r border-input bg-background transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 border-ring ring-2 ring-ring/50",
        className,
      )}
    >
      <Text className="text-lg font-medium text-foreground">{char}</Text>

      {/* Fake Caret (Blinker) */}
      {isActive && (
        <View className="absolute h-5 w-[2px] bg-foreground animate-pulse" />
      )}
    </View>
  );
}

function InputOTPSeparator() {
  return (
    <View className="px-1">
      <Minus size={20} className="text-muted-foreground" />
    </View>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
