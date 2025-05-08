import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, firebaseAuth } from "../../firebase/firebase";

const defaultIcons = [
  require("../../assets/images/cat.png"),
  require("../../assets/images/rabbit.png"),
  require("../../assets/images/penguin.png"),
];

const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

interface RecordData {
  id: string;
  material: string;
  hours?: number;
  pages?: number;
  questions?: number;
  comment?: string;
  recordedAt: any;
  userName?: string;
  iconUri?: string;
  selectedIconIndex?: number;
  uid?: string;
}

export default function TimelineScreen() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "records"), orderBy("recordedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RecordData, "id">),
      }));

      setRecords(
        data.sort((a, b) => {
          const aTime = a.recordedAt?.toDate?.()?.getTime?.() ?? -Infinity;
          const bTime = b.recordedAt?.toDate?.()?.getTime?.() ?? -Infinity;
          return bTime - aTime;
        })
      );
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, recordUid?: string) => {
    try {
      if (!user?.uid || user.uid !== recordUid) {
        alert("自分の記録のみ削除できます");
        return;
      }

      const recordRef = doc(db, "records", id);
      const snapshot = await getDoc(recordRef);
      const data = snapshot.data();
      if (!data) return;

      const summaryRef = doc(db, "recordSummary", user.uid, "summary", "summary");

      await deleteDoc(recordRef);

      await updateDoc(summaryRef, {
        ...(data.hours != null && { totalHours: increment(-data.hours) }),
        ...(data.pages != null && { totalPages: increment(-data.pages) }),
        ...(data.questions != null && { totalQuestions: increment(-data.questions) }),
      });
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ timeline.exe</Text>
          <Text style={styles.closeIcon}>×</Text>
        </View>

        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentArea}
          renderItem={({ item }) => (
            <View style={styles.recordRow}>
              <Image
                source={
                  item.iconUri
                    ? { uri: item.iconUri }
                    : defaultIcons[item.selectedIconIndex ?? 0]
                }
                style={styles.iconLarge}
              />
              <View style={styles.recordContent}>
                <Text style={styles.name}>{item.userName || "匿名"}</Text>
                <Text style={styles.time}>
                  ⏰ {item.recordedAt?.toDate?.().toLocaleString("ja-JP", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) ?? ""}
                </Text>
                <Text style={styles.text}>📚 教材: {item.material}</Text>
                <View style={{ flexDirection: "column" }}>
  {item.hours != null && (
    <Text style={styles.text}>🕒 {item.hours} 時間</Text>
  )}
  {item.pages != null && (
    <Text style={styles.text}>📖 {item.pages} ページ</Text>
  )}
  {item.questions != null && (
    <Text style={styles.text}>📝 {item.questions} 問</Text>
  )}
</View>

                {item.comment && <Text style={styles.comment}>💬 {item.comment}</Text>}
                {item.uid === user?.uid && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id, item.uid)}
                  >
                    <Text style={styles.deleteText}>🗑️ 削除</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e5eb",
    padding: 10,
  },
  window: {
    flex: 1,
    backgroundColor: "#f0f0f5",
    borderWidth: 4,
    borderColor: "#666677",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#8888a0",
    padding: 8,
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  titleText: {
    fontFamily: "PixelifySans-Regular", // タイトルバーのみ英語フォント
    fontSize: 16,
    color: "#fff",
  },
  closeIcon: {
    fontFamily: "PixelifySans-Regular",
    fontSize: 16,
    color: "#fff",
  },
  contentArea: {
    padding: 12,
  },
  recordRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbb",
    alignItems: "flex-start",
  },
  iconLarge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  recordContent: {
    flex: 1,
  },
  name: {
    fontFamily: "MaruMinya",
    fontSize: 14,
    marginBottom: 4,
    color: "#3b3355",
  },
  time: {
    fontFamily: "MaruMinya",
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  text: {
    fontFamily: "MaruMinya",
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  comment: {
    fontFamily: "MaruMinya",
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 6,
    alignSelf: "flex-end",
    backgroundColor: "#f4d6d6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderColor: "#d88",
    borderWidth: 1,
  },
  deleteText: {
    fontFamily: "MaruMinya",
    fontSize: 12,
    color: "#a00",
    fontWeight: "bold",
  },
});
