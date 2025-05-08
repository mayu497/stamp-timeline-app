// components/CustomToast.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const CustomToast = ({ text1 }: any) => (
  <View style={styles.toastContainer}>
    <Text style={styles.header}>Epiphany</Text>
    <View style={styles.content}>
      <Text style={styles.message}>{text1}</Text>
      <Text style={styles.okButton}>OK</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  toastContainer: {
    backgroundColor: "#f3f3f3",
    borderColor: "#999",
    borderWidth: 2,
    padding: 10,
    width: 260,
    alignSelf: "center",
    marginTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  header: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 14,
    backgroundColor: "#d8d8e0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: "#333",
    marginBottom: 8,
  },
  content: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  message: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 13,
    marginBottom: 8,
    color: "#444",
  },
  okButton: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 12,
    alignSelf: "flex-end",
    color: "#666",
  },
});
