"use client";

import { useId } from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}

export default function InputField({
  label,
  type = "text",
  placeholder,
  textarea = false,
  required = false,
}: InputFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col space-y-1">
      <label
        htmlFor={id}
        className="font-medium text-sm text-gray-800"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          required={required}
          rows={4}
          className="border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          required={required}
          className="border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      )}
    </div>
  );
}
