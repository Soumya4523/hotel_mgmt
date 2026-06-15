import { createContext, useContext, useEffect, useMemo, useState} from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }){
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved == 'light' || saved == 'dark') return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    useEffect(() => {
        const root = document.documentElement
        if(theme==='dark') root.classList.add('dark')
        else root.classList.remove('dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const value = useMemo(() => ({
        theme,
        toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
        setTheme,
    }), [theme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error (' useTheme must be used within ThemeProvider')
    return ctx
}