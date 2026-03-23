"use client";

type LoaderProps = {
    compact?: boolean;
};

const Loader = ({ compact = false }: LoaderProps) => {
    if (compact) {
        return (
            <div className="w-full">
                <p className="mb-1.5 text-xs text-muted-foreground">
                    Syncing latest chat...
                </p>
                <div className="relative h-1 w-full overflow-hidden rounded-md bg-accent">
                    <div className="animate-slide h-full w-full bg-foreground dark:bg-list-background" />
                </div>

                <style jsx>{`
                    @keyframes slide {
                        0% {
                            transform: translateX(-100%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }

                    .animate-slide {
                        animation: slide 1s infinite;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="z-9999 flex h-screen flex-col items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="w-24 h-24 mb-3" />
            <p className="my-1.5 text-sm">
                Powered by <span className="font-bold">Singularity Team</span>
            </p>
            <div className="relative h-1 w-62.5 overflow-hidden rounded-md bg-accent">
                <div className="animate-slide h-full w-full bg-foreground dark:bg-list-background" />
            </div>

            <style jsx>{`
                @keyframes slide {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                .animate-slide {
                    animation: slide 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default Loader;
