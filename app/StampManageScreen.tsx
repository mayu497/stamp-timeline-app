import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
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

const defaultStamps = [
  "https://res.cloudinary.com/dgvd0srg2/image/upload/sumi_s4vcbu.png",
  "https://res.cloudinary.com/dgvd0srg2/image/upload/flower_wjhqdv.png",
];

const defaultBackgrounds = [
  "https://res.cloudinary.com/dgvd0srg2/image/upload/touka_zypqof.png",
];

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

    alert("✅ 保存しました");
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>スタンプと背景を選択</Text>

      <Text>デフォルトスタンプ</Text>
      <FlatList
        horizontal
        data={defaultStamps}
        keyExtractor={(uri, idx) => `d${idx}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setSelectedStamp(index)}>
            <Image
              source={{ uri: item }}
              style={[styles.image, selectedStamp === index && styles.selected]}
            />
          </TouchableOpacity>
        )}
      />

      <Text>アップロードしたスタンプ</Text>
      <FlatList
        horizontal
        data={customStamps}
        keyExtractor={(uri, idx) => `c${idx}`}
        renderItem={({ item, index }) => {
          const fullIndex = defaultStamps.length + index;
          return (
            <TouchableOpacity onPress={() => setSelectedStamp(fullIndex)}>
              <Image
                source={{ uri: item }}
                style={[styles.image, selectedStamp === fullIndex && styles.selected]}
              />
            </TouchableOpacity>
          );
        }}
      />
      <Button title="スタンプ画像をアップロード" onPress={() => pickImage("stamp")} />

      <Text style={{ marginTop: 20 }}>背景画像</Text>
      <FlatList
        horizontal
        data={defaultBackgrounds}
        keyExtractor={(uri, idx) => `bd${idx}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setSelectedBackground(index)}>
            <Image
              source={{ uri: item }}
              style={[styles.image, selectedBackground === index && styles.selected]}
            />
          </TouchableOpacity>
        )}
      />

      <FlatList
        horizontal
        data={customBackgrounds}
        keyExtractor={(uri, idx) => `bc${idx}`}
        renderItem={({ item, index }) => {
          const fullIndex = defaultBackgrounds.length + index;
          return (
            <TouchableOpacity onPress={() => setSelectedBackground(fullIndex)}>
              <Image
                source={{ uri: item }}
                style={[styles.image, selectedBackground === fullIndex && styles.selected]}
              />
            </TouchableOpacity>
          );
        }}
      />
      <Button title="背景画像をアップロード" onPress={() => pickImage("background")} />

      <Button title="保存" onPress={saveSelection} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 80,
    height: 80,
    margin: 5,
    borderRadius: 10,
  },
  selected: {
    borderWidth: 3,
    borderColor: "blue",
  },
});
