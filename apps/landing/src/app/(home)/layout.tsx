import type { ReactNode } from "react";
import NavBar from "@/components/Navbar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-480 mx-auto px-4">
        <NavBar />
      </div>
      {children}
    </div>
  );
}