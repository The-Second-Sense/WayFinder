import * as React from "react";
import { Text, View } from "react-native";
// Folosim primitivele adaptate pentru React Native
import * as AccordionPrimitive from "@rn-primitives/accordion";
import { ChevronDown } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { cn } from "../hooks/utils";

function Accordion({
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-border", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: any) {
  const { isExpanded } = AccordionPrimitive.useItemContext();

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn("flex-row items-center justify-between py-4", className)}
        {...props}
      >
        <Text className="text-sm font-medium">{children}</Text>
        <Animated.View
          style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
        >
          <ChevronDown size={16} color="gray" />
        </Animated.View>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: any) {
  return (
    <AccordionPrimitive.Content
      className={cn("overflow-hidden text-sm pb-4", className)}
      {...props}
    >
      <View>{children}</View>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
