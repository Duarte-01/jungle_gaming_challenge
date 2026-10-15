import { useId, type InputHTMLAttributes } from 'react'

export function FormField({
  label,
  error,
  containerClassName = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  containerClassName?: string
}) {
  const id = useId()
  return (
    <div className={`form-field ${containerClassName}`}>
      <label htmlFor={id}>
        {label}
        {props.required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        {...props}
        aria-label={props['aria-label'] ?? label}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [props['aria-describedby'], error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
