// lib/trackNumber.ts
import { db } from "./firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export const generateTrackNumber = async (): Promise<string> => {
  const q = query(collection(db, "service_requests"), orderBy("timestamp", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  let lastNumber = 0;
  querySnapshot.forEach(doc => {
    const track = doc.data().track_number as string;
    if (track?.startsWith("WO")) {
      const num = parseInt(track.replace("WO", ""));
      if (!isNaN(num)) lastNumber = num;
    }
  });

  const newNumber = lastNumber + 1;
  return `WO${newNumber}`;
};
