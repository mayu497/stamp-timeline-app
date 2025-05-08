import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";
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
      console.log("✅ onAuthStateChanged:", u);
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // userがnullでも全体タイムラインは読み込めるようにする
    const q = query(collection(db, "records"), orderBy("recordedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RecordData, "id">),
      }));

      console.log("🔥 クエリ結果", data);

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

      console.log("✅ 削除と更新完了");
    } catch (error) {
      console.error("🔥 削除エラー:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 タイムライン</Text>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
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
                ⏰{" "}
                {item.recordedAt?.toDate?.().toLocaleString("ja-JP", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }) ?? ""}
              </Text>
              <Text style={styles.text}>📚 教材: {item.material}</Text>
              <Text style={styles.text}>
                {item.hours != null && `🕒 ${item.hours} 時間 `}
                {item.pages != null && `📖 ${item.pages} ページ `}
                {item.questions != null && `📝 ${item.questions} 問`}
              </Text>
              {item.comment && <Text style={styles.comment}>💬 {item.comment}</Text>}
              {item.uid === user?.uid && (
                <Text
                  style={styles.delete}
                  onPress={() => handleDelete(item.id, item.uid)}
                >
                  🗑️
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  recordRow: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  iconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  recordContent: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  text: {
    marginBottom: 5,
  },
  comment: {
    marginTop: 5,
    fontStyle: "italic",
    color: "#666",
  },
  delete: {
    marginTop: 5,
    color: "red",
    textAlign: "right",
  },
});
