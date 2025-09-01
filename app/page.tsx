import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
export default function Page(){
    return(
    <section className='grid place-items-center py-24'>
        <div className='text-center space-y-8 max-w-2xl'>
            <Image src="/social_hub_icon.svg" alt="Social Hub" width={40} height={40} />
            <h1 className='text-4xl md:text-5xl font-bold'>
                Social Hub
            </h1>
            <p className='text-neutral-300'>
                Vous et vos réseaux. Centralisez vos vidéos YouTube & TikTok, et vos articles WordPress au même endroit.
            </p>
            <div className='flex items-center justify-center gap-4'>
                <Link href='/auth/login'>
                    <Button>
                        Connexion / Créer un compte
                    </Button>
                </Link>
                <Link href='/dashboard' className='text-sm text-neutral-300 hover:text-white'>
                    Voir une démo
                </Link>
            </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-100 bg-[url('/motif.png')] bg-repeat opacity-20" />
    </section>
)}