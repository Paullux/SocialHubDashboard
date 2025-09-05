import type { Config } from 'tailwindcss'
const config: Config = {
    darkMode:'class',
    content:['./app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme:{
        container: {
            center: true,
            padding: "1rem",
        },
        screens: {
            xs: { max: "425px" }, // <= 425px
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
        },
        extend:{
            colors:{
                brand:{
                    DEFAULT:'#2563eb',dark:'#1e40af'
                }
            },
            boxShadow:{
                soft:'0 10px 30px rgba(0,0,0,0.15)'
            }
        }
    },
    plugins:[],
}
export default config
