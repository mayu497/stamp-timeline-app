// components/ui/TabBarBackground.tsx
import React from "react";
import { View, StyleSheet } from "react-native";

export default function TabBarBackground() {
  return <View style={styles.background} />;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
