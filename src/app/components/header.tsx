import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { ListTodo } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">TaskMaster Pro</h1>
        </div>
        <form action={signOut}>
          <Button variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </div>
    </header>
  )
}
