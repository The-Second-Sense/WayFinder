export type TutorialActionType = "press" | "input";

export type TutorialStep = {
  id: string;
  targetId: string;
  action: TutorialActionType;
  message: string;
};
