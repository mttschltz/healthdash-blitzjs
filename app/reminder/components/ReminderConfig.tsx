import { Stack, FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react'
import { Form, Formik, Field, useFormikContext } from 'formik'
import debounce from 'just-debounce-it'
import React, { FunctionComponent, useCallback } from 'react'

interface ReminderConfigProps {
  initialValues: Partial<ReminderConfigValues>
  onUpdate: (values: ReminderConfigValues, valid: Boolean) => void
}
export interface ReminderConfigValues {
  name: string
  interval: number
}

type ReminderConfigValuesStrings = Omit<ReminderConfigValues, 'interval'> & { interval: string }

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
  const errors: Partial<ReminderConfigValuesStrings> = {}
  let hasErrors

  if (!values.name) {
    errors.name = 'Required'
    hasErrors = true
  }
  if (!parseInt(values.interval, 10)) {
    errors.interval = 'Required'
    hasErrors = true
  }
  if (hasErrors) {
    onUpdate({ name: '', interval: 0 }, false)
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
        name: initialValues?.name || '',
        interval: initialValues?.interval || '',
      }}
      validate={validateReminderValues(onUpdate)}
      onSubmit={values => {
        return new Promise(resolve =>
          setTimeout(() => {
            console.log('submitted', JSON.stringify(values, null, 2))
            onUpdate(
              {
                ...values,
                interval:
                  typeof values.interval === 'number'
                    ? values.interval
                    : parseInt(values.interval, 10),
              },
              true
            )
            resolve(null)
          }, 500)
        )
      }}
      render={() => (
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
          </Stack>
        </Form>
      )}
    />
  )
}
