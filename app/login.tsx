import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "../firebase/firebase";
import { useRouter } from "expo-router";

const windowWidth = Dimensions.get("window").width;
const jpFont = "MaruMinya";              // 日本語対応フォント
const enFont = "PixelifySans-Regular";   // 英語用ピクセルフォント

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.replace("/"); // ホームへ遷移
    } catch (err: any) {
      setError("ログインに失敗しました");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.window}>
        {/* タイトルバー */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ <Text style={styles.titleTextEN}>login.exe</Text> ✦</Text>
          <Text style={styles.closeIcon}>×</Text>
        </View>

        {/* 本体部分 */}
        <View style={styles.body}>
          <TextInput
            placeholder="メールアドレス"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="パスワード"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>▶ ログイン</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.subButton]}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.buttonText}>＋ 新規登録はこちら</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e5eb", // くすみグレー
    alignItems: "center",
    justifyContent: "center",
  },
  window: {
    width: windowWidth * 0.85,
    backgroundColor: "#f0f0f5", // 薄グレーラベンダー
    borderWidth: 4,
    borderColor: "#666677",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderRadius: 0,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#8888a0", // くすみネイビー
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderColor: "#666677",
  },
  titleText: {
    fontFamily: jpFont,
    fontSize: 16,
    color: "#ffffff",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  titleTextEN: {
    fontFamily: enFont,
    fontSize: 16,
    color: "#ffffff",
  },
  closeIcon: {
    fontFamily: jpFont,
    fontSize: 14,
    color: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  body: {
    padding: 20,
  },
  input: {
    fontFamily: jpFont,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#8888a0",
    padding: 10,
    borderRadius: 0,
    marginBottom: 12,
    color: "#333",
  },
  button: {
    backgroundColor: "#cfcfe8", // グレーパープル
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#666677",
    borderRadius: 0,
    shadowColor: "#666677",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 10,
  },
  subButton: {
    backgroundColor: "#dcdce8", // 明るめグレー
  },
  buttonText: {
    fontFamily: jpFont,
    textAlign: "center",
    color: "#3b3355",
    fontSize: 14,
  },
  error: {
    color: "#c44",
    fontFamily: jpFont,
    marginBottom: 10,
    textAlign: "center",
  },
});
