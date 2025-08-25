'use client'
import React from 'react'
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const page = () => {
    return (
    <>
    <Navbar />
    <motion.div
      initial={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      animate={{ scale: 1, borderRadius: '0px', opacity: 1 }}
      exit={{ scale: 0.95, borderRadius: '30px', opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="min-h-screen bg-[#020202] px-6 py-12 text-white"
    >
            <div className="flex justify-center text-white text-4xl mt-[100px] mb-12">
                Prezentare biserica
            </div>
            <div className='text-white'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vitae lectus nec mi ornare vehicula. In vulputate elit ut maximus tristique. Proin congue pretium accumsan. Proin vel dignissim ligula. Donec luctus orci sed egestas rutrum. Integer vitae pellentesque metus. Donec porta pulvinar nulla nec mattis.
            <br /><br />
                Ut fringilla imperdiet erat et volutpat. Integer ut magna non sem feugiat efficitur in posuere elit. Quisque venenatis posuere tristique. Nulla facilisi. Vestibulum id leo fringilla, maximus sem vitae, imperdiet risus. Proin aliquam nulla non odio molestie, nec molestie dui pulvinar. Integer placerat viverra diam vel cursus.
                Maecenas vel enim eleifend, pretium lacus eu, pharetra nunc. Phasellus a ante ut diam egestas fermentum ut vitae diam. Lorem ipsum dolor sit amet, consectetur adipiscing elit. <br /><br />

                Praesent at neque in orci pulvinar facilisis ac et eros. Donec dapibus sed tellus quis faucibus. Morbi mattis ligula quam, et finibus justo imperdiet quis. Donec consequat varius dapibus. In consequat purus vel tincidunt pulvinar. Maecenas pulvinar lectus quis turpis fermentum, at volutpat felis congue.
                Integer rhoncus dolor vitae urna aliquam, quis consequat tellus iaculis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut vel nisi ac quam lobortis placerat. Integer imperdiet maximus magna ac bibendum. Nullam elit nunc, tincidunt sit amet sem ut, vulputate interdum lectus. <br /><br />
                Pellentesque eget tristique orci. Etiam et sem vel quam fringilla pulvinar. Duis tristique elit at dui vehicula, et ornare purus dignissim. Suspendisse malesuada est non augue dictum pharetra. Maecenas pharetra quis lacus vel interdum.</div>

        </motion.div>
        </>
    )
}

export default page