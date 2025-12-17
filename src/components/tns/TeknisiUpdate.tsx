import React, { useState, useEffect, useMemo } from "react";
import { doc, getDocs, updateDoc, collection, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ROLES, UserRole } from "@/lib/roles";
import useAuth from "@/hooks/useAuth";
import MediaUploadSection, { MediaItem } from "@/components/tns/PhotoUploadSection";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createLog } from "@/lib/log";


interface TeknisiUpdateProps {
  currentTechnicians?: string[];
  onTechnicianSelect: (technicianNames: string[]) => void;
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
  currentTechnicians,
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
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(currentTechnicians || []);
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
            return isTechnicianRole;
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
    setSelectedTechnicians(currentTechnicians || []);
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
  }, [currentTechnicians, docId, setErrorMsg]);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    if (selectedEmail && !selectedTechnicians.includes(selectedEmail)) {
      const updatedTechnicians = [...selectedTechnicians, selectedEmail];
      setSelectedTechnicians(updatedTechnicians);
      onTechnicianSelect(updatedTechnicians);
    }
    // Reset the dropdown to the placeholder or empty
    e.target.value = ""; // This will reset the select to its default empty option if present
  };

  const handleSaveAssignment = async () => {
    if (!user || !docId) return setErrorMsg("User not logged in or document ID is missing.");
    if (selectedTechnicians.length === 0) return setErrorMsg("Pilih setidaknya satu teknisi.");

    setIsSavingTechnician(true);
    setErrorMsg(null);

    try {
      const payload = {
        assignedTechnicians: selectedTechnicians,
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

  const availableTechnicians = useMemo(() => {
    return technicians.filter(
      (tech) => !selectedTechnicians.includes(tech.email)
    );
  }, [technicians, selectedTechnicians]);

  return (
    <>
      { !(role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.OWNER || role === ROLES.STAFF) ? (
          currentTechnicians && currentTechnicians.length > 0 ? (
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-white">Para Teknisi Ditugaskan: <span className="font-semibold">{currentTechnicians.join(", ")}</span></p>
            </div>
          ) : null
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

            {/* Display Assigned Technicians as Chips */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Para Teknisi Ditugaskan:</label>
              {selectedTechnicians.length === 0 ? (
                <p className="text-gray-400">Belum ada teknisi yang ditugaskan.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTechnicians.map((techEmail) => {
                    const technician = technicians.find(t => t.email === techEmail);
                    return (
                      <span key={techEmail} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                        {technician && technician.name ? technician.name : techEmail}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedTechnicians.filter(t => t !== techEmail);
                              setSelectedTechnicians(updated);
                              onTechnicianSelect(updated); // Propagate change immediately
                            }}
                            className="ml-2 -mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-blue-500"
                          >
                            <span className="sr-only">Remove technician</span>
                            <svg className="h-2 w-2 text-white" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                              <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6M6 1L1 6" />
                            </svg>
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown to add more technicians */}
            {isEditing && (
              <div className="mb-4">
                <label htmlFor="technician-add-select" className="block text-sm font-medium text-gray-300 mb-2">Tambah Teknisi:</label>
                <select
                  id="technician-add-select"
                  value="" // Controlled component, value will always be empty after selection
                  onChange={handleSelectionChange}
                  disabled={isSavingTechnician || availableTechnicians.length === 0}
                  className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Teknisi --</option>
                  {availableTechnicians.map((tech: any) => (
                    <option key={tech.id} value={tech.email}>{tech.name || tech.email}</option>
                  ))}
                </select>
                {availableTechnicians.length === 0 && (
                  <p className="text-gray-400 text-sm mt-1">Semua teknisi sudah ditugaskan.</p>
                )}
              </div>
            )}

            {/* Save Assignment Button */}
            {isEditing && (
              <button
                onClick={handleSaveAssignment}
                disabled={isSavingTechnician || selectedTechnicians.length === 0}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSavingTechnician ? "Menyimpan..." : "Update Penugasan"}
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
