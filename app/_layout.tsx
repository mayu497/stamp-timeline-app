import { Slot, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "../firebase/firebase"; // ←firebase.tsの場所に応じて直す！

export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState<null | {} | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log("onAuthStateChanged:", user);
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user === null) {
      console.log("ログインしてないから /login に移動するよ！");
      router.replace("/login");
    }
  }, [user]);

  if (user === undefined) {
    console.log("認証待ち中...");
    return null;
  }

  return <Slot />;
}
