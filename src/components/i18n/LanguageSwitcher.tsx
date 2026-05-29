import { useLanguage } from "@/features/i18n/LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-lg"
      aria-label="Chuyển ngôn ngữ"
      title="Chuyển ngôn ngữ"
    >
      <button
        type="button"
        onClick={() => setLang("vi")}
        aria-label="Hiển thị tiếng Việt"
        title="Hiển thị tiếng Việt"
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          lang === "vi" ? "bg-blue-600 text-white" : "text-gray-700"
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label="Hiển thị tiếng Anh"
        title="Hiển thị tiếng Anh"
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          lang === "en" ? "bg-blue-600 text-white" : "text-gray-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}
