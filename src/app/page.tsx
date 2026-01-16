export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Hello World!</h1>
        <p className="text-lg text-muted-foreground">
          This is your new blank slate.
        </p>
      </main>
    </div>
  )
}
