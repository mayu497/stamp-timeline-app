// app/[userId].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { db } from "../../firebase/firebase";
import { doc, getDoc, arrayUnion, setDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const STAMPS_PER_PAGE = 30;

const starImage = require("../../assets/stamp/flower.png");
const sumiImage = require("../../assets/stamp/sumi.png");

const iconMap: Record<string, any> = {
  star: starImage,
  sumi: sumiImage,
};

type StampData = {
  index: number;
  imageUri: string;
};

export default function OtherUserStampCardScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [totalSlots, setTotalSlots] = useState(0);
  const [stamps, setStamps] = useState<StampData[]>([]);

  useEffect(() => {
    if (userId) {
      loadSummary(userId);
      loadStamps(userId);
    }
  }, [userId]);

  const loadSummary = async (userId: string) => {
    try {
      const summaryRef = doc(db, "recordSummary", userId);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        const data = summarySnap.data();
        const totalHours = data.totalHours || 0;
        const totalPages = data.totalPages || 0;
        const totalQuestions = data.totalQuestions || 0;

        const totalAchievements = totalHours + totalPages + totalQuestions;
        setTotalSlots(Math.floor(totalAchievements));
      } else {
        setTotalSlots(0);
      }
    } catch (error) {
      console.error("🔥 スタンプカード読み込みエラー:", error);
    }
  };

  const loadStamps = async (userId: string) => {
    try {
      const stampsRef = doc(db, "stampData", userId);
      const stampsSnap = await getDoc(stampsRef);

      if (stampsSnap.exists()) {
        const data = stampsSnap.data();
        setStamps(data.stamps || []);
      } else {
        setStamps([]);
      }
    } catch (error) {
      console.error("🔥 スタンプデータ読み込みエラー:", error);
    }
  };

  const handlePressSlot = async (slotIndex: number) => {
    if (stamps.find((s) => s.index === slotIndex)) return;

    try {
      const imageUri = Platform.OS === "web" ? "sumi" : Image.resolveAssetSource(sumiImage).uri;

      const stampsRef = doc(db, "stampData", userId);

      await setDoc(
        stampsRef,
        { stamps: arrayUnion({ index: slotIndex, imageUri }) },
        { merge: true }
      );

      setStamps((prev) => [...prev, { index: slotIndex, imageUri }]);

      Alert.alert("🎉 スタンプを押しました！");
    } catch (error) {
      console.error("🔥 スタンプ押しエラー:", error);
      Alert.alert("エラー", "スタンプを押すのに失敗しました");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalSlots / STAMPS_PER_PAGE));

  const pageData = Array.from({ length: totalPages }, (_, pageIndex) => {
    const start = pageIndex * STAMPS_PER_PAGE;
    return Array.from({ length: STAMPS_PER_PAGE }).map((_, index) => ({
      index: start + index,
      unlocked: start + index < totalSlots,
      stamped: stamps.find((s) => s.index === start + index),
    }));
  });

  return (
    <FlatList
      data={pageData}
      keyExtractor={(_, index) => index.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <View style={styles.page}>
          <Text style={styles.pageTitle}>📖 {index + 1}ページ目</Text>
          <View style={styles.board}>
            {item.map((slot) => (
              <TouchableOpacity
                key={slot.index}
                style={styles.slot}
                onPress={() => slot.unlocked && !slot.stamped && handlePressSlot(slot.index)}
              >
                {slot.stamped ? (
                  <Image
                    source={
                      Platform.OS === "web"
                        ? iconMap[slot.stamped.imageUri]
                        : { uri: slot.stamped.imageUri }
                    }
                    style={styles.stamp}
                  />
                ) : (
                  <View style={slot.unlocked ? styles.unlocked : styles.locked} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    width: width,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  pageTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold",
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    justifyContent: "center",
  },
  slot: {
    width: 50,
    height: 50,
    margin: 5,
    borderRadius: 8,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  unlocked: {
    width: 40,
    height: 40,
    backgroundColor: "#ffd700",
    borderRadius: 8,
  },
  locked: {
    width: 40,
    height: 40,
    backgroundColor: "#bbb",
    borderRadius: 8,
  },
  stamp: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
