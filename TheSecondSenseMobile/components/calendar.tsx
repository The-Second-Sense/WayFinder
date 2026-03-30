import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";
import { LocaleConfig, Calendar as RNCalendar } from "react-native-calendars";
import { cn } from "../hooks/utils";

// Configurăm limba (opțional)
LocaleConfig.locales["ro"] = {
  monthNames: [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie",
  ],
  monthNamesShort: [
    "Ian.",
    "Feb.",
    "Mar.",
    "Apr.",
    "Mai",
    "Iun.",
    "Iul.",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec.",
  ],
  dayNames: [
    "Duminică",
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
  ],
  dayNamesShort: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"],
  today: "Astăzi",
};
LocaleConfig.defaultLocale = "ro";

function Calendar({ className, ...props }: any) {
  // Culori extrase din sistemul tău de teme (înlocuiește cu variabilele tale CSS/Tailwind)
  const theme = {
    backgroundColor: "transparent",
    calendarBackground: "transparent",
    textSectionTitleColor: "#64748b", // muted-foreground
    selectedDayBackgroundColor: "#0f172a", // primary
    selectedDayTextColor: "#ffffff", // primary-foreground
    todayTextColor: "#0f172a",
    dayTextColor: "#1e293b",
    textDisabledColor: "#94a3b8",
    arrowColor: "#64748b",
    monthTextColor: "#020617", // foreground
    indicatorColor: "#0f172a",
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
    textDayFontWeight: "400",
    textMonthFontWeight: "600",
    textDayHeaderFontWeight: "400",
  };

  return (
    <View
      className={cn(
        "p-3 bg-background rounded-md border border-border",
        className,
      )}
    >
      <RNCalendar
        {...props}
        theme={theme}
        renderArrow={(direction: "left" | "right") =>
          direction === "left" ? (
            <ChevronLeft size={20} color={theme.arrowColor} />
          ) : (
            <ChevronRight size={20} color={theme.arrowColor} />
          )
        }
        enableSwipeMonths={true}
        // Exemplu de marcare pentru "selected" similar cu Shadcn
        markingType={"custom"}
      />
    </View>
  );
}

export { Calendar };
