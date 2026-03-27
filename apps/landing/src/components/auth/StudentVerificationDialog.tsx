"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StudentVerificationDialogProps {
    isOpen: boolean;
}

export function StudentVerificationDialog({ isOpen }: StudentVerificationDialogProps) {
    const [rollNo, setRollNo] = useState("");
    const [dob, setDob] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"input" | "confirm">("input");
    const [studentData, setStudentData] = useState<any>(null);
    const router = useRouter();

    const handleFetchStudent = async () => {
        if (!rollNo || !dob) {
            toast.error("Please enter both Roll Number and DOB");
            return;
        }
        setLoading(true);
        try {
            // Note: URL adjusted based on user prompt /pai/results... assuming /api/results
            // It could be an external service hosted somewhere or a typo for /api.
            const res = await fetch(`https://h.devshakya.xyz/api/result/by-rollno?rollNo=${encodeURIComponent(rollNo)}`);
            if (!res.ok) {
                toast.error("Student not found");
                setLoading(false);
                return;
            }
            const data = await res.json();
            
            // Expected sample data layout
            setStudentData(data.data);
            setStep("confirm");
        } catch (error) {
            toast.error("Failed to fetch student details. Service might be down.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orguser/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    rollNo, 
                    dob, 
                    year: studentData?.year.toString()
                })
            });
            if (!res.ok) {
                toast.error("Failed to save student details");
                setLoading(false);
                return;
            }
            toast.success("Verification successful");
            // Force reload to let layout.tsx pick up the new DB state
            window.location.reload();
        } catch (error) {
            toast.error("An error occurred");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Student Verification</DialogTitle>
                    <DialogDescription>
                        Please verify your student identity to gain access to the app.
                    </DialogDescription>
                </DialogHeader>

                {step === "input" && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Roll Number</label>
                            <Input 
                                placeholder="Enter your roll number" 
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date of Birth</label>
                            <Input 
                                type="date"
                                placeholder="YYYY-MM-DD" 
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleFetchStudent} disabled={loading}>
                            {loading ? "Fetching..." : "Continue"}
                        </Button>
                    </div>
                )}

                {step === "confirm" && studentData && (
                    <div className="space-y-4 py-4">
                        <div className="rounded-md border p-4 space-y-2 bg-muted/50">
                            <p className="text-sm"><strong>Name:</strong> {studentData.fullName || "N/A"}</p>
                            <p className="text-sm"><strong>Father's Name:</strong> {studentData.fatherName || "N/A"}</p>
                            <p className="text-sm"><strong>Course:</strong> {studentData.course || "N/A"}</p>
                            <p className="text-sm"><strong>Year:</strong> {studentData.year || "N/A"}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Is this you?</p>
                        <div className="flex gap-2 items-center justify-center">
                            <Button variant="outline" className="w-32" onClick={() => setStep("input")} disabled={loading}>
                                No, retry
                            </Button>
                            <Button className="w-32" onClick={handleConfirm} disabled={loading}>
                                {loading ? "Saving..." : "Yes, confirm"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
