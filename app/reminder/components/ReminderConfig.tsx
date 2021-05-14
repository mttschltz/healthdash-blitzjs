import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Heading,
  Box,
  Button,
} from '@chakra-ui/react'
import { Form, Formik, Field, useFormikContext, FieldArray } from 'formik'
import debounce from 'just-debounce-it'
import React, { FunctionComponent, useCallback } from 'react'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}
interface ReminderConfigProps {
  initialValues: Partial<ReminderConfigValues>
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
}

export interface ReminderConfigValues {
  name: string
  interval: number
  todos: string[]
  child?: ReminderConfigValues
}

type ReminderConfigValuesStrings = Omit<ReminderConfigValues, 'interval'> & {
  interval: string
}

const AutoSave = ({ debounceMs }) => {
  const formik = useFormikContext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSubmit = useCallback(
    debounce(() => formik.submitForm(), debounceMs),
    [debounceMs, formik.submitForm, debounce]
  )

  React.useEffect(() => {
    debouncedSubmit()
  }, [debouncedSubmit, formik.values])

  return null
}

const validateReminderValues = (
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
) => (values: ReminderConfigValuesStrings) => {
  const errors: RecursivePartial<ReminderConfigValuesStrings> = {}
  let hasErrors = false

  // Parent
  if (!values.name) {
    errors.name = 'Required'
    hasErrors = true
  }
  if (!parseInt(values.interval, 10)) {
    errors.interval = 'Required'
    hasErrors = true
  }
  if (values.todos.length === 0 || !values.todos?.some(t => t !== '')) {
    errors.todos = []
    errors.todos[values.todos.length] = 'At least 1 Todo is required'
    hasErrors = true
  }

  // Child
  if (values.child) {
    if (!values.child.name) {
      errors.child = errors.child || {}
      errors.child.name = 'Required'
      hasErrors = true
    }
  }

  if (hasErrors) {
    onUpdate({ name: '', interval: 0, todos: [] }, false)
  }
  return errors
}

export const ReminderConfig: FunctionComponent<ReminderConfigProps> = ({
  initialValues,
  onUpdate,
}) => {
  return (
    <Formik
      initialValues={{
        name: initialValues.name || '',
        interval: initialValues.interval + '' || '',
        todos: initialValues.todos || [],
      }}
      validate={validateReminderValues(onUpdate)}
      onSubmit={values => {
        return new Promise(resolve =>
          setTimeout(() => {
            onUpdate(
              {
                ...values,
                interval:
                  typeof values.interval === 'number'
                    ? values.interval
                    : parseInt(values.interval, 10),
                child: !values.child
                  ? undefined
                  : { ...values.child, interval: values.child.interval },
              },
              true
            )
            resolve(null)
          }, 500)
        )
      }}
      render={({ values, errors, setFieldValue }) => (
        <Form>
          <AutoSave debounceMs={200} />
          <Stack spacing={4} maxW='md' bgColor='lightgray' p={2}>
            <Field name='name'>
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.name && form.touched.name}>
                  <FormLabel htmlFor='name'>Name</FormLabel>
                  <Input {...field} id='name' placeholder='name' />
                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name='interval'>
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.interval && form.touched.interval}>
                  <FormLabel htmlFor='interval'>Interval</FormLabel>
                  <Input {...field} id='interval' placeholder='' />
                  <FormErrorMessage>{form.errors.interval}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Heading size='sm'>Todos</Heading>
            <FieldArray
              name='todos'
              render={arrayHelpers => (
                <div>
                  {values.todos && values.todos.length > 0 ? (
                    values.todos.map((todo, index) => (
                      <div key={index}>
                        <Field name={`todos.${index}`} />
                        <button
                          type='button'
                          onClick={() => arrayHelpers.remove(index)} // remove a todo from the list
                        >
                          [ - ]
                        </button>
                        &nbsp;&nbsp;
                        <button
                          type='button'
                          onClick={() => arrayHelpers.insert(index, '')} // insert an empty string at a position
                        >
                          [ + ]
                        </button>
                      </div>
                    ))
                  ) : (
                    <button type='button' onClick={() => arrayHelpers.push('')}>
                      {/* show this when user has removed all todos from the list */}
                      Add
                    </button>
                  )}
                  {/* TODO: Update this and above to use chakra forms */}
                  <Box>{errors.todos && errors.todos}</Box>
                </div>
              )}
            />
            {/* Child */}
            {!values.child ? (
              <Button
                onClick={() =>
                  setFieldValue('child', {
                    interval: 2,
                    name: 'Micro break',
                    todos: ['Stretch', 'Drink water'],
                  })
                }
              >
                Add Intermediate Reminder
              </Button>
            ) : (
              <>
                <Heading size='sm'>Intermediate Reminder</Heading>
                <Field name='child.name'>
                  {({ field, form }) => (
                    <FormControl isInvalid={form.errors.child?.name && form.touched.child.name}>
                      <FormLabel htmlFor='child-name'>Name</FormLabel>
                      <Input {...field} id='child-name' placeholder='child-name' />
                      <FormErrorMessage>{form.errors.child?.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                {/* <Field name='interval'>
              {({ field, form }) => (
                <FormControl isInvalid={form.errors.interval && form.touched.interval}>
                  <FormLabel htmlFor='interval'>Interval</FormLabel>
                  <Input {...field} id='interval' placeholder='' />
                  <FormErrorMessage>{form.errors.child.interval}</FormErrorMessage>
                </FormControl>
              )}
            </Field> */}
                <Button onClick={() => setFieldValue('child', undefined)}>
                  remove Intermediate Reminder
                </Button>
              </>
            )}
          </Stack>
        </Form>
      )}
    />
  )
}
