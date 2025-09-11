// components/Loader.tsx
"use client";
import { motion } from "framer-motion";

type LoaderProps = {
  isLoading: boolean;
};

export default function Loader({ isLoading }: LoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 bg-gray-800">
      <motion.div
        className="h-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </div>
  );
}
