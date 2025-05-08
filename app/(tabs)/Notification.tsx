import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { firebaseAuth, db } from "../../firebase/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

const windowWidth = Dimensions.get("window").width;
const jaFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const currentUser = firebaseAuth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications", currentUser.uid, "logs"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.notificationImage} />
      ) : (
        <View style={styles.placeholderImage} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={styles.name}>{item.senderName}</Text>
          <Text style={styles.text}> さんがスタンプを押しました</Text>
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp?.toDate?.().toLocaleString?.() ?? "不明な時間"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={[styles.title, styles.exeFont]}>🔔 Notification.exe</Text>
          <Text style={[styles.close, styles.exeFont]}>×</Text>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>通知はまだありません</Text>
          }
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
    borderWidth: 4,
    borderColor: "#666677",
    backgroundColor: "#f0f0f5",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    flex: 1,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#8888a0",
    padding: 8,
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  title: {
    fontSize: 16,
    color: "#fff",
  },
  close: {
    fontSize: 16,
    color: "#fff",
  },
  exeFont: {
    fontFamily: enFont,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#999",
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    marginHorizontal: 8,
    shadowColor: "#666",
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 2,
  },
  notificationImage: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "#eee",
  },
  placeholderImage: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  text: {
    fontFamily: jaFont,
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  name: {
    fontFamily: jaFont,
    fontSize: 14,
    color: "#d95e9b",
  },
  timestamp: {
    fontFamily: jaFont,
    fontSize: 12,
    color: "#777",
  },
  empty: {
    fontFamily: jaFont,
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 14,
  },
});
