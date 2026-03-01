import React from "react";

interface TeknisiAssignmentSectionProps {
  technicians: any[];
  selectedTechnicians: string[];
  availableTechnicians: any[];
  trackNumber?: string;
  isEditing: boolean;
  isSaving: boolean;
  onSelectionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onRemoveTechnician: (email: string) => void;
  onSave: () => void;
  onScrollToLog: () => void;
}

const TeknisiAssignmentSection: React.FC<TeknisiAssignmentSectionProps> = ({
  technicians,
  selectedTechnicians,
  availableTechnicians,
  trackNumber,
  isEditing,
  isSaving,
  onSelectionChange,
  onRemoveTechnician,
  onSave,
  onScrollToLog,
}) => {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm ring-1 ring-gray-100 overflow-hidden relative">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Penugasan Teknisi</h2>
          <p className="text-xs text-gray-500">Atur teknisi yang akan menangani unit ini</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{selectedTechnicians.length}</p>
          <p className="text-[11px] text-gray-500">Teknisi aktif</p>
        </div>
      </div>
      <div className="p-4 space-y-4 relative">
        {isSaving && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <p className="text-gray-800 font-semibold">Menyimpan Penugasan...</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
            onClick={onScrollToLog}
            type="button"
          >
            Lihat Teknisi Log
          </button>
          {trackNumber && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Track #{trackNumber}</span>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Teknisi Terpilih</label>
          {isEditing && (
            <div className="w-full mb-3">
              <select
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                value=""
                onChange={onSelectionChange}
                disabled={isSaving || availableTechnicians.length === 0}
              >
                <option value="">Tambah teknisi...</option>
                {availableTechnicians.map((tech: any) => (
                  <option key={tech.id} value={tech.email}>{tech.name || tech.email}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {selectedTechnicians.length === 0 && <span className="text-gray-500 text-sm">Belum ada teknisi yang dipilih</span>}
            {selectedTechnicians.map((techEmail) => {
              const technician = technicians.find((t) => t.email === techEmail);
              return (
                <div key={techEmail} className="bg-white border border-gray-300 rounded px-3 py-2 text-sm flex items-center gap-2 shadow-sm w-fit">
                  <span>{technician?.name || techEmail}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onRemoveTechnician(techEmail)}
                      className="text-red-500 hover:text-red-700 text-lg font-medium leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {isEditing && (
          <div className="flex justify-end">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
              onClick={onSave}
              disabled={isSaving || selectedTechnicians.length === 0}
            >
              {isSaving ? "Menyimpan..." : "Update Teknisi"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TeknisiAssignmentSection;
