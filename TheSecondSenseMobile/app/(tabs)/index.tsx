import { useRouter } from "expo-router"; // 1. Schimbăm importul
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../../hooks/svg-pib45gyikz";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function Top() {
  return (
    <View style={styles.topContainer}>
      <Svg width="375" height="43" viewBox="0 0 375 43" fill="none">
        <G id="top">
          <Path d={svgPaths.p2ab9d800} stroke="#1A1A1A" opacity={0.35} />
          <Path d={svgPaths.p3fcc1700} fill="#1A1A1A" opacity={0.4} />
          <Path d={svgPaths.p23127800} fill="#1A1A1A" />
          <Path
            d={svgPaths.p15888f00}
            fill="#1A1A1A"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path
            d={svgPaths.p115f9880}
            fill="#1A1A1A"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path d={svgPaths.p3274b400} fill="#1A1A1A" />
        </G>
      </Svg>
    </View>
  );
}

export default function WelcomePage() {
  const router = useRouter(); // 2. Inițializăm router-ul Expo

  useEffect(() => {
    // Tranziție automată după 3 secunde
    const timer = setTimeout(() => {
      // 3. Navigăm către fișierul login.tsx
      // Dacă login.tsx este în (tabs), folosește router.replace("/(tabs)/login")
      router.replace("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Formele galbene de fundal */}
      <View style={styles.yellowShape1}>
        <Svg
          width="475.5"
          height="274.017"
          viewBox="0 0 475.5 274.017"
          fill="none"
        >
          <Path d={svgPaths.p1b4d8380} fill="#FFFB00" fillOpacity={0.49} />
        </Svg>
      </View>

      <View style={styles.yellowShape2}>
        <Svg width="476" height="366" viewBox="0 0 476 366" fill="none">
          <Path d={svgPaths.p149179b2} fill="#FFED00" fillOpacity={0.34} />
        </Svg>
      </View>

      <Top />

      {/* Logo-ul aplicației */}
      <View style={styles.logoContainer}>
        <Image
          // Verifică dacă această cale este corectă după mutarea fișierului
          source={require("../../assets/images/logo-wayfinder.jpeg")}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>

      {/* Indicator Home */}
      <View style={styles.homeIndicator}>
        <Svg width="100" height="5" viewBox="0 0 100 5" fill="none">
          <Line
            x1="2.5"
            y1="2.5"
            x2="97.5"
            y2="2.5"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 43,
  },
  yellowShape1: {
    position: "absolute",
    left: -71,
    top: 537.98,
    width: 475.5,
    height: 274.017,
  },
  yellowShape2: {
    position: "absolute",
    left: -32,
    top: 462,
    width: 476,
    height: 366,
    transform: [{ scaleY: -1 }, { rotate: "180deg" }],
  },
  logoContainer: {
    position: "absolute",
    left: 29,
    top: 132,
    width: 316,
    height: 316,
    borderRadius: 7,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 7,
  },
  homeIndicator: {
    position: "absolute",
    left: 137,
    top: 792,
    width: 100,
    height: 5,
  },
});
