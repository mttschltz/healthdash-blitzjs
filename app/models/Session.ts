interface Session {
  started: Date | null
  stopped: Date | null

  reminders: Reminder[]
}

export const startSession = (s: Session) => {
  s.started = new Date()
  s.stopped = null
  s.reminders?.forEach((r) => startReminder(r))
}

interface Reminder {
  name: string
  interval: number
  child: Reminder
  todos: Todo[]

  completed: number
  nextDue: Date | null
}

export const startReminder = (r: Reminder) => {
  r.completed = 0
  r.todos?.forEach((t) => {
    t.complete = false
  })
  r.nextDue = new Date(new Date().getTime() + r.interval * 60000)

  startReminder(r.child)
}

export const completeIteration = (r: Reminder) => {
  r.completed = r.completed + 1
  r.todos?.forEach((t) => {
    t.complete = false
  })
  r.nextDue = new Date(new Date().getTime() + r.interval * 60000)

  renewReminder(r.child)
}

export const renewReminder = (r: Reminder) => {
  r.todos?.forEach((t) => {
    t.complete = false
  })
  r.nextDue = new Date(new Date().getTime() + r.interval * 60000)
}

export const isReminderStartable = (r: Reminder) => {
  return (
    r.name &&
    r.interval &&
    r.todos?.length &&
    !r.todos.find((t) => !t.name) &&
    isReminderStartable(r.child)
  )
}

interface Todo {
  name: string
  complete: boolean
}
