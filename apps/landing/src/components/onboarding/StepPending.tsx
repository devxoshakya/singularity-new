"use client";

import { Clock3, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function StepPending({ orgName }: { orgName: string | null }) {
  return (
    <>
      <Button variant="ghost" className="absolute top-7 left-5 z-20" asChild>
        <Link href="/">
          <ChevronLeftIcon className="me-2 size-4" />
          Back
        </Link>
      </Button>
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-400">
          <Clock3 className="size-6" />
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-wide text-white">Request sent</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          Your request to join
          {orgName ? <span className="font-medium text-foreground"> {orgName}</span> : " the organisation"} is pending admin approval.
          You will get access as soon as they accept.
        </p>

        <div className="mt-5">
          <Badge variant="secondary">Pending approval</Badge>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">You can safely close this tab.</p>
      </div>
    </>
  );
}
