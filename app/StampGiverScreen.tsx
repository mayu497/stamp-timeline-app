import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { db, firebaseAuth } from "../firebase/firebase";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function StampGiverScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedStampImageUri, setSelectedStampImageUri] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersWithStatus = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const userData = { id: docSnap.id, ...docSnap.data() };
          const summaryRef = doc(db, "recordSummary", docSnap.id, "summary", "summary");
          const summarySnap = await getDoc(summaryRef);
          const summary = summarySnap.exists() ? summarySnap.data() : {};

          const boardSnap = await getDocs(collection(db, "stampBoards", docSnap.id, "stamps"));
          const stampedCount = boardSnap.size;

          let unlocked = 0;
          for (const cond of userData.stampConditions || []) {
            const val = cond.type === "hours" ? summary.totalHours
                      : cond.type === "pages" ? summary.totalPages
                      : summary.totalQuestions;
            if (val && cond.value) {
              unlocked += Math.floor(val / cond.value);
            }
          }

          return {
            ...userData,
            unstampedCount: Math.max(unlocked - stampedCount, 0),
          };
        })
      );

      setUsers(usersWithStatus);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchSelectedStamp = async () => {
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, "stampSettings", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedStampImageUri(data.selectedStampImageUri || null);
      }
    };
    fetchSelectedStamp();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 他のユーザーにスタンプを押す</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Image
              source={
                item.customImageUri
                  ? { uri: item.customImageUri }
                  : require("../assets/images/cat.png")
              }
              style={styles.icon}
            />
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={styles.name}>{item.name || "匿名"}</Text>
              {item.unstampedCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unstampedCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push(
                  `/stampcard?uid=${item.id}&stampImageUri=${encodeURIComponent(
                    selectedStampImageUri || ""
                  )}`
                )
              }
              disabled={!selectedStampImageUri}
            >
              <Text style={styles.buttonText}>
                {selectedStampImageUri ? "スタンプを押す" : "スタンプ未選択"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 50, backgroundColor: "#fff", flex: 1 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  icon: { width: 40, height: 40, borderRadius: 20 },
  name: { fontSize: 16 },
  button: { backgroundColor: "blue", padding: 10, borderRadius: 5 },
  buttonText: { color: "white" },
  badge: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
