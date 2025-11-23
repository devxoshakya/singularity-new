'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, StarIcon } from 'lucide-react';
import { motion, type Transition } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

type FREQUENCY = '1 Semester' | '2 Semesters';
const frequencies: FREQUENCY[] = ['1 Semester', '2 Semesters'];

export interface Plan {
    name: string;
    info: string;
    price: {
        '1 Semester': number;
        '2 Semesters': number;
    };
    features: {
        text: string;
        tooltip?: string;
    }[];
    btn: {
        text: string;
        href: string;
        onClick?: () => void;
    };
    highlighted?: boolean;
    isFree?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
    slug6m?: string;
    slug12m?: string;
}

interface PricingSectionProps extends React.ComponentProps<'div'> {
    plans: Plan[];
    heading: string;
    description?: string;
}

export function PricingSection({
    plans,
    heading,
    description,
    ...props
}: PricingSectionProps) {
    const [frequency, setFrequency] = React.useState<FREQUENCY>('1 Semester');
    const [checkoutLoading, setCheckoutLoading] = React.useState<string | null>(null);
    const router = useRouter();
    const { data: session } = authClient.useSession();

    // Handle checkout for a specific product using Better Auth client
    const handleCheckout = async (productSlug: string) => {
        // Check if user is logged in
        if (!session?.user) {
            // Redirect to login page
            router.push("/login");
            return;
        }

        setCheckoutLoading(productSlug);
        try {
            // Use Better Auth DodoPayments client-side checkout
            await authClient.dodopayments.checkoutSession({
                slug: productSlug,
                customer : {
                    email : session.user.email || "MAT.KAR.LALA@miet.ac.in",
                    name : session.user.name || "MIET KA DALLA",
                }
            });
            // User will be automatically redirected to DodoPayments checkout
        } catch (error) {
            console.error("Checkout error:", error);
            setCheckoutLoading(null);
        }
    };

    return (
        <div
            className={cn(
                'flex w-full flex-col items-center bg-black/80 justify-center space-y-5 p-4',
                props.className,
            )}
            {...props}
        >
            <div className="mx-auto max-w-xl space-y-2">
                <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                    {heading}
                </h2>
                {description && (
                    <p className="text-muted-foreground text-center text-sm md:text-base">
                        {description}
                    </p>
                )}
            </div>
            <PricingFrequencyToggle
                frequency={frequency}
                setFrequency={setFrequency}
            />
            <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                {plans.map((plan) => (
                    <PricingCard 
                        plan={plan} 
                        key={plan.name} 
                        frequency={frequency}
                        onCheckout={handleCheckout}
                        checkoutLoading={checkoutLoading}
                        isLoggedIn={!!session?.user}
                        router={router}
                    />
                ))}
            </div>
        </div>
    );
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
    frequency: FREQUENCY;
    setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>;
};

export function PricingFrequencyToggle({
    frequency,
    setFrequency,
    ...props
}: PricingFrequencyToggleProps) {
    return (
        <div
            className={cn(
                'bg-muted/30 mx-auto flex w-fit rounded-full border p-1',
                props.className,
            )}
            {...props}
        >
            {frequencies.map((freq) => (
                <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className="relative px-4 py-1 text-sm capitalize "
                >
                    <span className="relative z-10">{freq}</span>
                    {frequency === freq && (
                        <motion.span
                            layoutId="frequency"
                            transition={{ type: 'spring', duration: 0.4 }}
                            className="bg-foreground absolute inset-0 z-10 rounded-full mix-blend-difference"
                        />
                    )}
                </button>
            ))}
        </div>
    );
}

type PricingCardProps = React.ComponentProps<'div'> & {
    plan: Plan;
    frequency?: FREQUENCY;
    onCheckout?: (slug: string) => void;
    checkoutLoading?: string | null;
    isLoggedIn?: boolean;
    router?: any;
};

