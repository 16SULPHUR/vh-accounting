import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { router } from "./Router";
import { AuthProvider } from "./lib/auth-context";

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
            <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    )
}
