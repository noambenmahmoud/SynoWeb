import { FileText, FileSpreadsheet, FileType, FileCode2, File } from "lucide-react";

const ICONS = {
  pdf: { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" },
  docx: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  doc: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  xlsx: { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50" },
  xls: { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50" },
  pptx: { icon: FileType, color: "text-amber-600", bg: "bg-amber-50" },
  ppt: { icon: FileType, color: "text-amber-600", bg: "bg-amber-50" },
  md: { icon: FileCode2, color: "text-slate-700", bg: "bg-slate-100" },
  txt: { icon: FileText, color: "text-slate-700", bg: "bg-slate-100" },
};

export default function DocumentIcon({ ext, className = "" }) {
  const cfg = ICONS[ext?.toLowerCase()] || { icon: File, color: "text-slate-500", bg: "bg-slate-100" };
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-center rounded-xl ${cfg.bg} ${className}`}>
      <Icon className={`h-7 w-7 ${cfg.color}`} strokeWidth={1.5} />
    </div>
  );
}
