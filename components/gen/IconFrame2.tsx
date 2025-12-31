"use client";

import { motion } from "framer-motion";
import { Calendar1Icon, CalendarFoldIcon, CalendarIcon, ChevronDown, Flower } from "lucide-react";

interface iconFrameProps {
  bgColor?: string;
  textColor?: string;
  children? : any,
}

export default function IconFrame({
  bgColor = "bg-[#df5719]",
  textColor = "text-black/80",
  children
}: iconFrameProps) {

  return (
<motion.div
  initial={{ scale: 0.8 }}
  whileInView={{ scale: 1 }}
  transition={{ duration: 0.33, ease: "easeOut" }}
  className={`relative ${bgColor} ${textColor} font-medium cursor-pointer p-1 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 transition`}
>
  {children}

  {/* Decor background circle */}
  <div
    className={`absolute top-1/2 -left-8 -translate-y-1/2 rounded-full ${bgColor} w-7 h-7 grid place-items-center`}
  >
    <Flower className="w-4 h-4 text-black/50" />
  </div>
</motion.div>
  );
}
