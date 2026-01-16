'use client'

import { useState, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Todo } from '@/lib/types'
import TodoItem from './todo-item'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AddTodoForm from './add-todo-form'
import { useToast } from "@/hooks/use-toast"
import { Separator } from '@/components/ui/separator'

export default function TodoListClient({ initialTodos, user }: { initialTodos: Todo[], user: User }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    setTodos(initialTodos)
  }, [initialTodos])

  useEffect(() => {
    const channel = supabase
      .channel('realtime-todos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((prevTodos) => [payload.new as Todo, ...prevTodos])
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prevTodos) =>
              prevTodos.map((todo) =>
                todo.id === (payload.new as Todo).id ? { ...todo, ...(payload.new as Todo) } : todo
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== (payload.old as Todo).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id, setTodos])

  const handleAddTodo = async (task: string, description: string | null) => {
    const { error } = await supabase.from('todos').insert({ task, description, user_id: user.id })
    if (error) {
      toast({ variant: 'destructive', title: 'Error adding task', description: error.message })
    }
  }

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    const { error } = await supabase.from('todos').update(updates).eq('id', id)
    if (error) {
      toast({ variant: 'destructive', title: 'Error updating task', description: error.message })
    }
  }
  
  const handleDeleteTodo = async (id: number) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting task', description: error.message })
    }
  }

  const { completedTodos, incompleteTodos } = useMemo(() => {
    const completed = todos.filter(todo => todo.is_complete)
    const incomplete = todos.filter(todo => !todo.is_complete)
    return { completedTodos: completed, incompleteTodos: incomplete }
  }, [todos])
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Manage your daily tasks and stay organized.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AddTodoForm onAdd={handleAddTodo} />

        <div className="space-y-4">
          {incompleteTodos.length > 0 ? (
            <div className="space-y-4">
              {incompleteTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={handleUpdateTodo} onDelete={handleDeleteTodo} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground pt-4">You have no pending tasks. Great job!</p>
          )}

          {completedTodos.length > 0 && (
             <>
                <div className="relative py-2">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-sm text-muted-foreground">Completed</span>
                </div>

                <div className="space-y-4">
                {completedTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onUpdate={handleUpdateTodo} onDelete={handleDeleteTodo} />
                ))}
                </div>
            </>
          )}

          {todos.length === 0 && (
            <p className="text-center text-muted-foreground pt-4">You have no tasks yet. Add one above to get started!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
