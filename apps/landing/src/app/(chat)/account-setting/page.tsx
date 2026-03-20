export default function AccountSettingPage() {
    return (
        <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-4xl space-y-3">
                <h1 className="text-2xl font-semibold">Account Settings</h1>
                <p className="text-sm text-muted-foreground">
                    This page is available to both admin and member roles. Manage personal account preferences here.
                </p>
            </div>
        </main>
    );
}
