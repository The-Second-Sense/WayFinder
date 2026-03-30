import React, { useEffect, useRef } from "react";
import { LayoutRectangle, View, ViewProps } from "react-native";
import { useTutorial } from "./TutorialContext";

export const TutorialTarget = ({
  targetId,
  children,
  ...rest
}: ViewProps & { targetId: string }) => {
  const { active, registerTarget, setTargetLayout } = useTutorial();
  const ref = useRef<View>(null);

  const measure = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 || height > 0) {
        setTargetLayout(targetId, { x, y, width, height } as LayoutRectangle);
      }
    });
  };

  // Register on mount and measure once the view is laid out
  useEffect(() => {
    registerTarget(targetId, measure);
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, []);

  // Re-measure every time the tutorial becomes active (modal may have just closed)
  useEffect(() => {
    if (active) {
      const t = setTimeout(measure, 100);
      return () => clearTimeout(t);
    }
  }, [active]);

  return (
    <View ref={ref} {...rest}>
      {children}
    </View>
  );
};
