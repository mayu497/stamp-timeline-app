import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    PixelifySans: require("../../assets/fonts/PixelifySans-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // ← ← ← これが重要！これがないと白いバーが出ます
        tabBarStyle: {
          backgroundColor: "#f4f0fa",
          borderTopWidth: 1,
          borderTopColor: "#ccc",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "PixelifySans",
          color: "#4a4463",
        },
        tabBarActiveTintColor: "#f28bb3",
        tabBarInactiveTintColor: "#8a8a8a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stampcard"
        options={{
          title: "StampCard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="NotificationScreen"
        options={{
          title: "NotiReaction",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
