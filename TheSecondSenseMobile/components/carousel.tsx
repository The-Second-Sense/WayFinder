import { ArrowLeft, ArrowRight } from "lucide-react-native";
import * as React from "react";
import {
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    View,
    type ViewProps,
} from "react-native";
import { cn } from "../hooks/utils";
import { Button } from "./button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CarouselContextProps = {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: "horizontal" | "vertical";
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context)
    throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

function Carousel({
  orientation = "horizontal",
  className,
  children,
  ...props
}: ViewProps & { orientation?: "horizontal" | "vertical" }) {
  const listRef = React.useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);

  // Calculăm numărul de copii pentru a gestiona butoanele de navigare
  React.useEffect(() => {
    setTotalItems(React.Children.count(children));
  }, [children]);

  const scrollPrev = () => {
    if (activeIndex > 0) {
      listRef.current?.scrollToIndex({ index: activeIndex - 1 });
    }
  };

  const scrollNext = () => {
    if (activeIndex < totalItems - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <CarouselContext.Provider
      value={{
        scrollPrev,
        scrollNext,
        canScrollPrev: activeIndex > 0,
        canScrollNext: activeIndex < totalItems - 1,
        orientation,
      }}
    >
      <View className={cn("relative w-full", className)} {...props}>
        {/* Pasăm referința și funcțiile copiilor prin context sau randăm direct */}
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement(child) &&
            (child.type as any).displayName === "CarouselContent"
          ) {
            return React.cloneElement(child as any, { listRef, onScroll });
          }
          return child;
        })}
      </View>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, children, listRef, onScroll }: any) {
  const { orientation } = useCarousel();

  return (
    <View className={cn("overflow-hidden", className)}>
      <FlatList
        ref={listRef}
        data={React.Children.toArray(children)}
        horizontal={orientation === "horizontal"}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }}>{item as any}</View>
        )}
      />
    </View>
  );
}
CarouselContent.displayName = "CarouselContent";

function CarouselItem({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("w-full items-center justify-center", className)}
      {...props}
    />
  );
}

function CarouselPrevious({ className, variant = "outline", ...props }: any) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  if (!canScrollPrev) return null;

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80",
        className,
      )}
      onPress={scrollPrev}
      {...props}
    >
      <ArrowLeft size={18} color="black" />
    </Button>
  );
}

function CarouselNext({ className, variant = "outline", ...props }: any) {
  const { scrollNext, canScrollNext } = useCarousel();
  if (!canScrollNext) return null;

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80",
        className,
      )}
      onPress={scrollNext}
      {...props}
    >
      <ArrowRight size={18} color="black" />
    </Button>
  );
}

export {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
};

