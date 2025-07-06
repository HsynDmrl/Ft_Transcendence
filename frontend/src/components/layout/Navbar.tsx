import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/user/UserContext";

export default function Navbar() {
    const { user, logout } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-md fixed w-full z-10 top-0">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                    Transandence 🏓
                </Link>

                {/* Hamburger Button (mobil) */}
                <button
                    className="md:hidden text-gray-700 focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {menuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>

                {/* Menü (desktop ve mobil için) */}
                <div
                    className={`flex-col md:flex-row md:flex md:items-center w-full md:w-auto absolute md:static top-full left-0 bg-white md:bg-transparent border md:border-0 md:shadow-none shadow-lg md:shadow-none rounded-b-md md:rounded-none transition-transform duration-300 ease-in-out ${menuOpen ? "translate-y-0" : "-translate-y-96"
                        } md:translate-y-0`}
                >
                    <Link
                        to="/"
                        className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium md:inline-block"
                        onClick={() => setMenuOpen(false)}
                    >
                        Anasayfa
                    </Link>
                    <Link
                        to="/play"
                        className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium md:inline-block"
                        onClick={() => setMenuOpen(false)}
                    >
                        Oyna
                    </Link>
                    <Link
                        to="/leaderboard"
                        className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium md:inline-block"
                        onClick={() => setMenuOpen(false)}
                    >
                        Skor Tablosu
                    </Link>

                    {user ? (
                        <>
                            <Link
                                to="/profile"
                                className="block px-4 py-2 text-gray-800 font-semibold hover:underline md:inline-block"
                                onClick={() => setMenuOpen(false)}
                            >
                                {user.firstName}
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setMenuOpen(false);
                                }}
                                className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 md:inline-block md:ml-4"
                            >
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium md:inline-block"
                                onClick={() => setMenuOpen(false)}
                            >
                                Giriş
                            </Link>
                            <Link
                                to="/register"
                                className="block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium md:inline-block"
                                onClick={() => setMenuOpen(false)}
                            >
                                Kayıt Ol
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
