import { useState } from 'preact/hooks';
import { Eye, EyeOff, Send, X } from 'lucide-preact';
import StandalonePageFrame from '@/components/StandalonePageFrame';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { t } from '@/lib/i18n';

interface RecoverTwoFactorPageProps {
  values: { email: string; password: string; recoveryCode: string };
  onChange: (next: { email: string; password: string; recoveryCode: string }) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function RecoverTwoFactorPage(props: RecoverTwoFactorPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <StandalonePageFrame title={t('txt_recover_two_step_login')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmit();
          }}
        >
          <p className="muted standalone-muted">{t('txt_use_your_one_time_recovery_code_to_disable_two_step_verification')}</p>

          <FloatingLabelInput
            label={t('txt_email')}
            value={props.values.email}
            type="email"
            autoComplete="username"
            onInput={(v) => props.onChange({ ...props.values, email: v })}
          />

          <label className="field">
            <span>{t('txt_master_password')}</span>
            <div className="password-wrap">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={props.values.password}
                autoComplete="current-password"
                onInput={(e) => props.onChange({ ...props.values, password: (e.currentTarget as HTMLInputElement).value })}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <FloatingLabelInput
            label={t('txt_recovery_code')}
            value={props.values.recoveryCode}
            autoComplete="one-time-code"
            onInput={(v) => props.onChange({ ...props.values, recoveryCode: v.toUpperCase() })}
          />

          <div className="field-grid">
            <button type="submit" className="btn btn-primary">
              <Send size={14} className="btn-icon" />
              {t('txt_submit')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={props.onCancel}>
              <X size={14} className="btn-icon" />
              {t('txt_cancel')}
            </button>
          </div>
        </form>
      </StandalonePageFrame>
    </div>
  );
}
