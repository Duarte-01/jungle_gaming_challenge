import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { changePassword, problemFrom, sessionOptions, updateProfile } from '../api/account'
import { queryClient } from '../app/query-client'
import { forgetSession } from '../auth/session-cache'
import {
  changePasswordSchema,
  fieldErrors,
  profileSchema,
  type Session,
  type User,
} from '../domain/account'
import { FormField } from '../components/form-field'
import { MarketHeader } from '../components/market-header'
import { Button } from '../components/ui/button'
import { sessionGeneration } from '../auth/events'
import { AccountSidebar } from '../components/account-sidebar'
import { MobileNav } from '../components/mobile-nav'
import { PasswordField } from '../components/password-field'

function ProfileForm({ user }: { user: User }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [avatar, setAvatar] = useState(user.avatarUrl)
  const [avatarError, setAvatarError] = useState('')
  const mutation = useMutation({
    mutationKey: ['private', user.id, 'profile'],
    gcTime: 0,
    onMutate: () => ({ generation: sessionGeneration() }),
    mutationFn: updateProfile,
    onSuccess: (updated, _input, context) => {
      if (context?.generation === sessionGeneration())
        queryClient.setQueryData<Session>(['session'], (previous) =>
          previous?.user?.id === updated.id ? { ...previous, user: updated } : previous,
        )
    },
    onError: (error) => setErrors(problemFrom(error).fields ?? {}),
  })
  return (
    <form
      className="profile-form collector-profile-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (mutation.isPending) return
        const input = Object.fromEntries(new FormData(event.currentTarget))
        const result = profileSchema.safeParse({ ...input, avatarUrl: avatar })
        if (!result.success) {
          setErrors(fieldErrors(result.error))
          return
        }
        setErrors({})
        mutation.mutate(result.data)
      }}
    >
      <h2>Perfil do colecionador</h2>
      <div className="avatar-editor">
        {avatar ? (
          <img src={avatar} alt={`Avatar de ${user.name}`} className="profile-avatar" />
        ) : (
          <span className="profile-avatar avatar-placeholder" aria-hidden="true">
            <ImageIcon size={22} />
          </span>
        )}
        <div className="form-field">
          <label htmlFor="avatar-file">Avatar</label>
          <input
            id="avatar-file"
            type="file"
            className="sr-only"
            accept="image/png,image/jpeg,image/webp"
            aria-describedby={avatarError ? 'avatar-error' : 'avatar-help'}
            aria-invalid={Boolean(avatarError)}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              if (
                file.size > 250_000 ||
                !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
              ) {
                setAvatarError('Use uma imagem PNG, JPEG ou WebP de até 250 KB.')
                return
              }
              const reader = new FileReader()
              reader.onload = () => {
                setAvatar(String(reader.result))
                setAvatarError('')
              }
              reader.onerror = () => setAvatarError('Não foi possível ler a imagem.')
              reader.readAsDataURL(file)
            }}
          />
          <label htmlFor="avatar-file" className="avatar-upload-button kurio-button">
            Alterar
          </label>
          <p id="avatar-help" className="sr-only">
            PNG, JPEG ou WebP, até 250 KB.
          </p>
          {avatarError && (
            <p id="avatar-error" role="alert">
              {avatarError}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-link remove-avatar"
          disabled={!avatar}
          aria-label="Remover avatar"
          onClick={() => setAvatar(null)}
        >
          Remover
        </button>
      </div>
      <FormField
        containerClassName="profile-name"
        label="Nome de exibição"
        aria-label="Nome"
        name="name"
        autoComplete="name"
        defaultValue={user.name}
        error={errors.name}
        required
      />
      <FormField
        containerClassName="profile-email"
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={user.email}
        error={errors.email}
        required
      />
      <details className="profile-additional">
        <summary>Dados adicionais</summary>
        <FormField
          label="Telefone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={user.phone}
          error={errors.phone}
        />
      </details>
      <FormField
        containerClassName="profile-username"
        label="Nome de usuário"
        name="username"
        defaultValue={user.username ?? user.email.split('@')[0]}
        error={errors.username}
        required
      />
      <div className="ens-field">
        <span aria-hidden="true">.eth</span>
        <FormField
          label="Nome ENS"
          name="ens"
          defaultValue={user.ens ?? user.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-')}
          error={errors.ens}
          required
        />
      </div>
      <FormField
        containerClassName="profile-nickname"
        label="Apelido da carteira"
        name="walletNickname"
        defaultValue={user.walletNickname ?? 'Minha carteira'}
        error={errors.walletNickname}
        required
      />
      {mutation.isError && (
        <p role="alert" className="form-message error">
          {problemFrom(mutation.error).message}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="form-message">
          Perfil atualizado.
        </p>
      )}
      <Button
        className="save-profile"
        type="submit"
        disabled={mutation.isPending || Boolean(avatarError)}
      >
        {mutation.isPending ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  )
}

function PasswordForm() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutation = useMutation({
    mutationKey: ['private', 'password'],
    gcTime: 0,
    mutationFn: changePassword,
    onMutate: () => ({ generation: sessionGeneration() }),
    onError: (error) => setErrors(problemFrom(error).fields ?? {}),
    onSuccess: async (_data, _input, context) => {
      if (context?.generation !== sessionGeneration()) return
      await forgetSession()
      await navigate({ to: '/login', search: { redirect: '/perfil' } })
    },
  })
  return (
    <form
      className="profile-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (mutation.isPending) return
        const data = Object.fromEntries(new FormData(event.currentTarget))
        if (data.newPassword !== data.confirmPassword) {
          setErrors({ confirmPassword: 'As senhas devem ser iguais.' })
          return
        }
        const result = changePasswordSchema.safeParse(data)
        if (!result.success) {
          setErrors(fieldErrors(result.error))
          return
        }
        setErrors({})
        mutation.mutate(result.data)
      }}
    >
      <h2>Alterar senha</h2>
      <p id="password-session-help" className="password-session-help sr-only">
        Após a alteração, entre novamente com sua nova senha.
      </p>
      <PasswordField
        label="Senha atual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        aria-describedby="password-session-help"
        error={errors.currentPassword}
      />
      <PasswordField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword}
      />
      <PasswordField
        label="Confirmar nova senha"
        name="confirmPassword"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      {mutation.isError && (
        <p role="alert" className="form-message error">
          {problemFrom(mutation.error).message}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        Alterar senha
      </Button>
    </form>
  )
}

export function ProfilePage() {
  const session = useQuery(sessionOptions)
  return (
    <div className="kurio-app collector-app">
      <MarketHeader title="Meu perfil" active="home" />
      <main className="container commerce-page collector-layout">
        <AccountSidebar active="profile" />
        <div className="collector-content">
          <h1>Meu perfil</h1>
          <nav className="order-links" aria-label="Minha conta">
            <Link to="/carteiras" search={{ redirect: '/perfil' }} className="text-link">
              Minhas carteiras
            </Link>
            <Link to="/pedidos" className="text-link">
              Meus pedidos
            </Link>
          </nav>
          {session.data?.user && (
            <div className="profile-grid">
              <ProfileForm key={session.data.user.id} user={session.data.user} />
              <PasswordForm />
            </div>
          )}
        </div>
      </main>
      <MobileNav active="profile" />
    </div>
  )
}
