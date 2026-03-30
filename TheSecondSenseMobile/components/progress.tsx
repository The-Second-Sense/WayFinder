import * as React from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { cn } from "../hooks/utils";

interface ProgressProps {
  value?: number; // 0 to 100
  className?: string;
}

function Progress({ className, value = 0 }: ProgressProps) {
  // Shared value for smooth animations
  const progress = useSharedValue(0);

  React.useEffect(() => {
    // We cap the value between 0 and 100
    const cappedValue = Math.min(Math.max(value, 0), 100);
    progress.value = withSpring(cappedValue, {
      damping: 20,
      stiffness: 90,
    });
  }, [value]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  return (
    <View
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
    >
      <Animated.View
        data-slot="progress-indicator"
        className="bg-primary h-full"
        style={indicatorStyle}
      />
    </View>
  );
}

export { Progress };
