'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Trash2, Save, X } from 'lucide-react'
import type { Todo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from "@/components/ui/card"

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: number, updates: Partial<Todo>) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(todo.task)
  const [editedDescription, setEditedDescription] = useState(todo.description || '')

  const handleSave = () => {
    if (editedTask.trim() === '') return
    onUpdate(todo.id, { task: editedTask, description: editedDescription.trim() || null })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTask(todo.task)
    setEditedDescription(todo.description || '')
    setIsEditing(false)
  }

  return (
    <Card
      className={cn(
        'transition-all duration-300 animate-in fade-in-50',
        todo.is_complete ? 'bg-muted/50 border-dashed' : 'bg-card'
      )}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.is_complete}
          onCheckedChange={(checked) => onUpdate(todo.id, { is_complete: !!checked })}
          className="mt-1 shrink-0"
          aria-label={`Mark task as ${todo.is_complete ? 'incomplete' : 'complete'}`}
        />
        {isEditing ? (
          <div className="flex-grow space-y-2">
            <Input value={editedTask} onChange={(e) => setEditedTask(e.target.value)} aria-label="Edit task title" />
            <Textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} placeholder="Description" aria-label="Edit task description"/>
          </div>
        ) : (
          <div className="flex-grow space-y-1 overflow-hidden">
            <label
              htmlFor={`todo-${todo.id}`}
              className={cn(
                'font-medium cursor-pointer break-words',
                todo.is_complete ? 'line-through text-muted-foreground' : ''
              )}
            >
              {todo.task}
            </label>
            {todo.description && (
              <p className={cn(
                'text-sm text-muted-foreground break-words',
                todo.is_complete ? 'line-through' : ''
              )}>
                {todo.description}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-1 shrink-0">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save changes">
                <Save className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="Cancel editing">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit task">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} aria-label="Delete task">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
