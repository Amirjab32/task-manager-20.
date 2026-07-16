import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  AlertCircle, 
  Database,
  RefreshCw
} from "lucide-react";
import { useThemeStyles } from "@/lib/useThemeStyles";
import { exportDatabase, importDatabase } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BackupModal({ isOpen, onClose, onSuccess }: Props) {
  const { bg, fg, fgMuted, cardBorder, inputBg } = useThemeStyles();
  const [copySuccess, setCopySuccess] = useState(false);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Manual Export to JSON file
  const handleExportFile = () => {
    try {
      setError(null);
      const dataStr = exportDatabase();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
      
      a.href = url;
      a.download = `FocusFlow_Backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMsg("فایل پشتیبان با موفقیت دانلود شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError("خطا در ایجاد و دانلود فایل پشتیبان.");
    }
  };

  // Manual Export to Text Code (Clipboard)
  const handleExportText = () => {
    try {
      setError(null);
      const dataStr = exportDatabase();
      // Compress slightly by removing extra spaces
      const compressed = JSON.stringify(JSON.parse(dataStr));
      navigator.clipboard.writeText(compressed).then(() => {
        setCopySuccess(true);
        setSuccessMsg("کد پشتیبان با موفقیت در کلیپ‌بورد کپی شد.");
        setTimeout(() => {
          setCopySuccess(false);
          setSuccessMsg(null);
        }, 3000);
      });
    } catch (err) {
      setError("خطا در کپی کد پشتیبان.");
    }
  };

  // Manual Import from file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("لطفاً یک فایل معتبر با پسوند .json انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importDatabase(text);
        if (success) {
          window.dispatchEvent(new CustomEvent("focusflow-data-changed"));
          setSuccessMsg("اطلاعات با موفقیت بازیابی شد. در حال بارگذاری مجدد...");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setError("فرمت اطلاعات داخل فایل معتبر نیست.");
        }
      } catch (err) {
        setError("خطا در خواندن فایل پشتیبان.");
      }
    };
    reader.readAsText(file);
  };

  // Manual Import from text paste
  const handleImportTextSubmit = () => {
    setError(null);
    setSuccessMsg(null);
    if (!importText.trim()) {
      setError("لطفاً ابتدا کد پشتیبان را در کادر زیر وارد کنید.");
      return;
    }

    try {
      const success = importDatabase(importText.trim());
      if (success) {
        window.dispatchEvent(new CustomEvent("focusflow-data-changed"));
        setSuccessMsg("اطلاعات با موفقیت بازیابی شد. در حال بارگذاری مجدد...");
        setImportText("");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError("کد پشتیبان وارد شده معتبر نیست. لطفاً مجدداً بررسی کنید.");
      }
    } catch (err) {
      setError("کد وارد شده فرمت JSON معتبری ندارد.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl overflow-hidden"
        style={{ backgroundColor: bg, borderColor: cardBorder }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold" style={{ color: fg }}>پشتیبان‌گیری و انتقال اطلاعات</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold text-emerald-400">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mt-5 space-y-6">
          {/* Section 1: Export Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold" style={{ color: fgMuted }}>۱. خروجی گرفتن و انتقال اطلاعات (Export)</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Export File */}
              <button
                onClick={handleExportFile}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                style={{ borderColor: cardBorder }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Download className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold" style={{ color: fg }}>دانلود فایل بکاپ</span>
                <span className="text-[9px]" style={{ color: fgMuted }}>فرمت .json</span>
              </button>

              {/* Export Text */}
              <button
                onClick={handleExportText}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                style={{ borderColor: cardBorder }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  {copySuccess ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                </div>
                <span className="text-[11px] font-bold" style={{ color: fg }}>کپی متنی دیتابیس</span>
                <span className="text-[9px]" style={{ color: fgMuted }}>انتقال سریع و آسان</span>
              </button>
            </div>
          </div>

          {/* Section 2: Import Actions */}
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: cardBorder }}>
            <h4 className="text-xs font-bold" style={{ color: fgMuted }}>۲. بازیابی و وارد کردن اطلاعات (Import)</h4>
            
            {/* File upload selector */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: fg }}>بازیابی از فایل بکاپ:</span>
              <label 
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>انتخاب فایل</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportFile}
                  className="hidden" 
                />
              </label>
            </div>

            {/* Text Paste Area */}
            <div className="space-y-2">
              <span className="block text-xs" style={{ color: fg }}>بازیابی از کد متنی:</span>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="کد متنی کپی شده از دستگاه قبلی را اینجا پیست کنید..."
                className="w-full h-16 rounded-xl p-2.5 text-[11px] outline-none border resize-none font-mono"
                style={{ backgroundColor: inputBg, color: fg, borderColor: cardBorder }}
              />
              <button
                onClick={handleImportTextSubmit}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>بروزرسانی اطلاعات از طریق کد</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center leading-relaxed" style={{ color: fgMuted }}>
            💡 با کپی کردن کد متنی، می‌توانید بدون دانلود فایل، دیتابیس خود را کپی کرده و روی هر گوشی یا سایتی انتقال داده و لود کنید.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
