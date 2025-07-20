import React, { useState } from "react";
import { authService } from "../services/authService";
import type { RegisterRequest } from "../models/AuthModels";
import { useLanguage } from "../context/language/LanguageContext";

const RegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const result = await authService.register(form);
      setSuccess(result.message || t("register_success"));
    } catch (err: any) {
            if (err?.response?.data?.error === "Email already exists") {
                setError(t("register_email_exists"));
            } else {
                setError(err?.response?.data?.message || t("register_fail"));
            }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">{t("register_title")}</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          placeholder={t("register_firstname")}
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder={t("register_lastname")}
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t("register_email")}
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          placeholder={t("register_displayname")}
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder={t("register_password")}
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        {success && <div className="text-green-500 mb-4 text-center">{success}</div>}
        <button
          type="submit"
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
        >
          {t("register_title")}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;