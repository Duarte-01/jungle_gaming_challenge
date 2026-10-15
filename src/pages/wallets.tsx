import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { walletSchema, type Wallet, type WalletInput } from '../domain/checkout'
import { fieldErrors, safeReturnTo } from '../domain/account'
import { problemFrom } from '../api/account'
import { networks } from '../api/catalog'
import { useWallets } from '../hooks/use-wallets'
import { FormField } from '../components/form-field'
import { MarketHeader } from '../components/market-header'
import { Button } from '../components/ui/button'
import { AccountSidebar } from '../components/account-sidebar'
import { MobileNav } from '../components/mobile-nav'

function WalletForm({
  initial,
  newRole,
  onCancel,
  onSaveStatus,
}: {
  initial?: Wallet
  newRole: Wallet['role']
  onCancel?: () => void
  onSaveStatus: (message: string) => void
}) {
  const { save, user } = useWallets(onSaveStatus)
  const [network, setNetwork] = useState<WalletInput['network']>(initial?.network ?? 'Ethereum')
  const [errors, setErrors] = useState<Record<string, string>>({})
  return (
    <form
      className="profile-form wallet-form"
      onChange={() => onSaveStatus('')}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (save.isPending) return
        const result = walletSchema.safeParse({
          ...Object.fromEntries(new FormData(event.currentTarget)),
          network,
        })
        if (!result.success) {
          setErrors(fieldErrors(result.error))
          return
        }
        setErrors({})
        save.mutate(
          { input: result.data, id: initial?.id },
          { onError: (error) => setErrors(problemFrom(error).fields ?? {}) },
        )
      }}
    >
      <h2>
        {initial?.label ?? (newRole === 'primary' ? 'Carteira principal' : 'Carteira secundária')}
      </h2>
      <p className="wallet-form-intro muted">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>
      <FormField
        containerClassName="wallet-display-name"
        label="Nome de exibição"
        value={user?.name ?? ''}
        readOnly
        aria-describedby="wallet-display-help"
      />
      <span className="sr-only" id="wallet-display-help">
        Edite seu nome na página Dados do perfil.
      </span>
      <FormField
        containerClassName="wallet-nickname"
        label="Nome da carteira"
        name="label"
        defaultValue={initial?.label ?? ''}
        error={errors.label}
        required
      />
      <FormField
        containerClassName="wallet-main-address"
        label="Endereço da carteira"
        name="address"
        autoComplete="off"
        defaultValue={initial?.address ?? ''}
        error={errors.address}
        required
      />
      <div className="form-field wallet-network-field">
        <label htmlFor="wallet-network">Rede da carteira</label>
        <select
          id="wallet-network"
          value={network}
          onChange={(event) => setNetwork(event.target.value as WalletInput['network'])}
        >
          {networks.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <FormField
        containerClassName="wallet-profile-name"
        label="Nome do perfil"
        name="profileName"
        defaultValue={initial?.profileName ?? user?.name ?? 'Colecionador Kurio'}
        error={errors.profileName}
        required
      />
      <FormField
        containerClassName="wallet-email-field"
        label="E-mail da carteira"
        name="email"
        type="email"
        defaultValue={initial?.email ?? user?.email ?? ''}
        error={errors.email}
        required
      />
      <div className="form-field wallet-provider-field">
        <label htmlFor="wallet-provider">Tipo de carteira</label>
        <select id="wallet-provider" name="provider" defaultValue={initial?.provider ?? 'MetaMask'}>
          <option>MetaMask</option>
          <option>WalletConnect</option>
          <option>Coinbase Wallet</option>
        </select>
      </div>
      <FormField
        containerClassName="wallet-secondary-address"
        label="ENS ou carteira secundária (opcional)"
        name="secondaryAddress"
        defaultValue={initial?.secondaryAddress ?? ''}
        error={errors.secondaryAddress}
      />
      <FormField
        containerClassName="wallet-referral"
        label="Código de indicação"
        name="referralCode"
        defaultValue={initial?.referralCode ?? 'KURIO'}
        error={errors.referralCode}
        required
      />
      <div className="ens-field wallet-ens-field">
        <span aria-hidden="true">.eth</span>
        <FormField
          label="Nome ENS da carteira"
          name="ens"
          defaultValue={
            initial?.ens ??
            user?.ens ??
            user?.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-') ??
            'colecionador'
          }
          error={errors.ens}
          required
        />
      </div>
      <div className="form-field wallet-role-field">
        <label htmlFor="wallet-role">Função</label>
        <select
          id="wallet-role"
          name="role"
          defaultValue={initial?.role ?? newRole}
          aria-describedby={errors.role ? 'role-error' : undefined}
          aria-invalid={Boolean(errors.role)}
        >
          <option value="primary">Principal</option>
          <option value="secondary">Secundária</option>
        </select>
        {errors.role && (
          <p id="role-error" className="field-error">
            {errors.role}
          </p>
        )}
      </div>
      {save.isError && (
        <p role="alert" className="form-message error">
          {problemFrom(save.error).message}
        </p>
      )}
      <Button disabled={save.isPending} type="submit">
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
      {onCancel && (
        <button type="button" className="text-link wallet-cancel" onClick={onCancel}>
          Fechar formulário
        </button>
      )}
    </form>
  )
}

