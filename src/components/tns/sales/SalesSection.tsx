import React from "react";

interface SalesOption {
  id: string;
  name?: string;
  email?: string;
  fullName?: string;
  displayName?: string;
}

interface SalesSectionProps {
  salesName: string;
  salesInput: string;
  isEditing: boolean;
  isSaving: boolean;
  salesOptions: SalesOption[];
  isLoadingOptions: boolean;
  onSalesInputChange: (value: string) => void;
  onSelectOption?: (userId: string) => void;
  onSave: () => void;
}

const SalesSection: React.FC<SalesSectionProps> = ({
  salesName,
  salesInput,
  isEditing,
  isSaving,
  salesOptions,
  isLoadingOptions,
  onSalesInputChange,
  onSelectOption,
  onSave,
}) => {
  const renderOptionLabel = (option: SalesOption) => option.name || option.fullName || option.displayName || option.email || "Tanpa Nama";

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm ring-1 ring-gray-100 overflow-hidden relative">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Sales</h2>
          <p className="text-xs text-gray-500">Penanggung jawab komunikasi awal pelanggan</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${salesName ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
          {salesName ? "Sudah ditetapkan" : "Belum ditentukan"}
        </span>
      </div>
      <div className="p-4 space-y-3 relative">
        {isSaving && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <p className="text-gray-800 font-semibold">Menyimpan Data Sales...</p>
          </div>
        )}
        {isEditing && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-600">Tambah Sales</label>
            <select
              className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={isSaving || isLoadingOptions || salesOptions.length === 0}
              value=""
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) return;
                onSelectOption?.(selectedId);
                e.target.value = "";
              }}
            >
              <option value="">
                {isLoadingOptions ? "Memuat daftar Sales..." : "Tambah sales..."}
              </option>
              {salesOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {renderOptionLabel(option)}
                </option>
              ))}
            </select>
            {!isLoadingOptions && salesOptions.length === 0 && (
              <p className="text-[11px] text-gray-500">Belum ada user dengan divisi Sales.</p>
            )}
          </div>
        )}
        <div>
          <input
            type="text"
            value={salesInput}
            onChange={(e) => onSalesInputChange(e.target.value)}
            readOnly={!isEditing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-purple-200"
            disabled={!isEditing || isSaving}
          />
        </div>
        {isEditing && (
          <div className="flex justify-end">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "Menyimpan..." : "Update Sales"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SalesSection;
