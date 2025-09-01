import { cn } from '@/lib/utils';
export default function Button(
    {className,children,...props}:
    {className?:string}&React.ButtonHTMLAttributes<HTMLButtonElement>
){return(
    <button className={
        cn('inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 font-medium text-white shadow-soft hover:bg-brand-dark transition',
        className)
        } 
        {...props}>{children}
    </button>)}