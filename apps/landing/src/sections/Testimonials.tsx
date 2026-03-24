"use client";
import { motion } from "framer-motion";

const testimonials = [
    {
        text: '"Students used to line up outside my office just to ask about fees and schedules. Since Singularity, those questions answer themselves."',
        name: "Dr. Priya Sharma",
        title: "HOD @ MIET College",
        avatarImg: "https://cdn2.devshakya.xyz/landing/assets/avatar-1.png",
    },
    {
        text: '"Having all AKTU results pulled automatically into one dashboard has saved our admin team hours every single semester."',
        name: "Prof. Rajesh Kumar",
        title: "Registrar @ AKTU Affiliate",
        avatarImg: "https://cdn2.devshakya.xyz/landing/assets/avatar-2.png",
    },
    {
        text: '"Our students love that they can just type their roll number and instantly see their SGPA trend — no portal hunting, no waiting."',
        name: "Dr. Anita Verma",
        title: "Faculty @ Engineering College",
        avatarImg: "https://cdn2.devshakya.xyz/landing/assets/avatar-3.png",
    },
    {
        text: '"The knowledge base chat is surprisingly accurate. It pulled the exact hostel fee breakdown our students needed, right from our own documents."',
        name: "Prof. Mukesh Rawat",
        title: "Project Mentor @ MIET",
        avatarImg: "https://cdn2.devshakya.xyz/landing/assets/avatar-4.png",
    },
];

export const Testimonials = () => {
    return (
        <section className="py-20 md:py-24">
            <div className="container">
                <h2 className="text-5xl md:text-6xl text-center tracking-tighter font-medium">
                    Beyond Expectations.
                </h2>
                <p className="text-lg text-white/70 text-center mt-5 tracking-tight max-w-md mx-auto">
                    Our revolutionary automated tool has transformed AKTU
                    faculty result processing strategies.
                </p>

                <div className="flex overflow-hidden mt-10 mask-[linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                    <motion.div
                        initial={{
                            translateX: "0%",
                        }}
                        animate={{
                            translateX: "-50%",
                        }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 30,
                        }}
                        className="flex flex-none gap-5 pr-5 -translate-x-1/2"
                    >
                        {[...testimonials, ...testimonials].map(
                            (testimonial, _) => (
                                <div
                                    key={Math.random()}
                                    className="border border-white/15 p-6 md:p-10 rounded-xl bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.3),black)] max-w-xs md:max-w-md flex-none"
                                >
                                    <div className="text-lg md:text-2xl tracking-tight">
                                        {testimonial.text}
                                    </div>
                                    <div className="flex items-center gap-3 mt-5">
                                        <div className="relative after:content-[''] after:absolute after:inset-0 after:bg-[rgb(140,69,244)] after:mix-blend-soft-light before:content-[''] before:absolute before:inset-0 before:border before:border-white/30 before:z-10 before:rounded-lg">
                                            <img
                                                src={testimonial.avatarImg}
                                                alt={testimonial.name}
                                                className="h-11 w-11 rounded-lg grayscale"
                                            />
                                        </div>
                                        <div className="">
                                            <div className="">
                                                {testimonial.name}
                                            </div>
                                            <div className="text-white/50 text-sm">
                                                {testimonial.title}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
