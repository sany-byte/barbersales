import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    // Разрешаем Vite принимать запросы с твоего домена
allowedHosts: [
      'barber.votdomen.ru', 
      'barbersales.ru', 
      'www.barbersales.ru'
    ]
  }
})
