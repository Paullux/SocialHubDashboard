import type { Config } from 'tailwindcss'
const config: Config = {darkMode:'class',content:['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],theme:{extend:{colors:{brand:{DEFAULT:'#2563eb',dark:'#1e40af'}},boxShadow:{soft:'0 10px 30px rgba(0,0,0,0.15)'}}},plugins:[],}
export default config
