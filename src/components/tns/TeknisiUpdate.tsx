import React, { useState, useEffect, useMemo } from "react";
import { doc, getDocs, updateDoc, collection, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ROLES, UserRole } from "@/lib/roles";
import useAuth from "@/hooks/useAuth";
import MediaUploadSection, { MediaItem } from "@/components/tns/PhotoUploadSection";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createLog } from "@/lib/log";


interface TeknisiUpdateProps {
  currentTechnician?: string;
  onTechnicianSelect: (technicianName: string) => void;
  isEditing: boolean;
  docId: string;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  selectedDivision?: string; // New prop for filtering technicians by division
  canEditUnitLog?: boolean;
}

// Update interface to hold media items for the UI
interface UnitWorkLogEntry {
    id: string;
    description: string;
    photo_urls: string[];
    timestamp: number;
    media_items: MediaItem[]; // Client-side only
}

const TeknisiUpdate: React.FC<TeknisiUpdateProps> = ({
  currentTechnician,
  onTechnicianSelect,
  isEditing,
  docId,
  setErrorMsg,
  setSuccessMsg,
  selectedDivision, // Destructure the new prop
  canEditUnitLog,
}) => {
  const { user, role } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>(currentTechnician || "");
  const [isSavingTechnician, setIsSavingTechnician] = useState(false);
  const [isSavingUnitLog, setIsSavingUnitLog] = useState(false);
  const [unitWorkLog, setUnitWorkLog] = useState<UnitWorkLogEntry[]>([]);

  // Fetch technicians list on mount
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const teknisiList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((userData: any) => {
            const isTechnicianRole = userData.role && (
              userData.role.toLowerCase() === ROLES.STAFF ||
              userData.role.toLowerCase() === ROLES.MANAGER
            );
            const isInSelectedDivision = !selectedDivision || (userData.division && userData.division === selectedDivision);
            return isTechnicianRole && isInSelectedDivision;
          });
        setTechnicians(teknisiList);
      } catch (err) {
        console.error("Error fetching technicians:", err);
        setErrorMsg("Gagal memuat daftar teknisi.");
      }
    };
    fetchTechnicians();
  }, [setErrorMsg, selectedDivision]); // Add selectedDivision to dependency array

  // Load work log data from Firestore
  useEffect(() => {
    setSelectedTechnician(currentTechnician || "");
    const loadUnitWorkData = async () => {
      if (!docId) return;
      try {
        const docRef = doc(db, "service_requests", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedLog: UnitWorkLogEntry[] = (data.unit_work_log || []).map((entry: any, index: number) => {
            const photo_urls = Array.isArray(entry.photo_urls) ? entry.photo_urls : [];
            return {
              id: entry.id || `log-${index}-${Date.now()}`,
              description: entry.description || "",
              photo_urls: photo_urls,
              timestamp: entry.timestamp || Date.now(),
              media_items: photo_urls.map((url: string) => ({ id: url, url, type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? 'image' : 'video' })),
            };
          });
          setUnitWorkLog(loadedLog);
        }
      } catch (err) {
        console.error("Error loading unit work data:", err);
        setErrorMsg("Gagal memuat data pengerjaan unit.");
      }
    };
    loadUnitWorkData();
  }, [currentTechnician, docId, setErrorMsg]);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setSelectedTechnician(selectedName);
    onTechnicianSelect(selectedName);
  };

  const handleSaveAssignment = async () => {
    if (!user || !docId) return setErrorMsg("User not logged in or document ID is missing.");
    if (!selectedTechnician) return setErrorMsg("Pilih teknisi terlebih dahulu.");

    setIsSavingTechnician(true);
    setErrorMsg(null);

    try {
      const payload = {
        assignedTechnician: selectedTechnician,
      };

      const serviceRef = doc(db, "service_requests", docId);
      await updateDoc(serviceRef, payload);

      await createLog({
        uid: user.uid,
        role: role as UserRole,
        action: "assign_technician",
        target: docId,
        detail: payload,
      });

      setSuccessMsg("Penugasan teknisi berhasil disimpan!");
    } catch (err: any) {
      console.error("Error saving technician assignment:", err);
      setErrorMsg("Gagal menyimpan penugasan teknisi: " + err.message);
    } finally {
      setIsSavingTechnician(false);
    }
  };

  const handleSaveUnitWorkLog = async () => {
    if (!user || !docId) return setErrorMsg("User not logged in or document ID is missing.");

    setIsSavingUnitLog(true);
    setErrorMsg(null);

    try {
      const processedWorkLog = await Promise.all(
        unitWorkLog.map(async (entry) => {
          const uploadedUrls = await Promise.all(
            entry.media_items.map(item => uploadToCloudinary(item, `unit_work_log_${entry.id}`))
          );
          
          return {
            id: entry.id,
            description: entry.description,
            timestamp: entry.timestamp,
            photo_urls: uploadedUrls,
          };
        })
      );

      const payload = {
        unit_work_log: processedWorkLog,
      };

      const serviceRef = doc(db, "service_requests", docId);
      await updateDoc(serviceRef, payload);

      await createLog({
        uid: user.uid,
        role: role as UserRole,
        action: "update_unit_work_log",
        target: docId,
        detail: payload,
      });

      setSuccessMsg("Log Pengerjaan Unit berhasil disimpan!");

      const reloadedLog: UnitWorkLogEntry[] = processedWorkLog.map((entry: any) => ({
            ...entry,
            media_items: entry.photo_urls.map((url:string) => ({ id: url, url, type: url.match(/\.(jpeg|jpg|gif|png)$/) != null ? 'image' : 'video' }))
        }));
      setUnitWorkLog(reloadedLog);

    } catch (err: any) {
      console.error("Error saving unit work log:", err);
      setErrorMsg("Gagal menyimpan Log Pengerjaan Unit: " + err.message);
    } finally {
      setIsSavingUnitLog(false);
    }
  };

  const handleAddNewLogEntry = () => {
    setUnitWorkLog((prev) => [
      {
        id: `log-${Date.now()}`,
        description: "",
        photo_urls: [],
        timestamp: Date.now(),
        media_items: [],
      },
      ...prev, // Add to the top
    ]);
  };

  const handleRemoveLogEntry = (idToRemove: string) => {
    setUnitWorkLog((prev) => prev.filter((entry) => entry.id !== idToRemove));
  };

  const handleLogDescriptionChange = (idToUpdate: string, newDescription: string) => {
    setUnitWorkLog((prev) =>
      prev.map((entry) =>
        entry.id === idToUpdate ? { ...entry, description: newDescription } : entry
      )
    );
  };
  
  // Handles updates from MediaUploadSection
  const handleLogMediaChange = (idToUpdate: string, newItems: MediaItem[]) => {
     setUnitWorkLog((prev) =>
      prev.map((entry) =>
        entry.id === idToUpdate ? { ...entry, media_items: newItems } : entry
      )
    );
  };

  const sortedUnitWorkLog = useMemo(
    () => unitWorkLog.slice().sort((a, b) => b.timestamp - a.timestamp),
    [unitWorkLog]
  );

  return (
    <>
      { !(role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.OWNER || role === ROLES.STAFF) ? (
          !currentTechnician ? null : (
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-white">Teknisi Ditugaskan: <span className="font-semibold">{currentTechnician}</span></p>
            </div>
          )
      ) : (
        <>
          {/* Section for Technician Assignment */}
          <div className="relative p-4 bg-gray-800 rounded-lg shadow-md mb-6">
            {isSavingTechnician && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                <p className="text-white font-semibold">Menyimpan Penugasan...</p>
              </div>
            )}
            <h3 className="text-xl font-bold text-blue-400 mb-4">Penugasan Teknisi</h3>
            <div className="mb-4">
              <label htmlFor="technician-select" className="block text-sm font-medium text-gray-300 mb-2">Pilih Teknisi:</label>
              <select
                id="technician-select"
                value={selectedTechnician}
                onChange={handleSelectionChange}
                disabled={!isEditing || isSavingTechnician}
                className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white disabled:cursor-not-allowed"
              >
                <option value="">-- Pilih Teknisi --</option>
                {technicians.map((tech: any) => (
                  <option key={tech.id} value={tech.email}>{tech.email} ({tech.name})</option>
                ))}
              </select>
            </div>
            {isEditing && (
              <button
                onClick={handleSaveAssignment}
                disabled={isSavingTechnician || !selectedTechnician}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSavingTechnician ? "Menyimpan..." : "Simpan Penugasan"}
              </button>
            )}
          </div>

          {/* Section for Unit Work Log */}
          <div className="relative p-4 bg-gray-800 rounded-lg shadow-md">
            {isSavingUnitLog && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                <p className="text-white font-semibold">Menyimpan Log Pengerjaan...</p>
              </div>
            )}
            <h3 className="text-xl font-bold text-purple-400 mb-4">Log Pengerjaan Unit</h3>
            <div className="space-y-4 mb-4">
              {sortedUnitWorkLog.map((entry) => (
                <div key={entry.id} className="bg-gray-700 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-400 text-xs">{new Date(entry.timestamp).toLocaleString("id-ID")}</p>
                      <button onClick={() => handleRemoveLogEntry(entry.id)} className="ml-2 text-red-400 hover:text-red-500 text-xs disabled:cursor-not-allowed" disabled={!canEditUnitLog || isSavingUnitLog}>(Hapus)</button>
                  </div>
                  <textarea
                    value={entry.description}
                    onChange={(e) => handleLogDescriptionChange(entry.id, e.target.value)}
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-600 bg-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white mb-2 disabled:cursor-not-allowed"
                    placeholder="Deskripsi pengerjaan..."
                    disabled={!canEditUnitLog || isSavingUnitLog}
                  ></textarea>
                  <MediaUploadSection
                    title="Lampiran (Foto/Video)"
                    items={entry.media_items}
                    onItemsChange={(items) => handleLogMediaChange(entry.id, items)}
                    size="small"
                    setErrorMsg={setErrorMsg}
                    showCamera={false}
                    disabled={!canEditUnitLog || isSavingUnitLog}
                  />
                </div>
              ))}
            </div>

            {canEditUnitLog && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleAddNewLogEntry}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSavingUnitLog}
                >
                  Tambah Log Pengerjaan
                </button>
                <button
                  onClick={handleSaveUnitWorkLog}
                  disabled={isSavingUnitLog}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUnitLog ? "Menyimpan..." : "Simpan Log Pengerjaan"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default TeknisiUpdate;
