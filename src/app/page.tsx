import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Header from '@/app/components/header'
import TodoListClient from './components/todos/todo-list-client'
import type { Todo } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('inserted_at', { ascending: false })

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
