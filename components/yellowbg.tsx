"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function YellowTexture({ children }: { children?: ReactNode }) {
    const [usePhoneImages, setUsePhoneImages] = useState(false);
    const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

    useEffect(() => {
        if (typeof window != "undefined") {

            const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
            const handleChange = (event: MediaQueryListEvent) => {
                setUsePhoneImages(event.matches);
            };

            setUsePhoneImages(mediaQuery.matches);
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, []);

    const diffuseSrc = usePhoneImages
        ? "/background/concrete_wall_003_diff_8k_phone.jpg"
        : "/background/concrete_wall_003_diff_8k.jpg";

    const displacementSrc = usePhoneImages
        ? "/background/concrete_wall_003_disp_8k_phone.png"
        : "/background/concrete_wall_003_disp_8k.png";
    return (
        <div className="relative overflow-hidden bg-[#c59d30] pt-10 selection:bg-yellow-600 selection:text-black/90">
            <motion.div
                className="absolute inset-0 h-[300vh] w-full opacity-10 overflow-hidden"
                id="background-diffuse"
            >
                <Image
                    fill
                    priority
                    quality={100}
                    sizes="100vw"
                    className="object-cover"
                    alt="background"
                    src={diffuseSrc}
                />

                <motion.div className="absolute inset-0 pointer-events-none mix-blend-color-burn">
                    <Image
                        fill
                        priority
                        quality={100}
                        sizes="100vw"
                        className="object-cover"
                        alt="displacement"
                        src={displacementSrc}
                    />
                </motion.div>
            </motion.div>

            {/* aici se afișează conținutul trimis */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
