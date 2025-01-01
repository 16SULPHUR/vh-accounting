import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { router } from "./Router";
import { AuthProvider, useAuth } from "./lib/auth-context";

import RouterWrapper from "./RouterWrapper";

export default function App() {


    return (
        <ThemeProvider>
            <AuthProvider>
            <RouterWrapper/>
            </AuthProvider>
        </ThemeProvider>
    )
}
