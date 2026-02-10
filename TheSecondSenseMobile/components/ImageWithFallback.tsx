import React, { useState } from "react";
import { Image, ImageProps, View } from "react-native";
import { cn } from "../hooks/utils"; // Assuming you're using a utility for class merging

const ERROR_IMG_SRC = {
  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==",
};

// We extend ImageProps instead of ImgHTMLAttributes
interface ImageWithFallbackProps extends ImageProps {
  className?: string;
}

export function ImageWithFallback({
  source,
  style,
  className,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  if (didError) {
    return (
      <View
        className={cn("items-center justify-center bg-gray-100", className)}
        style={style}
      >
        <Image
          source={ERROR_IMG_SRC}
          style={{ width: 40, height: 40, opacity: 0.3 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
