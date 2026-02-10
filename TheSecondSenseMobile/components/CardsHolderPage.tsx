import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import svgPaths from "../hooks/svg-rfmsf95v8t";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function SystemTabBarDisplayDown() {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.homeIndicatorBar} />
    </View>
  );
}

function Top() {
  return (
    <View style={styles.topContainer}>
      <Svg width="375" height="40" viewBox="0 0 375 40" fill="none">
        <G id="top">
          <Path d={svgPaths.p3d78f640} fill="white" />
          <Path d={svgPaths.p26d17600} fill="white" />
          <Path
            d={svgPaths.p78d6700}
            fill="white"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </G>
      </Svg>
    </View>
  );
}

function NavBar() {
  return (
    <View style={styles.navBarContainer}>
      <View style={styles.navBarBackground} />
      <Text style={styles.navBarTitle}>Choose card</Text>
      <View style={styles.backArrowContainer}>
        <Svg width="16" height="9" viewBox="0 0 15.9945 8.65207" fill="none">
          <Path
            d={svgPaths.p279b5440}
            fill="#F5D908"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </Svg>
      </View>
    </View>
  );
}

function CardBank() {
  return (
    <View style={styles.card1Container}>
      <Svg width="327" height="204" viewBox="0 0 327 204" fill="none">
        <Path d={svgPaths.p1a94e00} fill="#1573FF" />
      </Svg>

      <Text style={styles.cardName}>John Smith</Text>
      <Text style={styles.cardType}>Amazon Platinium</Text>

      <View style={styles.cardNumberContainer}>
        <Text style={styles.cardNumber}> 4756 </Text>
        <View style={styles.circlesHide}>
          <Svg
            width="81.7486"
            height="5.3138"
            viewBox="0 0 81.7486 5.3138"
            fill="none"
          >
            <Path d={svgPaths.p3130ce00} fill="white" />
            <Path d={svgPaths.p2e88a370} fill="white" />
          </Svg>
        </View>
        <Text style={styles.cardNumber}> 9018</Text>
      </View>

      <Text style={styles.cardBalance}>$3.469.52</Text>

      <View style={styles.visaLogo}>
        <Svg
          width="46.5565"
          height="15.5215"
          viewBox="0 0 46.5565 15.5215"
          fill="none"
        >
          <Path d={svgPaths.p2b907a00} fill="white" />
          <Path d={svgPaths.p299ba080} fill="white" />
        </Svg>
      </View>
    </View>
  );
}

function CardBank1() {
  return (
    <View style={styles.card2Container}>
      <Svg width="327" height="204" viewBox="0 0 327 204" fill="none">
        <Path d={svgPaths.p137fff80} fill="#FFC256" />
      </Svg>

      <Text style={styles.cardName}>John Smith</Text>
      <Text style={styles.cardType}>Amazon Platinium</Text>

      <View style={styles.cardNumberContainer}>
        <Text style={styles.cardNumber}> 4756 </Text>
        <View style={styles.circlesHide}>
          <Svg
            width="81.7486"
            height="5.31378"
            viewBox="0 0 81.7486 5.31378"
            fill="none"
          >
            <Path d={svgPaths.p1267f780} fill="white" />
            <Path d={svgPaths.p2e88a370} fill="white" />
          </Svg>
        </View>
        <Text style={styles.cardNumber}> 9018</Text>
      </View>

      <Text style={styles.cardBalance}>$3.469.52</Text>

      <View style={styles.mastercardLogo}>
        <Svg width="47" height="31" viewBox="0 0 47 31" fill="none">
          <Path d={svgPaths.p390ba180} fill="white" opacity={0.6} />
          <Path d={svgPaths.p6e1da80} fill="white" />
        </Svg>
      </View>
    </View>
  );
}

function NewCardButton() {
  return (
    <View style={styles.newCardButtonContainer}>
      <Image
        source={require("../assets/new-card-button.png")}
        style={styles.newCardButtonImage}
        resizeMode="contain"
      />
      <Text style={styles.newCardButtonText}>Add new card</Text>
    </View>
  );
}

export default function CardsHolderPage() {
  return (
    <View style={styles.container}>
      <SystemTabBarDisplayDown />
      <CardBank />
      <CardBank1 />
      <NavBar />
      <Top />
      <NewCardButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(26, 26, 26, 0.75)",
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  homeIndicatorBar: {
    position: "absolute",
    bottom: 9,
    width: 134,
    height: 5,
    backgroundColor: "#cacaca",
    borderRadius: 100,
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 40,
  },
  navBarContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    height: 53,
    backgroundColor: "rgba(26, 26, 26, 0.6)",
  },
  navBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 375,
    height: 53,
    backgroundColor: "rgba(26, 26, 26, 0.5)",
  },
  navBarTitle: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    fontSize: 20,
    fontWeight: "600",
    color: "#f5d908",
    textAlign: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: 24,
    top: 18,
    width: 16,
    height: 16,
    backgroundColor: "rgba(26, 26, 26, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "90deg" }],
  },
  card1Container: {
    position: "absolute",
    top: 117,
    left: 24,
    right: 24,
    height: 204,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.85)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  card2Container: {
    position: "absolute",
    top: 345,
    left: 24,
    right: 24,
    height: 204,
    backgroundColor: "white",
    borderRadius: 10,
  },
  cardName: {
    position: "absolute",
    top: 21,
    left: 20,
    fontSize: 24,
    color: "white",
  },
  cardType: {
    position: "absolute",
    top: 93,
    left: 20,
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  cardNumberContainer: {
    position: "absolute",
    top: 122,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardNumber: {
    fontSize: 16,
    color: "white",
  },
  circlesHide: {
    marginHorizontal: 8,
  },
  cardBalance: {
    position: "absolute",
    top: 150,
    left: 20,
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  visaLogo: {
    position: "absolute",
    bottom: 26,
    right: 31,
  },
  mastercardLogo: {
    position: "absolute",
    bottom: 26,
    right: 31,
  },
  newCardButtonContainer: {
    position: "absolute",
    top: 581,
    left: 24,
    right: 24,
    height: 49,
    justifyContent: "center",
    alignItems: "center",
  },
  newCardButtonImage: {
    width: "100%",
    height: "100%",
  },
  newCardButtonText: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "500",
    color: "#ffed00",
  },
});
