// components/inputfield.tsx
interface InputFieldProps {
  label: string;
  placeholder: string;
  textarea?: boolean;
  name: string;           // wajib
  value: string;          // wajib
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;  // wajib
}

export default function InputField({ 
  label, 
  placeholder, 
  textarea = false, 
  name,
  value,
  onChange 
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      )}
    </div>
  );
}