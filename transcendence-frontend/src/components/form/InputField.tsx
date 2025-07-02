import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export default function InputField({ label, error, ...props }: Props) {
    return (
        <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">{label}</label>
            <input
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500" : "border-gray-300"
                    }`}
                {...props}
            />
            {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
        </div>
    );
}
