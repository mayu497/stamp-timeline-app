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

const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

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
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.windowTitle}>🖨️ stamp-give.exe</Text>
          <Text style={styles.closeButton}>✕</Text>
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentArea}
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
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name || "匿名"}</Text>
                {item.unstampedCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unstampedCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  !selectedStampImageUri && styles.buttonDisabled,
                ]}
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
                  {selectedStampImageUri ? "スタンプを押す" : "未選択"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e5e5eb",
    flex: 1,
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
    backgroundColor: "#b0a0d0",
    padding: 8,
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  windowTitle: {
    fontFamily: enFont,
    fontSize: 14,
    color: "#fff",
  },
  closeButton: {
    fontFamily: enFont,
    fontSize: 16,
    color: "#fff",
  },
  contentArea: {
    padding: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  name: {
    fontFamily: jpFont,
    fontSize: 14,
    color: "#333",
  },
  badge: {
    backgroundColor: "#d95e9b",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: jpFont,
    color: "#fff",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#7745c7",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: "#bbb",
  },
  buttonText: {
    fontFamily: jpFont,
    fontSize: 13,
    color: "#fff",
  },
});
