import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import { firebaseAuth, db } from "../../firebase/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

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
        <Text style={styles.text}>{item.senderName} さんがスタンプを押しました</Text>
        <Text style={styles.timestamp}>
          {item.timestamp?.toDate?.().toLocaleString?.() ?? "不明な時間"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 通知一覧</Text>
      <FlatList
        data={notifications}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>通知はまだありません</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  notificationImage: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  placeholderImage: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  text: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
});
