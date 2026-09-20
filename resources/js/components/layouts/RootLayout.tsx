import React from "react";
import { Outlet } from "react-router-dom";

const RootLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-blue-50">
            {/* Animated Background Pattern */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
            </div>

            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
};

export default RootLayout;
