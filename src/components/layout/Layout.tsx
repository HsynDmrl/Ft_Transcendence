import type { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = {
    children: ReactNode;
};

export default function Layout({ children }: Props) {
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <Navbar />
            <main className="max-w-7xl mx-auto p-4">{children}</main>
        </div>
    );
}
