"use client";


interface InputFieldProps {
  label: string;
  placeholder?: string;
  textarea?: boolean;
  name: string; // wajib
  value: string; // wajib
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // <-- opsional
  disabled?: boolean; // <-- tambahan
  readOnly?: boolean; // ⬅ tambahkan ini

}

export default function InputField({
  label,
  placeholder,
  textarea = false,
  name,
  value,
  onChange,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={`w-full p-2 border rounded-md ${
            disabled
              ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-800"
          }`}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-2 border rounded-md ${
            disabled
              ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-800"
          }`}
        />
      )}
    </div>
  );
}
