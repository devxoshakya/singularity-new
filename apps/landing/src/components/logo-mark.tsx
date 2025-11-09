import { cn } from "@/lib/utils";

export const LogoMark = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#ffffff"
            viewBox="0 0 120 120"
            className={cn("size-20 fill-white", className)}
        >
            <path
                fill="#ffffff"
                fillRule="evenodd"
                d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                clipRule="evenodd"
            ></path>
        </svg>
    );
};
