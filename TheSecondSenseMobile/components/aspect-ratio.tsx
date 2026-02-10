import * as React from "react";
import { View } from "react-native";

// Definim tipurile pentru a păstra consistența cu API-ul Radix
interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof View> {
  ratio?: number;
}

function AspectRatio({ ratio = 1, style, ...props }: AspectRatioProps) {
  return (
    <View
      data-slot="aspect-ratio"
      style={[
        style,
        {
          aspectRatio: ratio,
          width: "100%", // De obicei vrem să ocupe lățimea containerului tată
        },
      ]}
      {...props}
    />
  );
}

export { AspectRatio };
