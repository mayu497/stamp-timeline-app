import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db, firebaseAuth } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  setDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const defaultBackground = require("../../assets/stamp/touka.png");
const windowWidth = Dimensions.get("window").width;

export default function StampCard() {
  const { uid: queryUid, stampImageUri } = useLocalSearchParams();
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [viewingUid, setViewingUid] = useState<string | null>(null);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);
  const [stamps, setStamps] = useState<{ slot: number; imageUri: string }[]>([]);
  const [allowedSlots, setAllowedSlots] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setCurrentUid(user?.uid || null);
      setViewingUid(typeof queryUid === "string" ? queryUid : user?.uid || null);
    });
    return unsubscribe;
  }, [queryUid]);

  useEffect(() => {
    if (!viewingUid) return;

    const load = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "stampSettings", viewingUid));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setBackgroundImageUri(data.selectedBackgroundImageUri || null);
        }

        const stampsRef = collection(db, "stampBoards", viewingUid, "stamps");
        const unsubscribe = onSnapshot(stampsRef, (snapshot) => {
          const loaded = snapshot.docs.map((doc) => doc.data() as { slot: number; imageUri: string });
          setStamps(loaded);
        });

        const userDoc = await getDoc(doc(db, "users", viewingUid));
        const summaryDoc = await getDoc(doc(db, "recordSummary", viewingUid, "summary", "summary"));

        if (userDoc.exists() && summaryDoc.exists()) {
          const userData = userDoc.data();
          const summaryData = summaryDoc.data();
          const conditions = userData.stampConditions || [];

          let totalUnlocked = 0;
          for (const cond of conditions) {
            const key = cond.type === "hours"
              ? "totalHours"
              : cond.type === "pages"
              ? "totalPages"
              : "totalQuestions";
            const total = summaryData[key] || 0;
            totalUnlocked += Math.floor(total / cond.value);
          }
          setAllowedSlots(totalUnlocked);
        }

        return unsubscribe;
      } catch (err) {
        console.error("🔥 読み込みエラー", err);
      }
    };

    load();
  }, [viewingUid]);

  const handleStampPress = async (slot: number) => {
    if (!viewingUid || typeof stampImageUri !== "string") return;
    try {
      const stampRef = doc(db, "stampBoards", viewingUid, "stamps", slot.toString());
      await setDoc(stampRef, {
        slot,
        imageUri: stampImageUri,
      });
      console.log("✅ スタンプを押しました: slot", slot);

      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        const senderName = currentUser.displayName || currentUser.email || "匿名ユーザー";
        await addDoc(collection(db, "notifications", viewingUid, "logs"), {
          senderName,
          timestamp: Timestamp.now(),
          imageUri: stampImageUri,
        });
        console.log("📣 通知を追加しました");
      }
    } catch (err) {
      console.error("スタンプ押下失敗:", err);
    }
  };

  const renderStampSlot = (slot: number, pageIndex: number) => {
    const globalSlot = pageIndex * 10 + slot;
    const found = stamps.find((s) => s.slot === globalSlot);
    const isUnlocked = globalSlot < allowedSlots;
    const top = `${Math.floor(slot / 5) * 45 + 5}%`;
    const left = `${(slot % 5) * 17 + 4}%`;

    return (
      <TouchableOpacity
        key={globalSlot}
        style={[styles.stampSlot, { top, left }, isUnlocked && styles.unlockedSlot]}
        onPress={() => isUnlocked && handleStampPress(globalSlot)}
      >
        {found ? (
          <Image source={{ uri: found.imageUri }} style={styles.stampImage} />
        ) : (
          <View style={styles.emptySlot} />
        )}
      </TouchableOpacity>
    );
  };

  const pageCount = Math.max(1, Math.ceil(Math.max(...stamps.map((s) => s.slot), allowedSlots - 1) / 10 + 1));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌟 スタンプカード</Text>

      <ScrollView
        horizontal
        pagingEnabled
        ref={scrollViewRef}
        onScroll={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / (windowWidth - 40));
          setCurrentPage(page);
        }}
        scrollEventThrottle={16}
        style={{ width: "100%" }}
        showsHorizontalScrollIndicator={false}
      >
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <View key={pageIndex} style={styles.boardWrapper}>
            <ImageBackground
              source={backgroundImageUri ? { uri: backgroundImageUri } : defaultBackground}
              style={styles.board}
              imageStyle={{ resizeMode: "cover", borderRadius: 12 }}
            >
              {Array.from({ length: 10 }).map((_, i) => renderStampSlot(i, pageIndex))}
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pageNumbers}>
        {Array.from({ length: pageCount }).map((_, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.pageNumberButton, currentPage === idx && styles.pageNumberActive]}
            onPress={() => {
              scrollViewRef.current?.scrollTo({ x: idx * (windowWidth - 40), animated: true });
            }}
          >
            <Text style={styles.pageNumberText}>{idx + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentUid === viewingUid && (
        <>
          <Text onPress={() => router.push("/StampManageScreen")} style={styles.link}>スタンプ管理</Text>
          <Text onPress={() => router.push("/StampGiverScreen")} style={styles.link}>スタンプを押す</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  boardWrapper: {
    width: windowWidth - 40,
    aspectRatio: 16 / 9,
    marginRight: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  board: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  stampSlot: {
    position: "absolute",
    width: "16%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedSlot: {
    borderColor: "#FFD700",
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: "#fff9e6",
  },
  stampImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  emptySlot: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  link: {
    color: "blue",
    marginTop: 16,
    textAlign: "center",
  },
  pageNumbers: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  pageNumberButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
    marginHorizontal: 4,
  },
  pageNumberActive: {
    backgroundColor: "#2196F3",
  },
  pageNumberText: {
    color: "#000",
    fontWeight: "bold",
  },
});
