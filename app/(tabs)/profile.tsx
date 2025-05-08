import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { firebaseAuth, db } from "../../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile, signOut, deleteUser } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import cat from "../../assets/images/cat.png";
import rabbit from "../../assets/images/rabbit.png";
import penguin from "../../assets/images/penguin.png";

const defaultIcons = [cat, rabbit, penguin];
const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [stampConditions, setStampConditions] = useState<{ type: "hours" | "pages" | "questions"; value: number }[]>([]);
  const [newType, setNewType] = useState<"hours" | "pages" | "questions">("hours");
  const [newValue, setNewValue] = useState("1");

  useEffect(() => {
    loadProfile();
  }, []);

  const uploadToCloudinary = async (localUri: string): Promise<string | null> => {
    const formData = new FormData();
    if (Platform.OS === "web") {
      const blob = await fetch(localUri).then((res) => res.blob());
      formData.append("file", blob);
    } else {
      formData.append("file", {
        uri: localUri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);
    }
    formData.append("upload_preset", "anon_upload");
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dgvd0srg2/image/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      return json.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const cloudUrl = await uploadToCloudinary(uri);
      if (cloudUrl) setCustomImageUri(cloudUrl);
    }
  };

  const saveProfile = async () => {
    if (!firebaseAuth.currentUser) return;
    const uid = firebaseAuth.currentUser.uid;
    await setDoc(doc(db, "users", uid), {
      name,
      goal,
      selectedIconIndex,
      customImageUri,
      stampConditions,
    }, { merge: true });

    await updateProfile(firebaseAuth.currentUser, { displayName: name });
    Toast.show({
      type: "success",
      text1: "プロフィールを保存しました！",
    });
  };

  const loadProfile = async () => {
    if (!firebaseAuth.currentUser) return;
    const uid = firebaseAuth.currentUser.uid;
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setName(data.name || "");
      setGoal(data.goal || "");
      setCustomImageUri(data.customImageUri || null);
      setSelectedIconIndex(typeof data.selectedIconIndex === "number" ? data.selectedIconIndex : 0);
      setStampConditions(Array.isArray(data.stampConditions) ? data.stampConditions : []);
    }
  };

  const addCondition = () => {
    const valueNum = parseFloat(newValue);
    if (!valueNum || valueNum <= 0) return;
    setStampConditions([...stampConditions, { type: newType, value: valueNum }]);
    setNewValue("1");
    setNewType("hours");
  };

  const deleteCondition = (index: number) => {
    setStampConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    Toast.show({
      type: "info",
      text1: "ログアウトしました",
    });
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
        Toast.show({
          type: "success",
          text1: "アカウントを削除しました",
        });
        router.replace("/signup");
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "削除に失敗しました",
          text2: err.message,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ profile.exe</Text>
          <Text style={styles.closeIcon}>×</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 10 }}>
          <Text style={styles.label}>ニックネーム</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>目標</Text>
          <TextInput style={styles.input} value={goal} onChangeText={setGoal} />
          <Text style={styles.label}>アイコンを選ぶ</Text>
          <FlatList
            horizontal
            data={defaultIcons}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => { setSelectedIconIndex(index); setCustomImageUri(null); }}>
                <Image source={item} style={[styles.icon, selectedIconIndex === index && !customImageUri && styles.selectedIcon]} />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadText}>自分の画像をアップロード</Text>
          </TouchableOpacity>
          {customImageUri && (
            <TouchableOpacity style={[styles.uploadButton, styles.dangerButton]} onPress={() => setCustomImageUri(null)}>
              <Text style={styles.uploadText}>デフォルトに戻す（画像削除）</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.label}>選択中のアイコン</Text>
          <Image source={customImageUri ? { uri: customImageUri } : defaultIcons[selectedIconIndex]} style={[styles.iconLarge, { alignSelf: "center" }]} />
          <Text style={styles.label}>スタンプの条件（複数可）</Text>
          {stampConditions.map((cond, idx) => (
            <View key={idx} style={styles.conditionRow}>
              <Text style={styles.conditionText}>
                {cond.type === "hours" ? "時間" : cond.type === "pages" ? "ページ数" : "問題数"}: {cond.value}
              </Text>
              <TouchableOpacity onPress={() => deleteCondition(idx)}><Text style={{ color: "red" }}>🗑️</Text></TouchableOpacity>
            </View>
          ))}
          <View style={styles.radioContainer}>
            {["hours", "pages", "questions"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewType(type as any)}
                style={[styles.radioButton, newType === type && styles.radioButtonActive]}
              >
                <Text style={styles.radioText}>
                  {type === "hours" ? "時間" : type === "pages" ? "ページ数" : "問題数"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={newValue} onChangeText={setNewValue} keyboardType="numeric" placeholder="数値を入力" />
          <TouchableOpacity style={styles.uploadButton} onPress={addCondition}>
            <Text style={styles.uploadText}>＋ 条件を追加</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={saveProfile}>
            <Text style={styles.uploadText}>プロフィールを保存</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadButton, styles.dangerButton]} onPress={handleLogout}>
            <Text style={styles.uploadText}>ログアウト</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadButton, styles.dangerButton]} onPress={handleDeleteAccount}>
            <Text style={styles.uploadText}>アカウントを削除</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#e5e5eb", flex: 1, padding: 10 },
  window: {
    borderWidth: 4,
    borderColor: "#666677",
    backgroundColor: "#f0f0f5",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    flex: 1,
    marginHorizontal: 10,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#8888a0",
    padding: 8,
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  titleText: { fontFamily: enFont, fontSize: 16, color: "#fff" },
  closeIcon: { fontFamily: enFont, fontSize: 16, color: "#fff" },
  label: { fontFamily: jpFont, marginTop: 10, fontSize: 14 },
  input: {
    backgroundColor: "#f4f4f4",
    fontFamily: jpFont,
    fontSize: 14,
    padding: 10,
    borderRadius: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  icon: { width: 60, height: 60, margin: 5, borderRadius: 30 },
  selectedIcon: { borderWidth: 2, borderColor: "#8888a0" },
  iconLarge: { width: 100, height: 100, borderRadius: 50, marginTop: 10, marginBottom: 20 },
  conditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  conditionText: { fontFamily: jpFont, fontSize: 14 },
  uploadButton: {
    backgroundColor: "#8888a0",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  dangerButton: { backgroundColor: "#e88" },
  uploadText: { textAlign: "center", color: "#fff", fontFamily: jpFont },
  radioContainer: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
  radioButton: { backgroundColor: "#ccc", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  radioButtonActive: { backgroundColor: "#666677" },
  radioText: { fontFamily: jpFont, color: "#fff" },
});