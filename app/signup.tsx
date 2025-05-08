import { useState } from "react";
import { View, TextInput, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "../firebase/firebase";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const windowWidth = Dimensions.get("window").width;
const jpFont = "MaruMinya";
const enFont = "PixelifySans-Regular";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);

      // ✅ 成功時は success トースト表示
      Toast.show({
        type: "success",
        text1: "登録が完了しました 🎉",
      });

      router.replace("/"); // ホームへ遷移
    } catch (err: any) {
      console.error("signup error:", err);
      setError("登録に失敗しました");

      // ❌ 明確なエラー時のみエラートーストを表示
      Toast.show({
        type: "error",
        text1: `登録に失敗しました\n${err.message}`,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>✦ <Text style={styles.en}>signup.exe</Text></Text>
          <Text style={styles.en}>×</Text>
        </View>

        <View style={styles.body}>
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>▶ 登録する</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e5e5eb",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  window: {
    width: windowWidth * 0.85,
    backgroundColor: "#f0f0f5",
    borderWidth: 4,
    borderColor: "#666677",
    shadowColor: "#666677",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  titleBar: {
    backgroundColor: "#8888a0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderColor: "#666677",
  },
  titleText: {
    fontFamily: jpFont,
    fontSize: 16,
    color: "#fff",
  },
  en: {
    fontFamily: enFont,
    fontSize: 16,
    color: "#fff",
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
    backgroundColor: "#cfcfe8",
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#666677",
    shadowColor: "#666677",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 10,
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
