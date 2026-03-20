import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// This route receives the uploaded files and emails the backend team
// using your existing email provider (Resend, Nodemailer, etc.)
// The files are sent as attachments so the team can add them to the vector DB

export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const orgId = form.get("orgId") as string
    const orgName = form.get("orgName") as string
    const files = form.getAll("documents") as File[]

    if (!files.length) {
        return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Convert files to base64 for email attachment
    const attachments = await Promise.all(
        files.map(async f => ({
            filename: f.name,
            content: Buffer.from(await f.arrayBuffer()).toString("base64"),
            contentType: f.type,
            encoding: "base64" as const,
        }))
    )

    // ── Send email (Resend example — swap for your email provider) ──────────────
    // import { Resend } from "resend"
    // const resend = new Resend(process.env.RESEND_API_KEY)
    //
    // await resend.emails.send({
    //   from:        "noreply@yourapp.com",
    //   to:          process.env.BACKEND_TEAM_EMAIL!,
    //   subject:     `[Singularity] New documents for indexing — ${orgName}`,
    //   text:        `Org: ${orgName} (${orgId})\nFiles: ${files.map(f => f.name).join(", ")}\nSubmitted by user: ${userId}`,
    //   attachments,
    // })
    // ───────────────────────────────────────────────────────────────────────────

    // TODO: replace the comment block above with your actual email call
    // For now, log so you can verify the route works during development
    console.log("[knowledge/submit]", {
        orgId,
        orgName,
        userId,
        files: files.map(f => ({ name: f.name, size: f.size })),
    })

    return NextResponse.json({ success: true })
}