const calculateDiscount = (plan: Plan, frequency: FREQUENCY) => {
    if (plan.isFree || frequency === '1 Semester') return 0;
    
    const semPrice = plan.price['1 Semester'];
    const yearPrice = plan.price['2 Semesters'];
    const expectedPrice = semPrice * 2;
    
    return Math.round(((expectedPrice - yearPrice) / expectedPrice) * 100);
};

export function PricingCard({
    plan,
    className,
    frequency = frequencies[0],
    onCheckout,
    checkoutLoading,
    isLoggedIn,
    router,
    ...props
}: PricingCardProps) {
    const discount = calculateDiscount(plan, frequency);
    
    // Determine the current slug based on frequency
    const currentSlug = frequency === '1 Semester' ? plan.slug6m : plan.slug12m;
    const isLoading = currentSlug && checkoutLoading === currentSlug;

    return (
        <div
            key={plan.name}
            className={cn(
                'relative flex w-full flex-col bg-black/30 rounded-lg border',
                className,
            )}
            {...props}
        >
            {plan.highlighted && (
                <BorderTrail
                    style={{
                        boxShadow:
                            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                    }}
                    size={100}
                />
            )}
            <div
                className={cn(
                    'bg-muted/20 rounded-t-lg border-b p-4 relative',
                    plan.highlighted && 'bg-muted/40',
                )}
            >
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                    {plan.highlighted && (
                        <p className="bg-background flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                            <StarIcon className="h-3 w-3 fill-current" />
                            Popular
                        </p>
                    )}
                    {!plan.isFree && frequency === '2 Semesters' && discount > 0 && (
                        <p className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                            {discount}% off
                        </p>
                    )}
                </div>

                <div className="text-lg font-medium">{plan.name}</div>
                <p className="text-muted-foreground text-sm font-normal">{plan.info}</p>
                <h3 className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-bold">₹{plan.price[frequency]}</span>
                    <span className="text-muted-foreground">
                        {!plan.isFree && `/${frequency === '1 Semester' ? 'sem' : 'year'}`}
                    </span>
                </h3>
            </div>
            <div
                className={cn(
                    'text-muted-foreground space-y-4 px-4 py-6 text-sm',
                    plan.highlighted && 'bg-muted/10',
                )}
            >
            {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center bg-black/30 gap-2">
                    <Check className="text-foreground h-4 w-4" />
                    <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <p
                                        className={cn(
                                            feature.tooltip &&
                                                'cursor-pointer border-b border-dashed',
                                        )}
                                    >
                                        {feature.text}
                                    </p>
                                </TooltipTrigger>
                                {feature.tooltip && (
                                    <TooltipContent>
                                        <p>{feature.tooltip}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ))}
            </div>
            <div
                className={cn(
                    'mt-auto w-full border-t p-3 relative',
                    plan.highlighted && 'bg-muted/40',
                )}
            >
                {plan.isFree ? (
                    <Button
                        className="w-full cursor-pointer"
                        variant="outline"
                        onClick={() => {
                            if (isLoggedIn) {
                                router?.push("/dashboard");
                            } else {
                                router?.push("/login");
                            }
                        }}
                    >
                        Get Started
                    </Button>
                ) : plan.btn.onClick || (onCheckout && currentSlug) ? (
                    <Button
                        className="w-full cursor-pointer"
                        variant={plan.highlighted ? 'default' : 'outline'}
                        onClick={() => {
                            if (plan.btn.onClick) {
                                plan.btn.onClick();
                            } else if (onCheckout && currentSlug) {
                                onCheckout(currentSlug);
                            }
                        }}
                        disabled={!!(plan.disabled || isLoading)}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            plan.btn.text
                        )}
                    </Button>
                ) : (
                    <Button
                        className="w-full cursor-pointer"
                        variant={plan.highlighted ? 'default' : 'outline'}
                        asChild
                    >
                        <a href={plan.btn.href}>{plan.btn.text}</a>
                    </Button>
                )}
            </div>
        </div>
    );
}

type BorderTrailProps = {
    className?: string;
    size?: number;
    transition?: Transition;
    delay?: number;
    onAnimationComplete?: () => void;
    style?: React.CSSProperties;
};

