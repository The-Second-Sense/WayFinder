import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import { RootStackParamList } from "../app/(tabs)/App";
import svgPaths from "../hooks/svg-8uxyrq4nes";

type InregistrareVoceNavigationProp = StackNavigationProp<
  RootStackParamList,
  "InregistrareVoce"
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function Frame() {
  return (
    <View style={styles.frameContainer}>
      <Svg width="375" height="43" viewBox="0 0 375 43" fill="none">
        <G id="top">
          <Path d={svgPaths.p2ab9d800} stroke="white" opacity={0.35} />
          <Path d={svgPaths.p3fcc1700} fill="white" opacity={0.4} />
          <Path d={svgPaths.p23127800} fill="white" />
          <Path
            d={svgPaths.p15888f00}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path
            d={svgPaths.p115f9880}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          <Path d={svgPaths.p3274b400} fill="white" />
        </G>
      </Svg>
    </View>
  );
}

function MdiMicrophoneOutline() {
  return (
    <View style={styles.microphoneContainer}>
      <Svg
        width="70.5833"
        height="95.7917"
        viewBox="0 0 70.5833 95.7917"
        fill="none"
      >
        <Path d={svgPaths.p1befc400} fill="#1A1A1A" />
      </Svg>
    </View>
  );
}

function MdiScanHelper() {
  return (
    <View style={styles.scanHelperContainer}>
      <Svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        <Path d={svgPaths.p34cac880} fill="#1A1A1A" />
      </Svg>
      <MdiMicrophoneOutline />
    </View>
  );
}

export default function InregistrareVoce() {
  const navigation = useNavigation<InregistrareVoceNavigationProp>();

  const handlePoateDataViitoare = () => {
    console.log("User chose to skip voice registration");
    navigation.navigate("Cards");
  };

  const handlePermite = () => {
    navigation.navigate("InregistrareVoce2");
  };

  return (
    <View style={styles.container}>
      {/* Background yellow shape */}
      <View style={styles.yellowBackground}>
        <Svg width="375" height="861" viewBox="0 0 375 861" fill="none">
          <Path d={svgPaths.p2983ec10} fill="#FFED00" fillOpacity={0.68} />
        </Svg>
      </View>

      <Frame />

      <Text style={styles.titleText}>
        Configurează{"\n"}autentificarea{"\n"}prin voce
      </Text>

      <MdiScanHelper />

      <Text style={styles.descriptionText}>
        Vocea ta ne ajută să te recunoaștem în siguranță. Este unică și îți
        permite să te autentifici mai rapid, fără parole.
      </Text>

      {/* Permite Button */}
      <TouchableOpacity style={styles.permiteButton} onPress={handlePermite}>
        <Text style={styles.permiteButtonText}>Permite</Text>
      </TouchableOpacity>

      {/* Poate data viitoare Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handlePoateDataViitoare}
      >
        <Text style={styles.skipButtonText}>Poate data viitoare</Text>
      </TouchableOpacity>

      <Text style={styles.stepText}>Pasul 2 din 2</Text>

      {/* Home indicator */}
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
  yellowBackground: {
    position: "absolute",
    left: 0,
    top: -49,
    width: 375,
    height: 861,
    transform: [{ scaleY: -1 }],
  },
  frameContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 43,
  },
  titleText: {
    position: "absolute",
    top: 117,
    left: 19,
    right: 19,
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 44,
  },
  scanHelperContainer: {
    position: "absolute",
    left: 112,
    top: 258,
    width: 150,
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  microphoneContainer: {
    position: "absolute",
    width: 70,
    height: 96,
  },
  descriptionText: {
    position: "absolute",
    top: 422,
    left: 58,
    right: 58,
    fontSize: 16,
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 20,
  },
  permiteButton: {
    position: "absolute",
    top: 551,
    left: 98,
    width: 180,
    height: 50,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  permiteButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    position: "absolute",
    top: 621,
    left: 98,
    width: 180,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    color: "rgba(26, 26, 26, 0.7)",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepText: {
    position: "absolute",
    top: 754,
    left: 0,
    right: 0,
    fontSize: 18,
    color: "#1a1a1a",
    textAlign: "center",
  },
  homeIndicator: {
    position: "absolute",
    left: 137,
    top: 792,
    width: 100,
    height: 5,
  },
});
