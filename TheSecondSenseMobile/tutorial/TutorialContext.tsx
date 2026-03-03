import React, { createContext, useContext, useRef, useState } from "react";
import { LayoutRectangle } from "react-native";
import { TutorialStep } from "./TutorialTypes";

type TargetLayout = LayoutRectangle & { targetId: string };

type TutorialContextType = {
  active: boolean;
  steps: TutorialStep[];
  currentStep: TutorialStep | null;
  currentIndex: number;
  currentTargetLayout: TargetLayout | null;
  startTutorial: (steps: TutorialStep[]) => void;
  stopTutorial: () => void;
  nextStep: () => void;
  notifyActionDone: (targetId: string, action?: "press" | "input") => void;
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

  // Refs so closures always read the latest values without stale captures
  const activeRef = useRef(active);
  const stepsRef = useRef(steps);
  const currentIndexRef = useRef(currentIndex);
  activeRef.current = active;
  stepsRef.current = steps;
  currentIndexRef.current = currentIndex;

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

  const nextStep = () => {
    const next = currentIndexRef.current + 1;
    if (next >= stepsRef.current.length) {
      stopTutorial();
    } else {
      setCurrentIndex(next);
      setTimeout(() => {
        Object.values(targetsRef.current).forEach((m) => m());
      }, 50);
    }
  };

  const notifyActionDone = (targetId: string, _action?: "press" | "input") => {
    if (!activeRef.current) return;
    const step = stepsRef.current[currentIndexRef.current];
    if (!step) return;
    if (step.targetId === targetId) {
      nextStep();
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
        currentIndex,
        currentTargetLayout,
        startTutorial,
        stopTutorial,
        nextStep,
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
