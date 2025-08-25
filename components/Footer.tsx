import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
    return (
        <div className='bg-[#000E29]'>
            <div className='flex place-content-center'>
                <Image src="/logo alb.jpg" alt="logo" width={150} height={80} />
            </div>
            <div className='text-white flex flex-col mt-[50px] ml-[40px]'>
                <Link href="/Contact">Contact</Link>
                <br />
                Adresa:
                <br />
                <br />
                Nr telefon:
            </div>
            <div className='flex place-content-center mt-[30px]'>
            <Image src="/footer black.png" alt="logo" width={250} height={180} />
            </div>
        </div>
    )
}

export default Footer