import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, firebaseAuth } from "../../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [materialList, setMaterialList] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [conditionType, setConditionType] = useState<"hours" | "pages" | "questions">("hours");
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // ✅ Firestoreにユーザー初期データを登録する関数
  const initializeUserDocument = async (user: User) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || "匿名",
        customImageUri: user.photoURL || null,
        selectedIconIndex: 0,
        goal: "",
        stampConditions: [
          { type: "hours", value: 1 },
          { type: "pages", value: 10 },
        ],
      });
      console.log("🆕 ユーザー情報をFirestoreに保存しました");
    } else {
      const existingData = docSnap.data();
      if (!existingData.stampConditions || existingData.stampConditions.length === 0) {
        await setDoc(userDocRef, {
          stampConditions: [
            { type: "hours", value: 1 },
            { type: "pages", value: 10 },
          ],
        }, { merge: true });
        console.log("✅ 既存ユーザーに stampConditions を追加しました");
      } else {
        console.log("✅ ユーザー情報はすでに存在します");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (u) => {
      if (u) {
        setUser(u);
        await initializeUserDocument(u);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user?.uid) loadMaterials();
  }, [user]);

  const saveMaterialList = async (list: string[]) => {
    try {
      const docRef = doc(db, "materials", user!.uid);
      await setDoc(docRef, { list }, { merge: true });
    } catch (error) {
      console.error("教材保存失敗:", error);
    }
  };

  const loadMaterials = async () => {
    try {
      const docRef = doc(db, "materials", user!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaterialList(data.list || []);
      }
    } catch (error) {
      console.error("教材読み込み失敗:", error);
    }
  };

  const addMaterial = () => {
    if (newMaterial.trim() === "") return;
    const updatedList = Array.from(new Set([...materialList, newMaterial.trim()]));
    setMaterialList(updatedList);
    saveMaterialList(updatedList);
    setSelectedMaterial(newMaterial.trim());
    setNewMaterial("");
  };

  const deleteMaterial = (item: string) => {
    const updatedList = materialList.filter((m) => m !== item);
    setMaterialList(updatedList);
    saveMaterialList(updatedList);
    if (selectedMaterial === item) setSelectedMaterial("");
  };

  const saveRecord = async () => {
    if (!inputValue || !selectedMaterial || !user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.exists() ? userDoc.data() : {};

      const recordData: any = {
        uid: user.uid,
        material: selectedMaterial,
        comment: comment.trim(),
        recordedAt: Timestamp.now(),
        userName: profile.name || "匿名",
        iconUri: profile.customImageUri || null,
        selectedIconIndex: profile.selectedIconIndex ?? 0,
      };

      const value = parseFloat(inputValue);
      if (conditionType === "hours") recordData.hours = value;
      else if (conditionType === "pages") recordData.pages = value;
      else if (conditionType === "questions") recordData.questions = value;

      const recordRef = doc(db, "records", uuidv4());
      await setDoc(recordRef, recordData);

      const summaryRef = doc(db, "recordSummary", user.uid, "summary", "summary");
      await setDoc(summaryRef, {
        totalHours: conditionType === "hours" ? increment(value) : increment(0),
        totalPages: conditionType === "pages" ? increment(value) : increment(0),
        totalQuestions: conditionType === "questions" ? increment(value) : increment(0),
      }, { merge: true });

      setInputValue("");
      setComment("");
      router.push("/timeline");
    } catch (error) {
      console.error("記録保存エラー:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📚 勉強記録</Text>

      <Text>教材を追加してください</Text>
      <TextInput
        style={styles.input}
        placeholder="新しい教材名を入力"
        value={newMaterial}
        onChangeText={setNewMaterial}
      />
      <Button title="教材を追加" onPress={addMaterial} />

      <Text style={styles.label}>教材を選択してください</Text>
      {materialList.map((item, index) => (
        <View key={index} style={styles.materialRow}>
          <TouchableOpacity onPress={() => setSelectedMaterial(item)}>
            <Text
              style={[
                styles.materialItem,
                selectedMaterial === item && styles.selectedMaterial,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteMaterial(item)}>
            <Text style={styles.trash}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.label}>記録の種類を選んでください</Text>
      <Picker
        selectedValue={conditionType}
        onValueChange={(itemValue) => setConditionType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="時間（hours）" value="hours" />
        <Picker.Item label="ページ数（pages）" value="pages" />
        <Picker.Item label="問題数（questions）" value="questions" />
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="勉強量を入力"
        keyboardType="numeric"
        value={inputValue}
        onChangeText={setInputValue}
      />

      <TextInput
        style={styles.input}
        placeholder="コメント（任意）"
        value={comment}
        onChangeText={setComment}
      />

      <Button title="記録する" onPress={saveRecord} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  picker: {
    marginBottom: 20,
    backgroundColor: "#eee",
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  materialItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    flex: 1,
  },
  selectedMaterial: {
    backgroundColor: "#cde",
    borderColor: "#00f",
  },
  trash: {
    marginLeft: 10,
    fontSize: 18,
    color: "red",
  },
});
