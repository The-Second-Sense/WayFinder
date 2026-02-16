import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface FavoriteAvatarProps {
  name: string;
  imageURL: string;
}

const FavoriteAvatar = ({ name, imageURL }: FavoriteAvatarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageURL }} style={styles.avatarImage} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: 10, // Mai mult spațiu între avatare
    width: 70, // Lățime fixă pentru a alinia textele frumos
  },
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3, // Creează efectul de "ring" în jurul pozei
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FFED00", // Galbenul tău principal
    justifyContent: "center",
    alignItems: "center",
    // Umbră subtilă pentru adâncime
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F5F5F5", // Placeholder până se încarcă poza
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
});

export default FavoriteAvatar;
