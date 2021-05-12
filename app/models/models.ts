export interface Session {
  started: Date | null
  stopped: Date | null

  reminders: Reminder[]
}

export const startSession = (s: Session): Session => ({
  ...s,
  started: new Date(),
  stopped: null,
  reminders: s.reminders?.map(r => startReminder(r)),
})

export const stopSession = (s: Session): Session => ({
  ...s,
  stopped: new Date(),
})

export const addReminder = (s: Session, r: Reminder): Session => ({
  ...s,
  reminders: [...s.reminders, r],
})

export const updateReminderConfig = (
  s: Session,
  i: number,
  name: string,
  interval: number
): Session => ({
  ...s,
  reminders: [...s.reminders].map((r, j) => {
    if (i !== j) {
      return r
    }
    return {
      ...r,
      name,
      interval,
    }
  }),
})

export const removeReminder = (s: Session, r: Reminder): Session => ({
  ...s,
  reminders: [...s.reminders].filter(r2 => r !== r2),
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
  todos: r.todos?.map(t => ({
    ...t,
    complete: false,
  })),
  nextDue: new Date(new Date().getTime() + r.interval * 60000),
  child: r.child ? startReminder(r.child) : null,
})

export const completeIteration = (r: Reminder): Reminder => ({
  ...r,
  completed: r.completed + 1,
  todos: r.todos?.map(t => ({
    ...t,
    complete: false,
  })),
  nextDue: new Date(new Date().getTime() + r.interval * 60000),
  child: r.child ? renewReminder(r.child) : null,
})

export const renewReminder = (r: Reminder): Reminder => ({
  ...r,
  todos: r.todos?.map(t => ({
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
    !r.todos.find(t => !t.name) &&
    (!r.child || isReminderStartable(r.child))
  )
}

export const isReminderComplete = (s: Session, ri: number) => {
  return !s.reminders[ri].todos.some(t => !t.complete)
}

export const completeTodo = (s: Session, ri: number, tn: string): Session => {
  const ns = updateTodoComplete(s, ri, tn, true)
  if (isReminderComplete(ns, ri)) {
    return {
      ...s,
      reminders: [...s.reminders].map((r, i) => {
        if (ri !== i) {
          return r
        }
        return completeIteration(r)
      }),
    }
  }
  return ns
}

export const uncompleteTodo = (s: Session, ri: number, tn: string): Session => {
  return updateTodoComplete(s, ri, tn, false)
}

const updateTodoComplete = (s: Session, ri: number, tn: string, complete: boolean): Session => ({
  ...s,
  reminders: [...s.reminders].map((r, i) => {
    if (i !== ri) {
      return r
    }
    return {
      ...r,
      todos: r.todos.map((t, j) => {
        if (t.name !== tn) {
          return t
        }
        return {
          ...t,
          complete,
        }
      }),
    }
  }),
})

interface Todo {
  name: string
  complete: boolean
}
