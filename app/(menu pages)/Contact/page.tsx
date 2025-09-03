'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'

const page = () => {
  return (
    <>
    <motion.div
      initial={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      animate={{ scale: 1, borderRadius: '0px', opacity: 1 }}
      exit={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="min-h-screen bg-[#020202] px-6 py-12 text-white"
    >
      <div className="flex justify-center text-4xl mt-[100px] mb-12 font-semibold text-white/90">
        Contact
      </div>

      <div className="max-w-3xl mx-auto space-y-10">

        <div className="flex items-start gap-4">
          <Phone className="w-6 h-6 mt-1 text-[#c95d43]" />
          <div>
            <p className="text-lg font-medium text-white/90">Telefon</p>
            <a href="tel:+40712345678" className="text-white/70 hover:underline">
              +40 723 257 569
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <MapPin className="w-6 h-6 mt-1 text-[#c95d43]" />
          <div>
            <p className="text-lg font-medium text-white/90">Adresă</p>
            <p className="text-white/70">
              Strada Foișorului Nr. 119, București
            </p>
            <a
              href="https://www.google.com/maps/place/Strada+Foișorului+119,+București"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#c95d43] hover:underline"
            >
              Vezi pe Google Maps
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Mail className="w-6 h-6 mt-1 text-[#c95d43]" />
          <div>
            <p className="text-lg font-medium text-white/90">Email</p>
            <a href="mailto:contact@biserica.ro" className="text-white/70 hover:underline">
              bisericafoisor@gmail.ro
            </a>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 mt-6">
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2849.422993934138!2d26.134679315750228!3d44.43631617910293!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ffb5e7e11ebd%3A0x6b7baf545d64b6ff!2sStrada%20Foi%C8%99orului%20119%2C%20Bucure%C8%99ti!5e0!3m2!1sro!2sro!4v1691062345678!5m2!1sro!2sro"
            width="100%"
            height="350"
            style={{ border: 0, borderRadius: '10px' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Hartă Strada Foișorului 119 București"
          ></iframe>
        </div>
      </div>
    </motion.div>
    </>
  )
}

export default page
