import { useState } from 'preact/hooks';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, LogOut, Unlock, UserPlus } from 'lucide-preact';
import NetworkStatusBadge from '@/components/NetworkStatusBadge';
import StandalonePageFrame from '@/components/StandalonePageFrame';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { t } from '@/lib/i18n';

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  password2: string;
  passwordHint: string;
  inviteCode: string;
}

interface AuthViewsProps {
  mode: 'login' | 'register' | 'locked';
  relaxedLoginInput?: boolean;
  authPlaceholder?: string;
  unlockPlaceholder?: string;
  pendingAction: 'login' | 'passkey' | 'register' | 'unlock' | null;
  unlockReady: boolean;
  unlockPreparing: boolean;
  loginValues: LoginValues;
  pendingPasskeyPasswordEmail?: string | null;
  passkeyPassword: string;
  registerValues: RegisterValues;
  registrationInviteRequired?: boolean;
  unlockPassword: string;
  emailForLock: string;
  loginHintLoading: boolean;
  onChangeLogin: (next: LoginValues) => void;
  onChangePasskeyPassword: (password: string) => void;
  onChangeRegister: (next: RegisterValues) => void;
  onChangeUnlock: (password: string) => void;
  onSubmitLogin: () => void;
  onSubmitPasskey: () => void;
  onSubmitPasskeyUnlock: () => void;
  onSubmitPasskeyPassword: () => void;
  onSubmitRegister: () => void;
  onSubmitUnlock: () => void;
  onGotoLogin: () => void;
  onGotoRegister: () => void;
  onLogout: () => void;
  onTogglePasswordHint: () => void;
  onShowLockedPasswordHint: () => void;
}

