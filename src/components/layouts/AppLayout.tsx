import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import MenubarComponent from "./Header";

export function Applayout() {
    return (
        <>
            <MenubarComponent />
            <div className="flex-grow flex flex-col">
                <div className="container px-4 md:px-8 flex-grow flex flex-col">
                    <Outlet />
                </div>
            </div>
            <div className="container px-4 md:px-8">
                <Footer />
            </div>
        </>
    )
}
