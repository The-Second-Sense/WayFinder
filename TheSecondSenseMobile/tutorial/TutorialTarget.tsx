import React, { useEffect, useRef } from "react";
import { LayoutRectangle, View, ViewProps } from "react-native";
import { useTutorial } from "./TutorialContext";

export const TutorialTarget = ({
  targetId,
  children,
  ...rest
}: ViewProps & { targetId: string }) => {
  const { registerTarget, setTargetLayout } = useTutorial();
  const ref = useRef<View>(null);

  useEffect(() => {
    const measure = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        const layout: LayoutRectangle = { x, y, width, height };
        setTargetLayout(targetId, layout);
      });
    };

    registerTarget(targetId, measure);
    setTimeout(measure, 100);
  }, []);

  return (
    <View ref={ref} {...rest}>
      {children}
    </View>
  );
};
