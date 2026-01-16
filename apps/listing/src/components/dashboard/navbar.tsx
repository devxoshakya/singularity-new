import { Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import UserProfile from "./avatar";
import Link from "next/link";

interface NavbarProps {
    src?: string;
    name?: string;
    email?: string;
    plan?: string;
}

const Navbar: React.FC<NavbarProps> = ({ src, name, email, plan }) => {
    return (
        <>
            <nav className="flex justify-between items-center p-2 mx-auto max-w-3xl">
                <Link href="/dashboard">
                    <img
                        src="/logo.svg"
                        alt="Singularity-Logo"
                        className="h-8 w-8"
                    />
                </Link>
                <Badge className="gap-1 py-1 px-2" variant={"outline"}>
                    <Sparkles
                        className="-ms-0.5 opacity-75 text-purple-600 fill-purple-500"
                        size={12}
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                    {plan ?? "Upgrade"}
                </Badge>
                <UserProfile src={src} name={name} email={email} />
            </nav>
        </>
    );
};

export default Navbar;