export function WalletsPage() {
  const { wallets } = useWallets()
  const search = useSearch({ strict: false })
  const [editing, setEditing] = useState<Wallet | 'new' | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const primary = wallets.data?.find((wallet) => wallet.role === 'primary')
  const active =
    editing === 'new'
      ? undefined
      : editing
        ? (wallets.data?.find((wallet) => wallet.id === editing.id) ?? editing)
        : primary
  return (
    <div className="kurio-app collector-app wallets-app">
      <MarketHeader title="Minhas carteiras" active="home" />
      <main className="container commerce-page collector-layout">
        <AccountSidebar active="wallets" />
        <div className="collector-content">
          <h1>Minhas carteiras</h1>
          <p className="wallet-demo-note muted">
            Use endereços fictícios. A conexão é simulada e não solicita extensões nem chaves
            privadas.
          </p>
          {wallets.isPending ? (
            <div className="cart-skeleton shimmer" aria-label="Carregando carteiras" />
          ) : wallets.isError ? (
            <p role="alert">{problemFrom(wallets.error).message}</p>
          ) : (
            <>
              <WalletForm
                key={editing === 'new' ? 'new' : (active?.id ?? 'primary-new')}
                initial={active}
                newRole={primary ? 'secondary' : 'primary'}
                onCancel={editing ? () => setEditing(null) : undefined}
                onSaveStatus={setSaveMessage}
              />
              {saveMessage && (
                <p className="wallet-save-status" role="status">
                  {saveMessage}
                </p>
              )}
              <div className="wallet-grid wallet-summaries">
                {wallets.data?.map((wallet) =>
                  wallet.id === active?.id ? (
                    <button
                      type="button"
                      key={wallet.id}
                      className="wallet-edit-current text-link"
                      onClick={() => setEditing(wallet)}
                      aria-label={`Editar ${wallet.label}`}
                    >
                      Editar carteira
                    </button>
                  ) : (
                    <article className="wallet-card" key={wallet.id}>
                      <h2>{wallet.label}</h2>
                      <p className="wallet-address">{wallet.address}</p>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setEditing(wallet)}
                        aria-label={`Editar ${wallet.label}`}
                      >
                        Editar carteira
                      </button>
                    </article>
                  ),
                )}
              </div>
            </>
          )}
          {!wallets.isPending && (wallets.data?.length ?? 0) < 2 && (
            <Button onClick={() => setEditing('new')}>Cadastrar carteira</Button>
          )}
          <Link to="/pagamento" className="text-link" search={{}}>
            {safeReturnTo(search.redirect) === '/pagamento'
              ? 'Voltar ao pagamento'
              : 'Ir para pagamento'}
          </Link>
        </div>
      </main>
      <MobileNav active="profile" />
    </div>
  )
}
