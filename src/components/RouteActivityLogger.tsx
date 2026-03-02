"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { createLog } from "@/lib/log";
import { UserRole } from "@/lib/roles";

type LastPageLog = {
  key: string;
  ts: number;
};

const LAST_LOG_KEY = "__last_page_log__";
const DUPLICATE_WINDOW_MS = 10000;

export default function RouteActivityLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const query = searchParams?.toString() || "";
    const fullPath = query ? `${pathname}?${query}` : pathname;
    const currentKey = `${currentUser.uid}:${fullPath}`;

    try {
      const raw = sessionStorage.getItem(LAST_LOG_KEY);
      if (raw) {
        const last: LastPageLog = JSON.parse(raw);
        if (last.key === currentKey && Date.now() - last.ts < DUPLICATE_WINDOW_MS) {
          return;
        }
      }
      sessionStorage.setItem(LAST_LOG_KEY, JSON.stringify({ key: currentKey, ts: Date.now() }));
    } catch {
      // ignore sessionStorage errors
    }

    let cancelled = false;

    const logPageVisit = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        const userRole = (
          userSnap.exists() && typeof userSnap.data()?.role === "string"
            ? userSnap.data().role.toLowerCase()
            : "unknown"
        ) as UserRole | "unknown";

        if (cancelled) return;

        await createLog({
          uid: currentUser.uid,
          email: currentUser.email ?? undefined,
          role: userRole,
          action: "view_page",
          target: pathname,
          detail: {
            fullPath,
            title: typeof document !== "undefined" ? document.title : "",
          },
        });
      } catch (err) {
        console.error("Failed to log page view:", err);
      }
    };

    logPageVisit();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
