import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAuth from "@/hooks/useAuth";
import { UserRole } from "@/lib/roles";
import { createLog } from "@/lib/log";
import SalesSection from "@/components/tns/sales/SalesSection";

interface SalesCandidate {
  id: string;
  name?: string;
  email?: string;
  division?: string;
  fullName?: string;
  displayName?: string;
  [key: string]: any;
}

interface SalesAssignmentCardProps {
  docId: string;
  initialSalesName?: string;
  isEditing: boolean;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  onSalesUpdated?: (newSalesName: string) => void;
}

const SalesAssignmentCard: React.FC<SalesAssignmentCardProps> = ({
  docId,
  initialSalesName,
  isEditing,
  setErrorMsg,
  setSuccessMsg,
  onSalesUpdated,
}) => {
  const { user, role } = useAuth();
  const [salesName, setSalesName] = useState(initialSalesName || "");
  const [salesInput, setSalesInput] = useState(initialSalesName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [salesCandidates, setSalesCandidates] = useState<SalesCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  useEffect(() => {
    setSalesName(initialSalesName || "");
    setSalesInput(initialSalesName || "");
  }, [initialSalesName]);

  useEffect(() => {
    const fetchSalesCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs
          .map((userDoc) => ({ id: userDoc.id, ...(userDoc.data() as Record<string, any>) } as SalesCandidate))
          .filter((userData) => (userData.division || "").toLowerCase() === "sales");
        setSalesCandidates(list);
      } catch (err) {
        console.error("Error fetching sales users:", err);
        setErrorMsg("Gagal memuat daftar sales dari divisi Sales.");
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    fetchSalesCandidates();
  }, [setErrorMsg]);

  const getCandidateLabel = (candidate: SalesCandidate) => candidate.name || candidate.fullName || candidate.displayName || candidate.email || "Tanpa Nama";

  const handleSelectSalesCandidate = (candidateId: string) => {
    const selected = salesCandidates.find((candidate) => candidate.id === candidateId);
    if (!selected) return;
    const label = getCandidateLabel(selected);
    setSalesInput(label);
  };

  const handleSaveSales = async () => {
    if (!user || !docId) {
      setErrorMsg("User not logged in or document ID is missing.");
      return;
    }

    const trimmed = salesInput.trim();
    if (!trimmed) {
      setErrorMsg("Nama sales tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = { sales: trimmed, sales_name: trimmed, assignedSales: trimmed };
      await updateDoc(doc(db, "service_requests", docId), payload);
      await createLog({ uid: user.uid, role: role as UserRole, action: "update_sales_assignment", target: docId, detail: payload });
      setSalesName(trimmed);
      setSalesInput(trimmed);
      onSalesUpdated?.(trimmed);
      setSuccessMsg("Data sales berhasil diperbarui!");
    } catch (err: any) {
      console.error("Error saving sales assignment:", err);
      setErrorMsg("Gagal menyimpan data sales: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <SalesSection
        salesName={salesName}
        salesInput={salesInput}
        isEditing={isEditing}
        isSaving={isSaving}
        salesOptions={salesCandidates}
        isLoadingOptions={isLoadingCandidates}
        onSelectOption={handleSelectSalesCandidate}
        onSalesInputChange={setSalesInput}
        onSave={handleSaveSales}
      />
    </div>
  );
};

export default SalesAssignmentCard;
