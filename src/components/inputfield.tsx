"use client";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
}

export default function InputField({
  label,
  type = "text",
  placeholder,
  textarea = false,
}: InputFieldProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="font-medium text-sm">{label}</label>
      {textarea ? (
        <textarea
          placeholder={placeholder}
          className="border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
          rows={4}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
        />
      )}
    </div>
  );
}