export function BorderTrail({
    className,
    size = 60,
    transition,
    delay,
    onAnimationComplete,
    style,
}: BorderTrailProps) {
    const BASE_TRANSITION: Transition = {
        repeat: Infinity,
        duration: 5,
        ease: 'linear',
    };

    return (
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] mask-intersect mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
            <motion.div
                className={cn('absolute aspect-square bg-zinc-500', className)}
                style={{
                    width: size,
                    offsetPath: `rect(0 auto auto 0 round ${size}px)`,
                    ...style,
                }}
                animate={{
                    offsetDistance: ['0%', '100%'],
                }}
                transition={{
                    ...(transition ?? BASE_TRANSITION),
                    delay: delay,
                }}
                onAnimationComplete={onAnimationComplete}
            />
        </div>
    );
}

// Legacy export for backward compatibility
export function PricingWithCheckout() {
    const plans: Plan[] = [
        {
            name: "Basic",
            info: "Perfect for trying out Singularity",
            price: {
                "1 Semester": 0,
                "2 Semesters": 0,
            },
            features: [
                { 
                    text: "Access to ranking of all students", 
                    tooltip: "View complete student rankings" 
                },
                { 
                    text: "List of all 5700+ student database", 
                    tooltip: "Full access to student directory" 
                },
                { 
                    text: "5 free result views per semester", 
                    tooltip: "View up to 5 results each semester" 
                },
                { 
                    text: "Semester-wise SGPA only", 
                    tooltip: "Basic SGPA information" 
                },
            ],
            btn: {
                text: "Start Free",
                href: "/login",
            },
            isFree: true,
        },
        {
            name: "Pro",
            info: "For active users and small teams",
            price: {
                "1 Semester": 99,
                "2 Semesters": 179,
            },
            features: [
                { 
                    text: "Access to ranking of all students", 
                    tooltip: "View complete student rankings" 
                },
                { 
                    text: "List of all 5700+ student database", 
                    tooltip: "Full access to student directory" 
                },
                { 
                    text: "50 result views per semester", 
                    tooltip: "View up to 50 results each semester" 
                },
                { 
                    text: "Detailed result view", 
                    tooltip: "Complete result breakdown with all details" 
                },
                { 
                    text: "Latest semester marks", 
                    tooltip: "Access to most recent semester marks" 
                },
                { 
                    text: "Semester-wise SGPA", 
                    tooltip: "Detailed SGPA for each semester" 
                },
            ],
            btn: {
                text: "Get Started",
                href: "#",
            },
            slug6m: "pro-6m",
            slug12m: "pro-12m",
        },
        {
            name: "Premium",
            info: "For institutions and power users",
            price: {
                "1 Semester": 199,
                "2 Semesters": 339,
            },
            features: [
                { 
                    text: "Access to ranking of all students", 
                    tooltip: "View complete student rankings" 
                },
                { 
                    text: "List of all 5700+ student database", 
                    tooltip: "Full access to student directory" 
                },
                { 
                    text: "100 result views per semester", 
                    tooltip: "View up to 100 results each semester" 
                },
                { 
                    text: "Detailed result view", 
                    tooltip: "Complete result breakdown with all details" 
                },
                { 
                    text: "Latest semester marks", 
                    tooltip: "Access to most recent semester marks" 
                },
                { 
                    text: "Semester-wise SGPA", 
                    tooltip: "Detailed SGPA for each semester" 
                },
                { 
                    text: "Profile view tracking", 
                    tooltip: "See who has viewed your result" 
                },
                { 
                    text: "Advanced analytics", 
                    tooltip: "Detailed insights and trends" 
                },
                { 
                    text: "Priority support", 
                    tooltip: "Get help when you need it" 
                },
            ],
            btn: {
                text: "Get Started",
                href: "#",
            },
            slug6m: "premium-6m",
            slug12m: "premium-12m",
            highlighted: true,
        },
    ];

    return (
        <PricingSection 
            plans={plans}
            heading="Simple, transparent pricing"
            description="Choose the plan that's right for you"
        />
    );
}
