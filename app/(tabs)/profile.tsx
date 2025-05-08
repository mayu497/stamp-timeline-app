import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { firebaseAuth, db } from "../../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile, signInWithEmailAndPassword, signOut } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

import cat from "../../assets/images/cat.png";
import rabbit from "../../assets/images/rabbit.png";
import penguin from "../../assets/images/penguin.png";

const defaultIcons = [cat, rabbit, penguin];

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [stampConditions, setStampConditions] = useState<
    { type: "hours" | "pages" | "questions"; value: number }[]
  >([]);
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
      console.error("❌ Cloudinary upload error:", err);
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
      if (cloudUrl) {
        setCustomImageUri(cloudUrl);
        alert("✅ Cloudinaryにアップロード成功！");
      } else {
        alert("❌ アップロード失敗");
      }
    }
  };

  const saveProfile = async () => {
    if (!firebaseAuth.currentUser) return;

    const userDocRef = doc(db, "users", firebaseAuth.currentUser.uid);
    await setDoc(
      userDocRef,
      {
        name,
        goal,
        customImageUri,
        selectedIconIndex,
        stampConditions,
      },
      { merge: true }
    );

    await updateProfile(firebaseAuth.currentUser, {
      displayName: name,
      photoURL: customImageUri ?? undefined,
    });

    alert("✅ プロフィールを保存しました！");
  };

  const loadProfile = async () => {
    if (!firebaseAuth.currentUser) return;

    const userDocRef = doc(db, "users", firebaseAuth.currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setName(data.name || "");
      setGoal(data.goal || "");
      setCustomImageUri(data.customImageUri || null);
      if (typeof data.selectedIconIndex === "number") {
        setSelectedIconIndex(data.selectedIconIndex);
      }
      if (Array.isArray(data.stampConditions)) {
        setStampConditions(data.stampConditions);
      }
    }
  };

  const addCondition = () => {
    const valueNum = parseFloat(newValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      alert("正しい数値を入力してください");
      return;
    }
    setStampConditions((prev) => [...prev, { type: newType, value: valueNum }]);
    setNewValue("1");
    setNewType("hours");
  };

  const deleteCondition = (index: number) => {
    setStampConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const switchToEmailAuth = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください！");
      return;
    }
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      alert("✅ メールでログインしました！");
    } catch (error: any) {
      console.error("🔥 メール認証エラー:", error.message);
      alert("メール認証に失敗しました");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      alert("ログアウトしました");
      router.replace("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>プロフィール設定</Text>

      <Text>ニックネーム</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="名前を入力" />

      <Text>目標</Text>
      <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="目標を入力" />

      <Text>アイコンを選ぶ</Text>
      <FlatList
        horizontal
        data={defaultIcons}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedIconIndex(index);
              setCustomImageUri(null);
            }}
          >
            <Image
              source={item}
              style={[
                styles.icon,
                selectedIconIndex === index && customImageUri === null && styles.selectedIcon,
              ]}
            />
          </TouchableOpacity>
        )}
      />

      <Button title="自分の画像をアップロード" onPress={pickImage} />
      {customImageUri && (
        <View style={{ marginTop: 10 }}>
          <Button title="デフォルトに戻す（画像削除）" onPress={() => setCustomImageUri(null)} color="red" />
        </View>
      )}

      <Text style={{ marginTop: 10 }}>選択中のアイコン</Text>
      <Image
        source={customImageUri ? { uri: customImageUri } : defaultIcons[selectedIconIndex]}
        style={styles.iconLarge}
      />

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>スタンプの条件（複数可）</Text>

      {stampConditions.map((cond, idx) => (
        <View key={idx} style={styles.conditionRow}>
          <Text>
            {cond.type === "hours"
              ? "時間"
              : cond.type === "pages"
              ? "ページ"
              : "問題数"}: {cond.value}
          </Text>
          <TouchableOpacity onPress={() => deleteCondition(idx)}>
            <Text style={{ color: "red" }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ backgroundColor: "#eee", marginTop: 10 }}>
        <Picker selectedValue={newType} onValueChange={setNewType}>
          <Picker.Item label="時間" value="hours" />
          <Picker.Item label="ページ数" value="pages" />
          <Picker.Item label="問題数" value="questions" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        value={newValue}
        onChangeText={setNewValue}
        placeholder="数値を入力"
        keyboardType="numeric"
      />
      <Button title="＋ 条件を追加" onPress={addCondition} />

      <Button title="プロフィールを保存" onPress={saveProfile} />

      <View style={styles.divider} />

      <Text>✉️ メールでログインする</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="メールアドレス"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="パスワード"
        secureTextEntry
      />
      <Button title="メールでログイン" onPress={switchToEmailAuth} />

      <View style={styles.divider} />
      <Button title="ログアウト" onPress={handleLogout} color="red" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  icon: {
    width: 60,
    height: 60,
    margin: 5,
    borderRadius: 30,
  },
  selectedIcon: {
    borderWidth: 2,
    borderColor: "blue",
  },
  iconLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
    marginBottom: 20,
  },
  divider: {
    height: 2,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
  conditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
});