export default function AuthViews(props: AuthViewsProps) {
  const loginBusy = props.pendingAction === 'login';
  const passkeyBusy = props.pendingAction === 'passkey';
  const registerBusy = props.pendingAction === 'register';
  const unlockBusy = props.pendingAction === 'unlock';
  const passkeyPasswordPending = !!props.pendingPasskeyPasswordEmail;
  const showInviteCodeField = props.registrationInviteRequired !== false || !!props.registerValues.inviteCode.trim();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPasskeyPassword, setShowPasskeyPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPassword2, setShowRegisterPassword2] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  if (props.mode === 'locked') {
    return (
      <div className="auth-page">
        <StandalonePageFrame title={t('txt_unlock_vault')} titleAccessory={<NetworkStatusBadge />}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.onSubmitUnlock();
            }}
          >
            <p className="muted standalone-muted">{props.emailForLock}</p>
            <input type="text" value={props.emailForLock} autoComplete="username" readOnly hidden tabIndex={-1} aria-hidden="true" />
            <FloatingLabelInput
              label={t('txt_master_password')}
              value={props.unlockPassword}
              type={showUnlockPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={props.unlockPlaceholder}
              autoFocus
              onInput={props.onChangeUnlock}
            >
              <button type="button" className="input-icon-btn" onClick={() => setShowUnlockPassword(!showUnlockPassword)}>
                {showUnlockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </FloatingLabelInput>
            <div className="auth-support-row">
              <span />
              <button
                type="button"
                className="auth-link-btn"
                onClick={props.onShowLockedPasswordHint}
                disabled={unlockBusy || props.unlockPreparing}
              >
                {t('txt_show_password_hint')}
              </button>
            </div>
            {props.unlockPreparing ? (
              <p className="muted standalone-muted">{t('txt_loading')}</p>
            ) : null}
            <button type="submit" className="btn btn-primary full" disabled={unlockBusy || passkeyBusy || props.unlockPreparing || !props.unlockReady}>
              <Unlock size={16} className="btn-icon" />
              {unlockBusy ? t('txt_unlocking') : props.unlockPreparing ? t('txt_loading') : t('txt_unlock')}
            </button>
            <button
              type="button"
              className="btn btn-secondary full"
              onClick={props.onSubmitPasskeyUnlock}
              disabled={unlockBusy || passkeyBusy || props.unlockPreparing || !props.unlockReady}
            >
              <KeyRound size={16} className="btn-icon" />
              {passkeyBusy ? t('txt_unlocking') : t('txt_unlock_with_passkey')}
            </button>
            <div className="or">{t('txt_or')}</div>
            <button type="button" className="btn btn-secondary full" onClick={props.onLogout} disabled={unlockBusy || passkeyBusy}>
              <LogOut size={16} className="btn-icon" />
              {t('txt_log_out')}
            </button>
          </form>
        </StandalonePageFrame>
      </div>
    );
  }

  if (props.mode === 'register') {
    return (
      <div className="auth-page">
        <StandalonePageFrame title={t('txt_create_account')} titleAccessory={<NetworkStatusBadge />}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.onSubmitRegister();
            }}
          >
            <FloatingLabelInput
              label={t('txt_name')}
              value={props.registerValues.name}
              autoComplete="name"
              onInput={(v) => props.onChangeRegister({ ...props.registerValues, name: v })}
            />
            <FloatingLabelInput
              label={t('txt_email')}
              value={props.registerValues.email}
              type="email"
              autoComplete="email"
              onInput={(v) => props.onChangeRegister({ ...props.registerValues, email: v })}
            />
            <FloatingLabelInput
              label={t('txt_master_password')}
              value={props.registerValues.password}
              type={showRegisterPassword ? 'text' : 'password'}
              autoComplete="new-password"
              onInput={(v) => props.onChangeRegister({ ...props.registerValues, password: v })}
            >
              <button type="button" className="input-icon-btn" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </FloatingLabelInput>
            <FloatingLabelInput
              label={t('txt_confirm_master_password')}
              value={props.registerValues.password2}
              type={showRegisterPassword2 ? 'text' : 'password'}
              autoComplete="new-password"
              onInput={(v) => props.onChangeRegister({ ...props.registerValues, password2: v })}
            >
              <button type="button" className="input-icon-btn" onClick={() => setShowRegisterPassword2(!showRegisterPassword2)}>
                {showRegisterPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </FloatingLabelInput>
            <FloatingLabelInput
              label={t('txt_password_hint_optional')}
              value={props.registerValues.passwordHint}
              placeholder={t('txt_password_hint_register_placeholder')}
              onInput={(v) => props.onChangeRegister({ ...props.registerValues, passwordHint: v })}
            />
            {showInviteCodeField ? (
              <FloatingLabelInput
                label={t('txt_invite_code_required')}
                value={props.registerValues.inviteCode}
                autoComplete="off"
                onInput={(v) => props.onChangeRegister({ ...props.registerValues, inviteCode: v })}
              />
            ) : null}
            <button type="submit" className="btn btn-primary full" disabled={registerBusy}>
              <UserPlus size={16} className="btn-icon" />
              {registerBusy ? t('txt_registering') : t('txt_create_account')}
            </button>
            <div className="or">{t('txt_or')}</div>
            <button type="button" className="btn btn-secondary full" onClick={props.onGotoLogin} disabled={registerBusy}>
              <ArrowLeft size={16} className="btn-icon" />
              {t('txt_back_to_login')}
            </button>
          </form>
        </StandalonePageFrame>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <StandalonePageFrame title={t('txt_log_in')} titleAccessory={<NetworkStatusBadge />}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passkeyPasswordPending) {
              props.onSubmitPasskeyPassword();
              return;
            }
            props.onSubmitLogin();
          }}
        >
          {passkeyPasswordPending ? (
            <>
              <p className="muted standalone-muted">{props.pendingPasskeyPasswordEmail}</p>
              <input type="text" value={props.pendingPasskeyPasswordEmail || ''} autoComplete="username" readOnly hidden tabIndex={-1} aria-hidden="true" />
              <FloatingLabelInput
                label={t('txt_master_password')}
                value={props.passkeyPassword}
                type={showPasskeyPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={props.authPlaceholder}
                autoFocus
                onInput={props.onChangePasskeyPassword}
              >
                <button type="button" className="input-icon-btn" onClick={() => setShowPasskeyPassword(!showPasskeyPassword)}>
                  {showPasskeyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </FloatingLabelInput>
              <button type="submit" className="btn btn-primary full" disabled={loginBusy}>
                <Unlock size={16} className="btn-icon" />
                {loginBusy ? t('txt_unlocking') : t('txt_unlock')}
              </button>
              <div className="or">{t('txt_or')}</div>
              <button type="button" className="btn btn-secondary full" onClick={props.onGotoLogin} disabled={loginBusy}>
                <ArrowLeft size={16} className="btn-icon" />
                {t('txt_back_to_login')}
              </button>
            </>
          ) : (
            <>
          <FloatingLabelInput
            label={t('txt_email')}
            value={props.loginValues.email}
            type={props.relaxedLoginInput ? 'text' : 'email'}
            autoComplete="username"
            placeholder={props.authPlaceholder}
            autoFocus
            onInput={(v) => props.onChangeLogin({ ...props.loginValues, email: v })}
          />
          <FloatingLabelInput
            label={t('txt_master_password')}
            value={props.loginValues.password}
            type={showLoginPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={props.authPlaceholder}
            onInput={(v) => props.onChangeLogin({ ...props.loginValues, password: v })}
          >
            <button type="button" className="input-icon-btn" onClick={() => setShowLoginPassword(!showLoginPassword)}>
              {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </FloatingLabelInput>
          <div className="auth-support-row">
            <span />
            <button
              type="button"
              className="auth-link-btn"
              onClick={props.onTogglePasswordHint}
              disabled={loginBusy || props.loginHintLoading || !props.loginValues.email.trim()}
            >
              {props.loginHintLoading
                ? t('txt_loading_password_hint')
                : t('txt_show_password_hint')}
            </button>
          </div>
          <button type="submit" className="btn btn-primary full" disabled={loginBusy || passkeyBusy}>
            <LogIn size={16} className="btn-icon" />
            {loginBusy ? t('txt_logging_in') : t('txt_log_in')}
          </button>
          <button type="button" className="btn btn-secondary full" onClick={props.onSubmitPasskey} disabled={loginBusy || passkeyBusy}>
            <KeyRound size={16} className="btn-icon" />
            {passkeyBusy ? t('txt_logging_in') : t('txt_login_with_passkey')}
          </button>
          <div className="or">{t('txt_or')}</div>
          <button type="button" className="btn btn-secondary full" onClick={props.onGotoRegister} disabled={loginBusy || passkeyBusy}>
            <UserPlus size={16} className="btn-icon" />
            {t('txt_create_account')}
          </button>
            </>
          )}
        </form>
      </StandalonePageFrame>
    </div>
  );
}
