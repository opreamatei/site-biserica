"use client";

import { motion } from "framer-motion";
import { Calendar1Icon, CalendarFoldIcon, CalendarIcon, ChevronDown, Flower } from "lucide-react";
import Link from "next/link";
import { useInView } from "framer-motion";
import { useRef } from "react";

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
      transition={{ duration: .33, ease: "easeOut" }}
      className={`relative ${bgColor} ${textColor} font-medium cursor-pointer rounded-xl flex flex-col items-center gap-2 hover:opacity-90 transition`}
    >
      {/* Decor background circles */}
      <div className="absolute">
        <div className={`rounded-full ${bgColor} w-7 h-7 absolute -top-4 left-0 -translate-x-1/2 grid place-items-center`}>
            <Flower className="w-4 h-4"/>
        </div>
       
      </div>
      {children}
    </motion.div>
  );
}
