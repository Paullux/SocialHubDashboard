import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
export default function Navbar(){
    return(
        <header className='border-b border-white/10'>
            <div className='container flex h-16 items-center justify-between'>
                <Link href='/' className='flex items-center gap-3'>
                    <Image src="/social_hub_icon.svg" alt="Social Hub" width={36} height={36} className='rounded-md'/>
                    <span className='font-semibold tracking-wide'>
                        Social Hub
                    </span>
                </Link>
                <nav className='flex items-center gap-3'>
                    <Link href='/dashboard' className='text-sm text-neutral-300 hover:text-white'>
                        Dashboard
                    </Link>
                    <Link href='/auth/login'>
                        <Button className='text-sm'>
                            Connexion / Créer un compte
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    )}