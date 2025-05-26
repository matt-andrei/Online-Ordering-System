import React from 'react';
import NavBar from './NavBar';

export default function Layout({ children }) {
    return (
        <div className="flex">
            {/* Sidebar */}
            <NavBar />

            {/* Main content */}
            <div className="flex-1 ml-64 p-5">
                {children}
            </div>
        </div>
    );
}
