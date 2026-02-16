import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import svgPaths from "../hooks/svg-8uxyrq4nes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function Frame() {
  return (
    <View style={styles.frameContainer}>
      <Svg width={SCREEN_WIDTH} height="50" viewBox="0 0 375 43" preserveAspectRatio="none" fill="none">
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
  const router=useRouter();

  const handlePoateDataViitoare = () => {
    console.log("User chose to skip voice registration");
    router.replace("/(tabs)/dashboard");
  };

  const handlePermite = () => {
    router.replace("./VoiceRegistration2");
  };

  return (
    <View style={styles.container}>
      {/* Background yellow shape */}
      <View style={styles.yellowBackground}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} viewBox="0 0 375 861" preserveAspectRatio="none" fill="none">
          <Path d={svgPaths.p2983ec10} fill="#FFED00" fillOpacity={0.68} />
        </Svg>
      </View>

      <Frame />

        <View style={styles.content}>
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
        </View>

        <View style={styles.footer}>
        {/* Home indicator */}
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
    backgroundColor: "white",
    // width: SCREEN_WIDTH,
    // height: SCREEN_HEIGHT,
    // backgroundColor: "white",
    // //borderRadius: 20,
    // overflow: "hidden",
    // position: "relative",
  },
  yellowBackground: {
    position: "absolute", 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    top: 0, 
    left: 0, 
    zIndex: -1,
    // position: "absolute",
    // left: 0,
    // top: -49,
    // width: 375,
    // height: 861,
    // transform: [{ scaleY: -1 }],
  },
  content: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 28, },
  frameContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 43,
  },
  titleText: {
    fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#1a1a1a", lineHeight: 40,
    // position: "absolute",
    // top: 117,
    // left: 19,
    // right: 19,
    // fontSize: 36,
    // fontWeight: "bold",
    // color: "#1a1a1a",
    // textAlign: "center",
    // lineHeight: 44,
  },
  scanHelperContainer: {
    width: 150, height: 150, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
    // position: "absolute",
    // left: 112,
    // top: 258,
    // width: 150,
    // height: 150,
    // backgroundColor: "rgba(255, 255, 255, 0.1)",
    // borderRadius: 20,
    // justifyContent: "center",
    // alignItems: "center",
  },
  microphoneContainer: {
    position: "absolute", justifyContent: "center", alignItems: "center",
    // position: "absolute",
    // width: 70,
    // height: 96,
  },
  descriptionText: {
    fontSize: 16, textAlign: "center", color: "#1a1a1a", paddingHorizontal: 20, lineHeight: 22,
    // position: "absolute",
    // top: 422,
    // left: 58,
    // right: 58,
    // fontSize: 16,
    // color: "#1a1a1a",
    // textAlign: "center",
    // lineHeight: 20,
  },
  permiteButton: {
    backgroundColor: "#1a1a1a", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, marginTop: 10,
    // position: "absolute",
    // top: 551,
    // left: 98,
    // width: 180,
    // height: 50,
    // backgroundColor: "#1a1a1a",
    // borderRadius: 10,
    // justifyContent: "center",
    // alignItems: "center",
  },
  permiteButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12,
    // position: "absolute",
    // top: 621,
    // left: 98,
    // width: 180,
    // height: 50,
    // borderRadius: 10,
    // justifyContent: "center",
    // alignItems: "center",
  },
  skipButtonText: {
    color: "rgba(26, 26, 26, 0.7)",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: { paddingBottom: 24, alignItems: "center", },
//   homeIndicator: {
//     position: "absolute",
//     left: 137,
//     top: 792,
//     width: 100,
//     height: 5,
//   },
});
