import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
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

const windowWidth = Dimensions.get("window").width;
const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

export default function HomeScreen() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [materialList, setMaterialList] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [conditionType, setConditionType] = useState<"hours" | "pages" | "questions">("hours");
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<User | null>(null);

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
    const docRef = doc(db, "materials", user!.uid);
    await setDoc(docRef, { list }, { merge: true });
  };

  const loadMaterials = async () => {
    const docRef = doc(db, "materials", user!.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setMaterialList(data.list || []);
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
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const profile = userDoc.exists() ? userDoc.data() : {};
    const value = parseFloat(inputValue);

    const recordData: any = {
      uid: user.uid,
      material: selectedMaterial,
      comment: comment.trim(),
      recordedAt: Timestamp.now(),
      userName: profile.name || "匿名",
      iconUri: profile.customImageUri || null,
      selectedIconIndex: profile.selectedIconIndex ?? 0,
      [conditionType]: value,
    };

    await setDoc(doc(db, "records", uuidv4()), recordData);

    const summaryRef = doc(db, "recordSummary", user.uid, "summary", "summary");
    await setDoc(summaryRef, {
      totalHours: conditionType === "hours" ? increment(value) : increment(0),
      totalPages: conditionType === "pages" ? increment(value) : increment(0),
      totalQuestions: conditionType === "questions" ? increment(value) : increment(0),
    }, { merge: true });

    setInputValue("");
    setComment("");
    router.push("/timeline");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ <Text style={styles.en}>home.exe</Text></Text>
          <Text style={styles.en}>×</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.heading}>📚 勉強記録</Text>

          <Text style={styles.label}>教材を追加してください</Text>
          <TextInput
            style={styles.input}
            placeholder="新しい教材名を入力"
            value={newMaterial}
            onChangeText={setNewMaterial}
          />
          <TouchableOpacity style={styles.button} onPress={addMaterial}>
            <Text style={styles.buttonText}>＋ 教材を追加</Text>
          </TouchableOpacity>

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
          <View style={styles.radioContainer}>
            {["hours", "pages", "questions"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setConditionType(type as any)}
                style={[
                  styles.radioButton,
                  conditionType === type && styles.radioButtonSelected,
                ]}
              >
                <Text style={styles.radioLabel}>
                  {type === "hours"
                    ? "時間（hours）"
                    : type === "pages"
                    ? "ページ数（pages）"
                    : "問題数（questions）"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <TouchableOpacity style={styles.button} onPress={saveRecord}>
            <Text style={styles.buttonText}>▶ 記録する</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e5e5eb",
    flex: 1,
  },
  window: {
    margin: 20,
    borderWidth: 4,
    borderColor: "#666677",
    backgroundColor: "#f0f0f5",
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
    fontFamily: jpFont,
    fontSize: 16,
    color: "#ffffff",
  },
  en: {
    fontFamily: enFont,
    fontSize: 16,
    fontWeight: "normal",
    color: "#ffffff",
  },
  body: {
    padding: 16,
  },
  heading: {
    fontFamily: jpFont,
    fontSize: 18,
    color: "#3b3355",
    marginBottom: 12,
  },
  label: {
    fontFamily: jpFont,
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
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
  radioContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: "#aaa",
    backgroundColor: "#f4f4f4",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  radioButtonSelected: {
    backgroundColor: "#c4c4d4",
    borderColor: "#3b3355",
  },
  radioLabel: {
    fontFamily: jpFont,
    fontSize: 14,
    color: "#3b3355",
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  materialItem: {
    fontFamily: jpFont,
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    flex: 1,
  },
  selectedMaterial: {
    backgroundColor: "#d6d6f5",
    borderColor: "#3b3355",
  },
  trash: {
    fontSize: 18,
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#c4c4d4",
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#666677",
    borderRadius: 4,
    marginBottom: 10,
  },
  buttonText: {
    fontFamily: jpFont,
    fontWeight: "normal",
    fontSize: 14,
    textAlign: "center",
    color: "#3b3355",
  },
});