export interface Session {
  started: Date | null
  stopped: Date | null

  reminders: Reminder[]
}

export const startSession = (s: Session): Session => ({
  ...s,
  started: new Date(),
  stopped: null,
  reminders: s.reminders?.map((r) => startReminder(r)),
})

export const stopSession = (s: Session): Session => ({
  ...s,
  stopped: new Date(),
})

export interface Reminder {
  name: string
  interval: number
  child: Reminder | null
  todos: Todo[]

  completed: number
  nextDue: Date | null
}

export const startReminder = (r: Reminder): Reminder => ({
  ...r,
  completed: 0,
  todos: r.todos?.map((t) => ({
    ...t,
    complete: false,
  })),
  nextDue: new Date(new Date().getTime() + r.interval * 60000),
  child: r.child ? startReminder(r.child) : null,
})

export const completeIteration = (r: Reminder): Reminder => ({
  ...r,
  completed: r.completed + 1,
  todos: r.todos?.map((t) => ({
    ...t,
    complete: false,
  })),
  nextDue: new Date(new Date().getTime() + r.interval * 60000),
  child: r.child ? renewReminder(r.child) : null,
})

export const renewReminder = (r: Reminder): Reminder => ({
  ...r,
  todos: r.todos?.map((t) => ({
    ...t,
    complete: false,
  })),
  nextDue: new Date(new Date().getTime() + r.interval * 60000),
})

export const isReminderStartable = (r: Reminder) => {
  return (
    r.name &&
    r.interval &&
    r.todos?.length &&
    !r.todos.find((t) => !t.name) &&
    (!r.child || isReminderStartable(r.child))
  )
}

interface Todo {
  name: string
  complete: boolean
}
