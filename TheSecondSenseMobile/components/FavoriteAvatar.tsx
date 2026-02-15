import { Image, StyleSheet, Text, View } from "react-native";

interface FavoriteAvatarProps {
  name: string; // Numele trebuie să fie un text
  imageURL: string; // URL-ul imaginii trebuie să fie tot un text
}
const FavoriteAvatar = ({ name, imageURL }: FavoriteAvatarProps) => {
  return (
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: imageURL }}
        style={{ width: 50, height: 50, borderRadius: 25 }}
      />
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAB308",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  name: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
});

export default FavoriteAvatar;
