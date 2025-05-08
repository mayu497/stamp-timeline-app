import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import { Text, View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "./toastConfig"; // カスタムトースト

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PixelifySans-Regular": require("../assets/fonts/PixelifySans-Regular.ttf"),
    "PixelifySans-Bold": require("../assets/fonts/PixelifySans-Bold.ttf"),
    "MaruMinya": require("../assets/fonts/x12y12pxMaruMinyaM.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>フォント読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      {/* タイトルバー */}
      <View style={styles.windowWrapper}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>🖥️ stampplus</Text>
        </View>
      </View>

      {/* メインコンテンツ */}
      <View style={styles.contentArea}>
        <View style={styles.fontWrapper}>
          <Slot />
        </View>
      </View>

      {/* カスタムトースト通知 */}
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#f7f4ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f4ff",
  },
  loadingText: {
    fontFamily: "MaruMinya",
    fontSize: 16,
    color: "#444",
  },
  windowWrapper: {
    borderBottomWidth: 2,
    borderColor: "#aaa",
    backgroundColor: "#d9c9e3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontFamily: "PixelifySans-Bold",
    fontSize: 16,
    color: "#333",
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 8,
  },
  fontWrapper: {
    flex: 1,
    fontFamily: "MaruMinya",
    fontWeight: "normal",
  },
});
