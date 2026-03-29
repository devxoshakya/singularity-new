"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, X, Send, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = ".pdf,.doc,.docx,.txt,.pptx";
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB per file

export function KnowledgeBase({
    orgId,
    orgName,
}: {
    orgId: string;
    orgName: string;
}) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragging, setDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function addFiles(incoming: FileList | null) {
        if (!incoming) return;
        const valid: UploadedFile[] = [];
        const rejected: string[] = [];

        Array.from(incoming).forEach((f) => {
            if (f.size > MAX_SIZE) {
                rejected.push(`${f.name} (too large, max 20 MB)`);
                return;
            }
            const ext = f.name.split(".").pop()?.toLowerCase();
            if (!["pdf", "doc", "docx", "txt", "pptx"].includes(ext ?? "")) {
                rejected.push(`${f.name} (unsupported format)`);
                return;
            }
            // Dedup by name
            if (files.some((existing) => existing.name === f.name)) return;
            valid.push({
                id: crypto.randomUUID(),
                file: f,
                name: f.name,
                size: f.size,
            });
        });

        if (rejected.length > 0) {
            toast.error("Some files were skipped", {
                description: rejected.join("\n"),
            });
        }
        setFiles((prev) => [...prev, ...valid]);
    }

    function removeFile(id: string) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
        },
        [files],
    );

    async function handleSubmit() {
        if (files.length === 0) return;
        setSubmitting(true);

        try {
            const form = new FormData();
            form.append("orgId", orgId);
            form.append("orgName", orgName);
            files.forEach((f) => form.append("documents", f.file, f.name));

            const res = await fetch("/api/knowledge/submit", {
                method: "POST",
                body: form,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Submission failed");

            toast.success("Documents submitted!", {
                description:
                    "The backend team has been notified and will index your documents shortly.",
            });
            setFiles([]);
        } catch (err: any) {
            toast.error("Submission failed", { description: err.message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                            Knowledge base
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                            Upload documents to be indexed by the backend team.
                            Supported: PDF, DOCX, TXT, PPTX.
                        </CardDescription>
                    </div>
                    {files.length > 0 && (
                        <Badge variant="secondary">
                            {files.length} file{files.length !== 1 ? "s" : ""}{" "}
                            queued
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Drop zone */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
                        "cursor-pointer transition-colors py-10 px-4 text-center",
                        dragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80 hover:bg-muted/30",
                    )}
                >
                    <Upload
                        className={cn(
                            "w-8 h-8",
                            dragging
                                ? "text-primary"
                                : "text-muted-foreground/50",
                        )}
                    />
                    <div>
                        <p className="text-sm font-medium">
                            {dragging
                                ? "Drop files here"
                                : "Drag & drop files here"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            or click to browse · max 20 MB per file
                        </p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED}
                        multiple
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                    />
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((f) => (
                            <div
                                key={f.id}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                            >
                                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {f.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatBytes(f.size)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeFile(f.id)}
                                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                        Files are sent to the backend team for manual indexing.
                    </p>
                    <Button
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={files.length === 0}
                        size="sm"
                        className="gap-2"
                    >
                        {submitting ? "Submitting..." : "Submit for indexing"}
                        {!submitting && <Send className="w-3.5 h-3.5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
