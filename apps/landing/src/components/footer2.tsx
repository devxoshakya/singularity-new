
import { FaHeart } from "react-icons/fa";
import { Footer } from "./footer";
import { Logo } from "./Navbar";
export function Footer2() {
    return (
        <div className="w-full max-w-300 mx-auto">
            <footer className="bg-muted/10 rounded-3xl border border-input p-2 w-full">
                <Footer />
                <div className="pt-4 pb-4 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center my-4 mb-8 gap-2">
                                <div className="flex items-center justify-center">
                                    <Logo />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="border-t border-border/50 pt-8">
                            <div className="flex flex-col md:flex-row justify-between items-center">
                                <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
                                    <p className="text-sm text-muted-foreground">
                                        © {new Date().getFullYear()}{" "}
                                        Singularity. Made with{" "}
                                        <FaHeart className="inline h-3 w-3 text-red-500 fill-current" />{" "}
                                        by Singularity Team.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
