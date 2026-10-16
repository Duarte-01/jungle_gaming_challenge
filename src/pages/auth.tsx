import { useRef, useState } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { login, problemFrom, register } from '../api/account'
import { defaultSearch } from '../api/catalog'
import { acceptSession } from '../auth/session-cache'
import { fieldErrors, loginSchema, registerSchema, safeReturnTo } from '../domain/account'
import { FormField } from '../components/form-field'
import { Button } from '../components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { HomePage } from './home'
import { PasswordField } from '../components/password-field'
import { BrandIcon } from '../components/brand-icon'
import { authCancelDestination } from '../auth/navigation'

const signUpSchema = registerSchema
  .extend({ confirmPassword: registerSchema.shape.password })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas devem ser iguais.',
  })

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const search = useSearch({ strict: false })
  const returnTo = safeReturnTo(search.redirect)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const isRegister = mode === 'register'
  const auth = useMutation({
    mutationKey: ['account-auth'],
    gcTime: 0,
    mutationFn: (input: { name?: string; email: string; password: string }) =>
      isRegister ? register({ ...input, name: input.name ?? '' }) : login(input),
    onSuccess: async (session) => {
      await acceptSession(session)
      await router.navigate({ href: returnTo, replace: true })
    },
    onError: (error) => {
      const fields = problemFrom(error).fields ?? {}
      setErrors(fields)
      const input = formRef.current?.elements.namedItem(Object.keys(fields)[0])
      if (input instanceof HTMLElement) input.focus()
    },
  })
  return (
    <div className="kurio-app account-page">
      <div className="auth-backdrop" inert aria-hidden="true">
        <HomePage />
      </div>
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) void router.navigate({ href: authCancelDestination(returnTo), replace: true })
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="auth-overlay" />
          <Dialog.Content className={`auth-card ${isRegister ? 'auth-register' : ''}`}>
            <Dialog.Close
              className="auth-close icon-button"
              aria-label="Fechar e voltar ao mercado"
            >
              <X size={20} />
            </Dialog.Close>
            <Link to="/" search={defaultSearch} className="brand">
              KURIO
            </Link>
            <div className="auth-tabs">
              <Link
                to="/login"
                replace
                search={{ redirect: returnTo }}
                aria-current={!isRegister ? 'page' : undefined}
              >
                Entrar
              </Link>
              <span aria-hidden="true">|</span>
              <Link
                to="/cadastro"
                replace
                search={{ redirect: returnTo }}
                aria-current={isRegister ? 'page' : undefined}
              >
                Criar conta
              </Link>
            </div>
            <Dialog.Title className="auth-mobile-title">
              {isRegister ? 'Criar perfil de colecionador' : 'Entrar'}
            </Dialog.Title>
            <Dialog.Description className="auth-description">
              {isRegister
                ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
                : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
            </Dialog.Description>
            <form
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                if (auth.isPending) return
                const data = Object.fromEntries(new FormData(event.currentTarget))
                const result = (isRegister ? signUpSchema : loginSchema).safeParse(data)
                if (!result.success) {
                  const fields = fieldErrors(result.error)
                  setErrors(fields)
                  const input = event.currentTarget.elements.namedItem(Object.keys(fields)[0])
                  if (input instanceof HTMLElement) input.focus()
                  return
                }
                setErrors({})
                auth.mutate(result.data)
              }}
            >
              {isRegister && (
                <FormField
                  label="Nome"
                  name="name"
                  autoComplete="name"
                  placeholder="Nome de usuário"
                  required
                  maxLength={80}
                  error={errors.name}
                />
              )}
              <FormField
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={isRegister ? 'Digite seu e-mail' : 'contato@email.com'}
                required
                error={errors.email}
              />
              <PasswordField
                label="Senha"
                name="password"
                placeholder="Senha"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                aria-describedby={isRegister ? 'signup-password-help' : undefined}
                required
                error={errors.password}
              />
              {isRegister && (
                <>
                  <PasswordField
                    label="Confirmar senha"
                    name="confirmPassword"
                    placeholder="Confirmar senha"
                    autoComplete="new-password"
                    required
                    error={errors.confirmPassword}
                  />
                  <p id="signup-password-help" className="password-help">
                    Use pelo menos 10 caracteres, incluindo letras e números.
                  </p>
                </>
              )}
              {!isRegister && (
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setNotice(
                      'A recuperação por e-mail não faz parte desta demonstração. Use as contas fictícias informadas no README ou crie outra conta fictícia.',
                    )
                  }
                >
                  Esqueceu a senha?
                </button>
              )}
              {auth.isError && (
                <p role="alert" className="form-message error">
                  {problemFrom(auth.error).message}
                </p>
              )}
              <Button type="submit" disabled={auth.isPending}>
                {auth.isPending ? (
                  'Aguarde…'
                ) : isRegister ? (
                  <>
                    <span className="desktop-title">Criar conta</span>
                    <span className="mobile-title">Criar perfil</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            <div className="auth-divider">
              <span>Ou continue com</span>
            </div>
            <div className="social-auth">
              {(['Google', 'Facebook'] as const).map((provider) => (
                <button
                  type="button"
                  key={provider}
                  onClick={() =>
                    setNotice(
                      `O login com ${provider} não faz parte da simulação. Entre com e-mail e senha ou crie uma conta fictícia.`,
                    )
                  }
                >
                  <span className={`social-letter ${provider.toLowerCase()}`} aria-hidden="true">
                    <BrandIcon brand={provider} />
                  </span>
                  Continuar com {provider}
                </button>
              ))}
            </div>
            {notice && (
              <p role="status" className="form-message">
                {notice}
              </p>
            )}
            <p className="auth-switch">
              {isRegister ? 'Já tem uma conta?' : 'Novo na Kurio?'}{' '}
              <Link
                to={isRegister ? '/login' : '/cadastro'}
                replace
                search={{ redirect: returnTo }}
                className="text-link"
              >
                {isRegister ? 'Entre' : 'Crie uma conta'}
              </Link>
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
