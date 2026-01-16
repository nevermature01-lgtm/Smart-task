import Link from 'next/link'
import { signUp } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ListTodo } from 'lucide-react'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 dark:bg-background">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <ListTodo className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">TaskMaster Pro</h1>
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={signUp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {searchParams.message && (
                 <p className="rounded-md bg-accent/20 p-2 text-center text-sm font-medium text-foreground">
                  {searchParams.message}
                </p>
              )}
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
