'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function AddTodoForm({ onAdd }: { onAdd: (task: string, description: string | null) => Promise<void> }) {
  const [task, setTask] = useState('')
  const [description, setDescription] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim()) return
    await onAdd(task, description.trim() || null)
    setTask('')
    setDescription('')
    setIsOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="flex-grow"
          aria-label="New task"
        />
        <Button type="submit" size="icon" aria-label="Add Task">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="link" className="flex items-center gap-1 p-0 h-auto text-sm text-muted-foreground">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            {description ? 'Edit description' : 'Add description'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <Textarea
            placeholder="Add more details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2"
          />
        </CollapsibleContent>
      </Collapsible>
    </form>
  )
}
