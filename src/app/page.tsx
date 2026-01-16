import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Header from '@/app/components/header'
import TodoListClient from './components/todos/todo-list-client'
import type { Todo } from '@/lib/types'
import { redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('inserted_at', { ascending: false })

  if (error) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-muted/40 dark:bg-background">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
          <div className="container mx-auto max-w-3xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription>
                <p>Could not fetch tasks. Your app is connected to Supabase, but the 'todos' table might be missing or misconfigured.</p>
                <p className="py-2">Please go to the Supabase SQL editor and run the script I've provided to create the table and its access policies.</p>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-medium">View Technical Error</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-md bg-destructive/10 p-2 font-mono">
                    {error.message}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 dark:bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="container mx-auto max-w-3xl">
          <TodoListClient initialTodos={todos as Todo[] ?? []} user={user} />
        </div>
      </main>
    </div>
  )
}
