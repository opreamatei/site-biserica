import React from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../components/Logo";

const Footer = () => {
  const priests = [
    { name: "Preot Sorin Petre Georgescu", phone: "+40 742 039 585" },
    { name: "Preot Constantin Sandu", phone: "+40 723 929 011" },
    { name: "Preot Gheorghe Oprea", phone: "+40 723 257 569" },
  ];

  return (
    <footer className="bg-[#0b0a24] backdrop-blur-xl bg-gradient-to-b relative z-5">
      <div className="flex justify-center py-6">
        <Image
          src="/logo_negru_1.webp"
          className="invert-100 select-none"
          alt="logo"
          width={150}
          height={80}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10 lg:gap-32">
        <div className="flex flex-col md:flex-[2] lg:flex-[3] gap-4">
          <div className="flex items-start gap-4">
            <Image
              src="/icons/phone.svg"
              alt="Telefon"
              width={28}
              height={28}
              className="w-7 h-7 mt-1 md:mt-2"
            />
            <div className="flex flex-col">
              <p className="text-xl font-medium text-white/90">Telefon</p>
              <div className="text-white/70 mt-2 space-y-2">
                {priests.map((p) => (
                  <div
                    key={p.phone}
                    className="flex flex-col md:flex-col  lg:flex-row md:justify-start lg:justify-between md:items-start lg:items-center"
                  >
                    <span>{p.name}</span>
                    <a
                      href={`tel:${p.phone}`}
                      className="hover:underline text-[#c95d43] italic lg:mt-0 lg:ml-4"
                    >
                      {p.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-[1.5] lg:flex-[2] gap-2">
          <div className="flex items-start gap-4">
            <Image
              src="/icons/map.svg"
              alt="Adresa"
              width={28}
              height={28}
              className="w-7 h-7 mt-1"
            />
            <div>
              <p className="text-xl font-medium text-white/90">Adresă</p>
              <p className="text-white/70 ">
                Strada Foișorului Nr. 119, București
              </p>
              <Link
                href="https://www.google.com/maps/place/Strada+Foișorului+119,+București"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#c95d43] hover:underline"
              >
                Vezi pe Google Maps
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-[1] lg:flex-[1] gap-2">
          <div className="flex items-start gap-5 mr-2">
            <Image
              src="/icons/mail.svg"
              alt="Email"
              width={28}
              height={28}
              className="w-7 h-7 mt-1"
            />
            <div>
              <p className="text-xl font-medium text-white/90">Email</p>
              <div className="flex flex-col gap-1 mt-1">
              <a
                href="mailto:contact@bisericafoisor.ro"
                className="text-[#c95d43] lg:text-base text-md lg:text-xl hover:underline "
              >

                contact@bisericafoisor.ro
              </a>
              <a
                href="mailto:bisericafoisor@gmail.com"
                className="text-[#c95d43] lg:text-base text-md lg:text-xl hover:underline "
              >

                bisericafoisor@gmail.com
              </a>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Logo theme="light" />
      </div>
      <div className="flex justify-center py-4 text-white/80 select-none">
        <p className="text-sm sm:text-base md:text-lg">
          &copy; 2026 Biserica Foișor. Toate drepturile rezervate.
        </p>
      </div>

    </footer>
  );
};

export default Footer;
