import React from "react";
import Link from "next/link";
import Footer from "../components/Footer";

const Layout = ({ children }) => {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/volunteer">Volunteer Events</Link>
        <Link href="/donate">Donate</Link>
        <Link href="/stories">Stories</Link>
      </nav>
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
