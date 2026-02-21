import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { ROLES, UserRole } from "@/lib/roles";
import { createLog } from "@/lib/log";
import TeknisiAssignmentSection from "@/components/tns/technician/TeknisiAssignmentSection";

interface TechnicianAssignmentCardProps {
  docId: string;
  currentTechnicians?: string[];
  onTechnicianSelect: (technicianNames: string[]) => void;
  isEditing: boolean;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  trackNumber?: string;
  onScrollToLog?: () => void;
}

const TechnicianAssignmentCard: React.FC<TechnicianAssignmentCardProps> = ({
  docId,
  currentTechnicians,
  onTechnicianSelect,
  isEditing,
  setErrorMsg,
  setSuccessMsg,
  trackNumber,
  onScrollToLog,
}) => {
  const { user, role } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(currentTechnicians || []);
  const [isSavingTechnician, setIsSavingTechnician] = useState(false);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const teknisiList = snapshot.docs
          .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
          .filter((userData: any) => {
            const normalizedRole = (userData.role || "").toLowerCase();
            return (
              normalizedRole === ROLES.STAFF.toLowerCase() ||
              normalizedRole === ROLES.MANAGER.toLowerCase()
            );
          });
        setTechnicians(teknisiList);
      } catch (err) {
        console.error("Error fetching technicians:", err);
        setErrorMsg("Gagal memuat daftar teknisi.");
      }
    };

    fetchTechnicians();
  }, [setErrorMsg]);

  useEffect(() => {
    setSelectedTechnicians(currentTechnicians || []);
  }, [currentTechnicians]);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    if (selectedEmail && !selectedTechnicians.includes(selectedEmail)) {
      const updatedTechnicians = [...selectedTechnicians, selectedEmail];
      setSelectedTechnicians(updatedTechnicians);
      onTechnicianSelect(updatedTechnicians);
    }
    e.target.value = "";
  };

  const handleRemoveTechnician = (email: string) => {
    const updated = selectedTechnicians.filter((t) => t !== email);
    setSelectedTechnicians(updated);
    onTechnicianSelect(updated);
  };

  const handleSaveAssignment = async () => {
    if (!user || !docId) {
      setErrorMsg("User not logged in or document ID is missing.");
      return;
    }
    if (selectedTechnicians.length === 0) {
      setErrorMsg("Pilih setidaknya satu teknisi.");
      return;
    }

    setIsSavingTechnician(true);
    setErrorMsg(null);
    try {
      const payload = { assignedTechnicians: selectedTechnicians };
      await updateDoc(doc(db, "service_requests", docId), payload);
      await createLog({ uid: user.uid, role: role as UserRole, action: "assign_technician", target: docId, detail: payload });
      setSuccessMsg("Penugasan teknisi berhasil disimpan!");
    } catch (err: any) {
      console.error("Error saving technician assignment:", err);
      setErrorMsg("Gagal menyimpan penugasan teknisi: " + err.message);
    } finally {
      setIsSavingTechnician(false);
    }
  };

  const availableTechnicians = useMemo(
    () => technicians.filter((tech) => !selectedTechnicians.includes(tech.email)),
    [technicians, selectedTechnicians]
  );

  const safeScrollToLog = onScrollToLog ?? (() => {});

  return (
    <div className="card">
      <h3 className="text-lg font-semibold border-b pb-2 mb-4">Penugasan Teknisi (TNS: {trackNumber || "-"})</h3>
      <TeknisiAssignmentSection
        technicians={technicians}
        selectedTechnicians={selectedTechnicians}
        availableTechnicians={availableTechnicians}
        trackNumber={trackNumber}
        isEditing={isEditing}
        isSaving={isSavingTechnician}
        onSelectionChange={handleSelectionChange}
        onRemoveTechnician={handleRemoveTechnician}
        onSave={handleSaveAssignment}
        onScrollToLog={safeScrollToLog}
      />
    </div>
  );
};

export default TechnicianAssignmentCard;
