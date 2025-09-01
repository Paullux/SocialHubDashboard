import type { Metadata } from 'next';
import './../styles/globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata={
    title:'Social Hub',description:'Vous et vos réseaux',
};
export default function RootLayout(
    {children}:
    {children:React.ReactNode}
){return(
    <html lang='fr' className='dark'>
        <body>
            <Navbar/>
            <main className='container py-10'>{children}
            </main>
        </body>
    </html>
)}