import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { BaseToastProps } from "react-native-toast-message";
import Toast from "react-native-toast-message";

export const toastConfig = {
  success: ({ text1 }: BaseToastProps) => (
    <ToastWindow title="🖥️ stampplus.exe" icon="stream-icon.png" main="Success" text1={text1} />
  ),
  info: ({ text1 }: BaseToastProps) => (
    <ToastWindow title="🖥️ info.exe" icon="stream-icon.png" main="情報" text1={text1} />
  ),
  error: ({ text1 }: BaseToastProps) => (
    <ToastWindow title="🖥️ error.exe" icon="stream-icon.png" main="エラー" text1={text1} />
  ),
};

// 共通ウィンドウデザイン
function ToastWindow({
  title,
  icon,
  main,
  text1,
}: {
  title: string;
  icon: string;
  main: string;
  text1?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <Text style={styles.windowTitle}>{title}</Text>
        <Text style={styles.closeButton}>✕</Text>
      </View>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/stream-icon.png")}
          style={styles.icon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{main}</Text>
          <Text style={styles.subtitle}>{text1}</Text>
          <Pressable style={styles.okButton} onPress={() => Toast.hide()}>
            <Text style={styles.okText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: "#f0f0f8",
    borderWidth: 2,
    borderColor: "#888",
    borderRadius: 6,
    marginHorizontal: 10,
    marginTop: 20,
    overflow: "hidden",
  },
  titleBar: {
    backgroundColor: "#b0a0d0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  windowTitle: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 12,
    color: "#fff",
  },
  closeButton: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 14,
    color: "#fff",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  title: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 13,
    color: "#333",
  },
  subtitle: {
    fontFamily: "MaruMinya",
    fontSize: 14,
    fontWeight: "normal",
    color: "#444",
    backgroundColor: "#f5dae5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  okButton: {
    backgroundColor: "#dcdcdc",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#aaa",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  okText: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 13,
    color: "#333",
  },
});
