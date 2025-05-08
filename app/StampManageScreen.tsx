import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db, firebaseAuth } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";

const defaultStamps = [
  "https://res.cloudinary.com/dgvd0srg2/image/upload/sumi_s4vcbu.png",
  "https://res.cloudinary.com/dgvd0srg2/image/upload/flower_wjhqdv.png",
];

const defaultBackgrounds = [
  "https://res.cloudinary.com/dgvd0srg2/image/upload/touka_zypqof.png",
];

const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

export default function StampManageScreen() {
  const [selectedStamp, setSelectedStamp] = useState<number | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<number | null>(null);
  const [customStamps, setCustomStamps] = useState<string[]>([]);
  const [customBackgrounds, setCustomBackgrounds] = useState<string[]>([]);

  useEffect(() => {
    loadSelection();
  }, []);

  const uploadToCloudinary = async (localUri: string): Promise<string | null> => {
    const formData = new FormData();
    const file =
      Platform.OS === "web"
        ? await fetch(localUri).then((res) => res.blob())
        : {
            uri: localUri,
            type: "image/jpeg",
            name: "upload.jpg",
          };

    formData.append("file", file as any);
    formData.append("upload_preset", "anon_upload");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dgvd0srg2/image/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      return json.secure_url || null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const pickImage = async (type: "stamp" | "background") => {
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
        if (type === "stamp") {
          setCustomStamps((prev) => [...prev, cloudUrl]);
        } else {
          setCustomBackgrounds((prev) => [...prev, cloudUrl]);
        }
      }
    }
  };

  const saveSelection = async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    const allStamps = [...defaultStamps, ...customStamps];
    const allBackgrounds = [...defaultBackgrounds, ...customBackgrounds];

    const stampImageUri = selectedStamp !== null ? allStamps[selectedStamp] : null;
    const backgroundImageUri = selectedBackground !== null ? allBackgrounds[selectedBackground] : null;

    await setDoc(
      doc(db, "stampSettings", uid),
      {
        selectedStampImageUri: stampImageUri,
        selectedBackgroundImageUri: backgroundImageUri,
      },
      { merge: true }
    );

    Toast.show({
      type: "success",
      text1: "保存しました！",
    });
  };

  const loadSelection = async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    const docSnap = await getDoc(doc(db, "stampSettings", uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const stampUri = data.selectedStampImageUri;
      const bgUri = data.selectedBackgroundImageUri;

      const allStamps = [...defaultStamps, ...customStamps];
      const allBackgrounds = [...defaultBackgrounds, ...customBackgrounds];

      if (stampUri) {
        const index = allStamps.indexOf(stampUri);
        if (index !== -1) setSelectedStamp(index);
      }
      if (bgUri) {
        const index = allBackgrounds.indexOf(bgUri);
        if (index !== -1) setSelectedBackground(index);
      }
    }
  };

  const renderImageRow = (
    data: string[],
    selected: number | null,
    set: (i: number) => void,
    offset = 0
  ) => (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(uri, idx) => `${offset}_${idx}`}
      renderItem={({ item, index }) => (
        <TouchableOpacity onPress={() => set(index + offset)}>
          <Image
            source={{ uri: item }}
            style={[styles.image, selected === index + offset && styles.selected]}
          />
        </TouchableOpacity>
      )}
    />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ stampmanage.exe</Text>
          <Text style={styles.closeIcon}>×</Text>
        </View>

        <Text style={styles.label}>デフォルトスタンプ</Text>
        {renderImageRow(defaultStamps, selectedStamp, setSelectedStamp)}

        <Text style={styles.label}>アップロードしたスタンプ</Text>
        {renderImageRow(customStamps, selectedStamp, setSelectedStamp, defaultStamps.length)}

        <TouchableOpacity style={styles.button} onPress={() => pickImage("stamp")}>
          <Text style={styles.buttonText}>スタンプ画像をアップロード</Text>
        </TouchableOpacity>

        <Text style={styles.label}>背景画像</Text>
        {renderImageRow(defaultBackgrounds, selectedBackground, setSelectedBackground)}

        {renderImageRow(customBackgrounds, selectedBackground, setSelectedBackground, defaultBackgrounds.length)}

        <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={saveSelection}>
          <Text style={styles.buttonText}>✅ 保存</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e5e5eb",
    padding: 10,
    flex: 1,
  },
  window: {
    backgroundColor: "#f0f0f5",
    borderWidth: 4,
    borderColor: "#666677",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    paddingBottom: 20,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#b0a0d0",
    padding: 8,
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  titleText: {
    fontFamily: enFont,
    fontSize: 16,
    color: "#fff",
  },
  closeIcon: {
    fontFamily: enFont,
    fontSize: 16,
    color: "#fff",
  },
  label: {
    fontFamily: jpFont,
    fontSize: 14,
    marginTop: 16,
    marginLeft: 10,
    color: "#333",
  },
  image: {
    width: 72,
    height: 72,
    margin: 6,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  selected: {
    borderWidth: 3,
    borderColor: "#8888a0",
  },
  button: {
    backgroundColor: "#8888a0",
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  buttonText: {
    fontFamily: jpFont,
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
