import React, { createContext, useContext, useRef, useState } from "react";
import { LayoutRectangle } from "react-native";
import { TutorialStep } from "./TutorialTypes";

type TargetLayout = LayoutRectangle & { targetId: string };

type TutorialContextType = {
  active: boolean;
  steps: TutorialStep[];
  currentStep: TutorialStep | null;
  currentTargetLayout: TargetLayout | null;
  startTutorial: (steps: TutorialStep[]) => void;
  stopTutorial: () => void;
  notifyActionDone: (targetId: string, action: "press" | "input") => void;
  registerTarget: (targetId: string, measure: () => void) => void;
  setTargetLayout: (targetId: string, layout: LayoutRectangle) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});

  const targetsRef = useRef<Record<string, () => void>>({});

  const startTutorial = (steps: TutorialStep[]) => {
    setSteps(steps);
    setCurrentIndex(0);
    setActive(true);

    setTimeout(() => {
      Object.values(targetsRef.current).forEach((m) => m());
    }, 50);
  };

  const stopTutorial = () => {
    setActive(false);
    setSteps([]);
    setCurrentIndex(0);
  };

  const currentStep = active ? steps[currentIndex] : null;

  const currentTargetLayout =
    currentStep && layouts[currentStep.targetId]
      ? { ...layouts[currentStep.targetId], targetId: currentStep.targetId }
      : null;

  const notifyActionDone = (targetId: string, action: "press" | "input") => {
    if (!currentStep) return;
    if (currentStep.targetId === targetId && currentStep.action === action) {
      const next = currentIndex + 1;
      if (next >= steps.length) {
        stopTutorial();
      } else {
        setCurrentIndex(next);
      }
    }
  };

  const registerTarget = (targetId: string, measure: () => void) => {
    targetsRef.current[targetId] = measure;
  };

  const setTargetLayout = (targetId: string, layout: LayoutRectangle) => {
    setLayouts((prev) => ({ ...prev, [targetId]: layout }));
  };

  return (
    <TutorialContext.Provider
      value={{
        active,
        steps,
        currentStep,
        currentTargetLayout,
        startTutorial,
        stopTutorial,
        notifyActionDone,
        registerTarget,
        setTargetLayout,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
};
