import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite"

export default defineConfig(({ command }) => {
  const isProd = command === 'build'

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    server: {
      host: "0.0.0.0",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})