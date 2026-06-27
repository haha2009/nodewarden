import type { RefObject } from 'preact';
import { createPortal } from 'preact/compat';
import { ArrowDown, ArrowUp, CheckCheck, Copy, Download, Eye, EyeOff, Paperclip, Plus, QrCode, RefreshCw, Sparkles, Star, StarOff, Trash2, Upload, X } from 'lucide-preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useDialogLifecycle } from '@/components/ConfirmDialog';
import type { Cipher, Folder, VaultDraft, VaultDraftField } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cardBrand } from '@/lib/import-format-shared';
import {
  CARD_BRAND_OPTIONS,
  CardBrandIcon,
  CreateTypeIcon,
  PlatformIcon,
  cipherTypeLabel,
  firstCipherUri,
  formatAttachmentSize,
  formatHistoryTime,
  getCreateTypeOptions,
  getLinkedIdOptions,

  normalizeCardBrand,
  openUri,
  resizeImageToIcon,
  suggestNameFromUrl,
  toBooleanFieldValue,
} from '@/components/vault/vault-page-helpers';
import WebsiteIcon from '@/components/vault/WebsiteIcon';
import { beginWebsiteIconLoad } from '@/lib/website-icon-cache';
import { hostFromUri, websiteIconUrl } from '@/components/vault/vault-page-helpers';

interface VaultEditorProps {
  draft: VaultDraft;
  isCreating: boolean;
  busy: boolean;
  folders: Folder[];
  selectedCipher: Cipher | null;
  editExistingAttachments: Array<any>;
  removedAttachmentIds: Record<string, boolean>;
  removedAttachmentCount: number;
  attachmentQueue: File[];
  attachmentInputRef: RefObject<HTMLInputElement>;
  localError: string;
  downloadingAttachmentKey: string;
  attachmentDownloadPercent: number | null;
  uploadingAttachmentName: string;
  attachmentUploadPercent: number | null;
  onUpdateDraft: (patch: Partial<VaultDraft>) => void;
  onSeedSshDefaults: (force?: boolean) => void;
  onUpdateSshPublicKey: (value: string) => void;
  onUpdateDraftLoginUri: (index: number, value: string) => void;
  onUpdateDraftLoginUriMatch: (index: number, value: number | null) => void;
  onReorderDraftLoginUri: (fromIndex: number, toIndex: number) => void;
  onRequestDeleteLoginPasskey: (index: number) => void;
  onQueueAttachmentFiles: (list: FileList | null) => void;
  onToggleExistingAttachmentRemoval: (attachmentId: string) => void;
  onRemoveQueuedAttachment: (index: number) => void;
  onDownloadAttachment: (cipher: Cipher, attachmentId: string) => void;
  onPatchDraftCustomField: (index: number, patch: Partial<VaultDraftField>) => void;
  onUpdateDraftCustomFields: (fields: VaultDraftField[]) => void;
  onOpenFieldModal: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteSelected: () => void;
}

export default function VaultEditor(props: VaultEditorProps) {
  const createTypeOptions = getCreateTypeOptions();
  const normalizedDraftCardBrand = normalizeCardBrand(props.draft.cardBrand);
  const cardBrandOptions = normalizedDraftCardBrand && !CARD_BRAND_OPTIONS.includes(normalizedDraftCardBrand as any)
    ? [...CARD_BRAND_OPTIONS, normalizedDraftCardBrand]
    : CARD_BRAND_OPTIONS;
  const totpQrVideoRef = useRef<HTMLVideoElement | null>(null);
  const totpQrFileRef = useRef<HTMLInputElement | null>(null);
  const totpQrStreamRef = useRef<MediaStream | null>(null);
  const totpQrFrameRef = useRef<number | null>(null);
  const [totpQrOpen, setTotpQrOpen] = useState(false);
  const [totpQrStatus, setTotpQrStatus] = useState('');
  const [totpQrBusy, setTotpQrBusy] = useState(false);
  useDialogLifecycle(totpQrOpen, () => setTotpQrOpen(false));

  const stopTotpQrScanner = () => {
    if (totpQrFrameRef.current != null) {
      window.cancelAnimationFrame(totpQrFrameRef.current);
      totpQrFrameRef.current = null;
    }
    if (totpQrStreamRef.current) {
      for (const track of totpQrStreamRef.current.getTracks()) track.stop();
      totpQrStreamRef.current = null;
    }
    if (totpQrVideoRef.current) {
      totpQrVideoRef.current.srcObject = null;
    }
  };

  const applyTotpQrValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    props.onUpdateDraft({ loginTotp: trimmed });
    setTotpQrStatus(t('txt_totp_qr_scanned'));
    setTotpQrOpen(false);
    return true;
  };

  const createTotpQrDetector = (): BarcodeDetector | null => {
    if (typeof window === 'undefined' || !window.BarcodeDetector) return null;
    return new window.BarcodeDetector({ formats: ['qr_code'] });
  };

  const decodeTotpQrImage = async (source: ImageBitmapSource): Promise<boolean> => {
    const detector = createTotpQrDetector();
    if (!detector) {
      setTotpQrStatus(t('txt_totp_qr_unsupported'));
      return false;
    }
    const results = await detector.detect(source);
    const value = String(results[0]?.rawValue || '').trim();
    if (!value) return false;
    return applyTotpQrValue(value);
  };

  const handleTotpQrFile = async (file: File | null) => {
    if (!file) return;
    setTotpQrBusy(true);
    setTotpQrStatus(t('txt_totp_qr_scanning'));
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const found = await decodeTotpQrImage(bitmap);
      if (!found) setTotpQrStatus(t('txt_totp_qr_not_found'));
    } catch {
      setTotpQrStatus(t('txt_totp_qr_scan_failed'));
    } finally {
      bitmap?.close();
      setTotpQrBusy(false);
    }
  };

  useEffect(() => {
    if (!totpQrOpen) {
      stopTotpQrScanner();
      return;
    }
    let stopped = false;
    const detector = createTotpQrDetector();
    if (!detector) {
      setTotpQrStatus(t('txt_totp_qr_unsupported'));
      return () => {
        stopped = true;
        stopTotpQrScanner();
      };
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setTotpQrStatus(t('txt_totp_qr_camera_unavailable'));
      return () => {
        stopped = true;
        stopTotpQrScanner();
      };
    }

    const scan = async () => {
      if (stopped) return;
      const video = totpQrVideoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        totpQrFrameRef.current = window.requestAnimationFrame(scan);
        return;
      }
      try {
        const results = await detector.detect(video);
        const value = String(results[0]?.rawValue || '').trim();
        if (value && applyTotpQrValue(value)) return;
      } catch {
        // Keep the camera active; transient frame decode failures are common.
      }
      totpQrFrameRef.current = window.requestAnimationFrame(scan);
    };

    setTotpQrBusy(true);
    setTotpQrStatus(t('txt_totp_qr_starting_camera'));
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (stopped) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        totpQrStreamRef.current = stream;
        const video = totpQrVideoRef.current;
        if (!video) return;
        video.srcObject = stream;
        setTotpQrStatus(t('txt_totp_qr_point_camera'));
        void video.play().then(() => {
          setTotpQrBusy(false);
          totpQrFrameRef.current = window.requestAnimationFrame(scan);
        }).catch(() => {
          setTotpQrBusy(false);
          setTotpQrStatus(t('txt_totp_qr_camera_unavailable'));
        });
      })
      .catch(() => {
        setTotpQrBusy(false);
        setTotpQrStatus(t('txt_totp_qr_camera_unavailable'));
      });

    return () => {
      stopped = true;
      stopTotpQrScanner();
    };
  }, [totpQrOpen]);

  const formatDownloadLabel = (attachmentId: string) => {
    const downloadKey = `${props.selectedCipher?.id || ''}:${attachmentId}`;
    if (props.downloadingAttachmentKey !== downloadKey) return t('txt_download');
    return props.attachmentDownloadPercent == null
      ? t('txt_downloading')
      : t('txt_downloading_percent', { percent: props.attachmentDownloadPercent });
  };
  const uploadLabel =
    props.attachmentUploadPercent == null
      ? t('txt_uploading_attachment_named', { name: props.uploadingAttachmentName || t('txt_attachment') })
      : t('txt_uploading_attachment_named_percent', {
          name: props.uploadingAttachmentName || t('txt_attachment'),
          percent: props.attachmentUploadPercent,
        });

  const iconInputRef = useRef<HTMLInputElement | null>(null);

  const handleIconUpload = () => {
    iconInputRef.current?.click();
  };

  const handleIconFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const resized = await resizeImageToIcon(file, 64);
      props.onUpdateDraft({ customIcon: resized });
    } catch {
      // Silently fail if image resize fails
    }
  };

  const handleIconClick = () => {
    if (!props.selectedCipher) return;
    const uri = firstCipherUri(props.selectedCipher);
    if (uri) openUri(uri);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [aiDetected, setAiDetected] = useState(false);

  // Password generator dialog state
  const [pgOpen, setPgOpen] = useState(false);
  const [pgPassword, setPgPassword] = useState('');
  const [pgLength, setPgLength] = useState(20);
  const [pgUppercase, setPgUppercase] = useState(true);
  const [pgLowercase, setPgLowercase] = useState(true);
  const [pgNumbers, setPgNumbers] = useState(true);
  const [pgSymbols, setPgSymbols] = useState(true);
  const [pgExcludeSimilar, setPgExcludeSimilar] = useState(false);
  useDialogLifecycle(pgOpen, () => setPgOpen(false));

  const generatePasswordWithOptions = (len: number, upper: boolean, lower: boolean, numbers: boolean, symbols: boolean, exclude: boolean): string => {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()-_=+';
    const similarChars = 'il1Lo0O';
    const filterSimilar = (s: string) => exclude ? [...s].filter(c => !similarChars.includes(c)).join('') : s;
    let pool = '';
    if (upper) pool += filterSimilar(upperChars);
    if (lower) pool += filterSimilar(lowerChars);
    if (numbers) pool += filterSimilar(numberChars);
    if (symbols) pool += filterSimilar(symbolChars);
    if (!pool) pool = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    const sets: string[] = [];
    if (upper) { const s = filterSimilar(upperChars); if (s) sets.push(s); }
    if (lower) { const s = filterSimilar(lowerChars); if (s) sets.push(s); }
    if (numbers) { const s = filterSimilar(numberChars); if (s) sets.push(s); }
    if (symbols) { const s = filterSimilar(symbolChars); if (s) sets.push(s); }
    for (const set of sets) {
      result += set.charAt(Math.floor(Math.random() * set.length));
    }
    for (let i = result.length; i < len; i++) {
      result += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    return result;
  };

  const regeneratePreview = () => {
    setPgPassword(generatePasswordWithOptions(pgLength, pgUppercase, pgLowercase, pgNumbers, pgSymbols, pgExcludeSimilar));
  };

  const [copied, setCopied] = useState(false);

  const copyPassword = () => {
    if (!props.draft.loginPassword) return;
    navigator.clipboard.writeText(props.draft.loginPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard not available
    });
  };

  const openGeneratorDialog = () => {
    const initialLen = pgLength;
    const initialPassword = generatePasswordWithOptions(initialLen, pgUppercase, pgLowercase, pgNumbers, pgSymbols, pgExcludeSimilar);
    setPgPassword(initialPassword);
    setPgOpen(true);
  };

  const applyGeneratedPassword = () => {
    props.onUpdateDraft({ loginPassword: pgPassword });
    setPgOpen(false);
  };

  const handleAiDetect = () => {
    const firstUri = props.draft.loginUris[0]?.uri || '';
    if (!firstUri.trim()) return;
    const suggested = suggestNameFromUrl(firstUri);
    if (suggested) {
      props.onUpdateDraft({ name: suggested });
      // Also trigger website favicon load
      const host = hostFromUri(firstUri);
      if (host) {
        const iconSrc = websiteIconUrl(host);
        beginWebsiteIconLoad(host, iconSrc);
      }
      setAiDetected(true);
      setTimeout(() => setAiDetected(false), 3000);
    }
  };

  const saveDisabled = props.busy || !props.draft.name.trim();

  const iconCipher = useMemo(() => {
    if (props.selectedCipher) return props.selectedCipher;
    const uri = props.draft.loginUris[0]?.uri?.trim();
    if (!uri) return null;
    return { id: 'new', type: props.draft.type, login: { uris: [{ uri }] } } as Cipher;
  }, [props.selectedCipher, props.draft.loginUris, props.draft.type]);

  return (
    <>
      <div className="card">
        <div className="section-head">
          <h3 className="detail-title">{props.isCreating ? t('txt_new_type_header', { type: cipherTypeLabel(props.draft.type) }) : t('txt_edit_type_header', { type: cipherTypeLabel(props.draft.type) })}</h3>
          <button type="button" className={`btn btn-secondary small ${props.draft.favorite ? 'star-on' : ''}`} onClick={() => props.onUpdateDraft({ favorite: !props.draft.favorite })}>
            {props.draft.favorite ? <Star size={14} className="btn-icon" /> : <StarOff size={14} className="btn-icon" />}
            {t('txt_favorite')}
          </button>
        </div>
        <div className="field-row">
          <label className="field field-compact">
            <span>{t('txt_type')}</span>
            <select
              className="input"
              value={props.draft.type}
              disabled={!props.isCreating}
              onInput={(e) => {
                const nextType = Number((e.currentTarget as HTMLSelectElement).value);
                props.onUpdateDraft({ type: nextType });
                if (nextType === 5) props.onSeedSshDefaults();
              }}
            >
              {createTypeOptions.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-compact">
            <span>{t('txt_tag')}</span>
            <select className="input" value={props.draft.folderId} onInput={(e) => props.onUpdateDraft({ folderId: (e.currentTarget as HTMLSelectElement).value })}>
              <option value="">{t('txt_no_tag')}</option>
              {props.folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.decName || folder.name || folder.id}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* Website URLs — homepage + login page */}
        {props.draft.type === 1 && (
          <>
            <label className="field">
              <span>{t('txt_website_homepage')}</span>
              <div className="input-action-wrap">
                <input
                  className="input"
                  value={props.draft.loginUris[0]?.uri || ''}
                  onInput={(e) => props.onUpdateDraftLoginUri(0, (e.currentTarget as HTMLInputElement).value)}
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  className={`input-icon-btn ai-detect-btn ${aiDetected ? 'ai-detected' : ''}`}
                  title={t('txt_ai_auto_name')}
                  aria-label={t('txt_ai_auto_name')}
                  onClick={handleAiDetect}
                  disabled={!props.draft.loginUris[0]?.uri?.trim()}
                >
                  <Sparkles size={16} className={aiDetected ? 'sparkle-active' : ''} />
                </button>
              </div>
            </label>
            <label className="field">
              <span>{t('txt_website_login_page')}</span>
              <input
                className="input"
                value={props.draft.loginUris[1]?.uri || ''}
                onInput={(e) => {
                  props.onUpdateDraftLoginUri(1, (e.currentTarget as HTMLInputElement).value);
                  if (props.draft.loginUris[1]?.match !== 1) props.onUpdateDraftLoginUriMatch(1, 1);
                }}
                placeholder="https://example.com"
              />
            </label>
          </>
        )}
        {/* Name field — icon with logo label + name input */}
        <div className="name-field-group">
          <div className="name-field-row">
            <div className="name-field-icon-col">
              <span className="name-field-label">{t('txt_logo')}</span>
              <span className="name-icon-box" aria-hidden="true" onClick={props.isCreating ? handleIconUpload : undefined}>
                {iconCipher ? (
                  <WebsiteIcon
                    cipher={iconCipher}
                    customIcon={props.draft.customIcon || undefined}
                    editable={false}
                    onClick={handleIconClick}
                  />
                ) : (
                  <CreateTypeIcon type={props.draft.type} />
                )}
              </span>
            </div>
            <div className="name-field-input-block">
              <span className="name-field-label">{t('txt_name')}</span>
              <input
                className="input"
                value={props.draft.name}
                onInput={(e) => props.onUpdateDraft({ name: (e.currentTarget as HTMLInputElement).value })}
                placeholder={t('txt_enter_name_placeholder')}
              />
            </div>
          </div>
        </div>
        {/* Login type selector: password login or third-party login */}
        {props.draft.type === 1 && (
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${props.draft.loginType === 'password' ? 'active' : ''}`}
              onClick={() => props.onUpdateDraft({ loginType: 'password' })}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
              {t('txt_password_login')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${props.draft.loginType === 'third_party' ? 'active' : ''}`}
              onClick={() => props.onUpdateDraft({ loginType: 'third_party' })}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              {t('txt_third_party_login')}
            </button>
          </div>
        )}
        {/* Password login fields */}
        {props.draft.type === 1 && props.draft.loginType === 'password' && (
          <>
            <label className="field">
              <span>{t('txt_username')}</span>
              <input className="input" value={props.draft.loginUsername} onInput={(e) => props.onUpdateDraft({ loginUsername: (e.currentTarget as HTMLInputElement).value })} />
            </label>
            <label className="field">
              <span>{t('txt_password')}</span>
              <div className="leading-input-inner">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={props.draft.loginPassword}
                    onInput={(e) => props.onUpdateDraft({ loginPassword: (e.currentTarget as HTMLInputElement).value })}
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    title={t('txt_generate_password')}
                    aria-label={t('txt_generate_password')}
                    onClick={openGeneratorDialog}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    type="button"
                    className={`input-icon-btn ${copied ? 'pw-copied' : ''}`}
                    title={copied ? t('txt_copied') : t('txt_copy_password')}
                    aria-label={copied ? t('txt_copied') : t('txt_copy_password')}
                    onClick={copyPassword}
                    disabled={!props.draft.loginPassword}
                  >
                    {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                  </button>
                  <button
                    type="button"
                    className="input-icon-btn"
                    title={showPassword ? t('txt_hide_password') : t('txt_show_password')}
                    aria-label={showPassword ? t('txt_hide_password') : t('txt_show_password')}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
            </label>
          </>
        )}
        {/* Third-party login fields */}
        {props.draft.type === 1 && props.draft.loginType === 'third_party' && (
          <div className="platform-select-row">
            <PlatformIcon platform={props.draft.thirdPartyPlatform} />
            <select className="input" value={props.draft.thirdPartyPlatform} onInput={(e) => props.onUpdateDraft({ thirdPartyPlatform: (e.currentTarget as HTMLSelectElement).value })}>
              <option value="">{t('txt_select_platform')}</option>
              <option value="google">Google</option>
              <option value="apple">Apple</option>
              <option value="microsoft">Microsoft</option>
              <option value="twitter">Twitter / X</option>
              <option value="facebook">Facebook</option>
              <option value="github">GitHub</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
              <option value="wechat">WeChat</option>
              <option value="qq">QQ</option>
              <option value="weibo">Weibo</option>
            </select>
          </div>
        )}
        {/* Common login fields for both types */}
        {props.draft.type === 1 && (
          <>
            <label className="field">
              <span>{t('txt_totp_secret')}</span>
              <div className="input-action-wrap">
                <input className="input" value={props.draft.loginTotp} onInput={(e) => props.onUpdateDraft({ loginTotp: (e.currentTarget as HTMLInputElement).value })} />
                <button
                  type="button"
                  className="input-icon-btn"
                  title={t('txt_scan_totp_qr')}
                  aria-label={t('txt_scan_totp_qr')}
                  disabled={props.busy}
                  onClick={() => {
                    setTotpQrStatus('');
                    setTotpQrOpen(true);
                  }}
                >
                  <QrCode size={18} className="btn-icon" />
                </button>
              </div>
            </label>
            {props.draft.loginFido2Credentials.length > 0 && (
              <>
                <div className="section-head passkeys-section-head">
                  <h4>{t('txt_passkeys')}</h4>
                </div>
                <div className="attachment-list">
                  {props.draft.loginFido2Credentials.map((credential, index) => {
                    const createdAt = String(credential?.creationDate || '').trim();
                    const label = createdAt
                      ? t('txt_passkey_created_at_value', { value: formatHistoryTime(createdAt) })
                      : t('txt_passkey');
                    return (
                      <div key={`login-passkey-${index}`} className="attachment-row">
                        <div className="attachment-main">
                          <div className="attachment-text">
                            <strong>{t('txt_passkey')}</strong>
                            <span>{label}</span>
                          </div>
                        </div>
                        <div className="kv-actions">
                          <button
                            type="button"
                            className="btn btn-secondary small"
                            disabled={props.busy}
                            onClick={() => props.onRequestDeleteLoginPasskey(index)}
                          >
                            <X size={14} className="btn-icon" />
                            {t('txt_remove')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {props.draft.type === 3 && (
        <div className="card">
          <h4>{t('txt_card_details')}</h4>
          <div className="field-grid">
            <label className="field"><span>{t('txt_cardholder_name')}</span><input className="input" value={props.draft.cardholderName} onInput={(e) => props.onUpdateDraft({ cardholderName: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field">
              <span>{t('txt_number')}</span>
              <input
                className="input"
                value={props.draft.cardNumber}
                onInput={(e) => {
                  const value = (e.currentTarget as HTMLInputElement).value;
                  const detectedBrand = normalizeCardBrand(cardBrand(value) || '');
                  props.onUpdateDraft({
                    cardNumber: value,
                    ...(props.draft.cardBrand ? {} : { cardBrand: detectedBrand }),
                  });
                }}
              />
            </label>
            <label className="field">
              <span>{t('txt_brand')}</span>
              <div className="card-brand-select-row">
                <CardBrandIcon brand={normalizedDraftCardBrand} />
                <select
                  className="input card-brand-select"
                  value={normalizedDraftCardBrand}
                  onInput={(e) => props.onUpdateDraft({ cardBrand: (e.currentTarget as HTMLSelectElement).value })}
                >
                  <option value="">{t('txt_select')}</option>
                  {cardBrandOptions.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="field"><span>{t('txt_security_code_cvv')}</span><input className="input" value={props.draft.cardCode} onInput={(e) => props.onUpdateDraft({ cardCode: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_expiry_month')}</span><input className="input" value={props.draft.cardExpMonth} onInput={(e) => props.onUpdateDraft({ cardExpMonth: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_expiry_year')}</span><input className="input" value={props.draft.cardExpYear} onInput={(e) => props.onUpdateDraft({ cardExpYear: (e.currentTarget as HTMLInputElement).value })} /></label>
          </div>
        </div>
      )}

      {props.draft.type === 4 && (
        <div className="card">
          <h4>{t('txt_identity_details')}</h4>
          <div className="field-grid">
            <label className="field"><span>{t('txt_title')}</span><input className="input" value={props.draft.identTitle} onInput={(e) => props.onUpdateDraft({ identTitle: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_first_name')}</span><input className="input" value={props.draft.identFirstName} onInput={(e) => props.onUpdateDraft({ identFirstName: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_middle_name')}</span><input className="input" value={props.draft.identMiddleName} onInput={(e) => props.onUpdateDraft({ identMiddleName: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_last_name')}</span><input className="input" value={props.draft.identLastName} onInput={(e) => props.onUpdateDraft({ identLastName: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_username')}</span><input className="input" value={props.draft.identUsername} onInput={(e) => props.onUpdateDraft({ identUsername: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_company')}</span><input className="input" value={props.draft.identCompany} onInput={(e) => props.onUpdateDraft({ identCompany: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_ssn')}</span><input className="input" value={props.draft.identSsn} onInput={(e) => props.onUpdateDraft({ identSsn: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_passport_number')}</span><input className="input" value={props.draft.identPassportNumber} onInput={(e) => props.onUpdateDraft({ identPassportNumber: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_license_number')}</span><input className="input" value={props.draft.identLicenseNumber} onInput={(e) => props.onUpdateDraft({ identLicenseNumber: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_email')}</span><input className="input" value={props.draft.identEmail} onInput={(e) => props.onUpdateDraft({ identEmail: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_phone')}</span><input className="input" value={props.draft.identPhone} onInput={(e) => props.onUpdateDraft({ identPhone: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_address_1')}</span><input className="input" value={props.draft.identAddress1} onInput={(e) => props.onUpdateDraft({ identAddress1: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_address_2')}</span><input className="input" value={props.draft.identAddress2} onInput={(e) => props.onUpdateDraft({ identAddress2: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_address_3')}</span><input className="input" value={props.draft.identAddress3} onInput={(e) => props.onUpdateDraft({ identAddress3: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_city_town')}</span><input className="input" value={props.draft.identCity} onInput={(e) => props.onUpdateDraft({ identCity: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_state_province')}</span><input className="input" value={props.draft.identState} onInput={(e) => props.onUpdateDraft({ identState: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_postal_code')}</span><input className="input" value={props.draft.identPostalCode} onInput={(e) => props.onUpdateDraft({ identPostalCode: (e.currentTarget as HTMLInputElement).value })} /></label>
            <label className="field"><span>{t('txt_country')}</span><input className="input" value={props.draft.identCountry} onInput={(e) => props.onUpdateDraft({ identCountry: (e.currentTarget as HTMLInputElement).value })} /></label>
          </div>
        </div>
      )}

      {props.draft.type === 5 && (
        <div className="card">
          <div className="section-head">
            <h4>{t('txt_ssh_key')}</h4>
            <button
              type="button"
              className="btn btn-secondary small"
              disabled={!props.isCreating}
              onClick={() => props.onSeedSshDefaults(true)}
            >
              <RefreshCw size={14} className="btn-icon" /> {t('txt_regenerate')}
            </button>
          </div>
          <label className="field">
            <span>{t('txt_private_key')}</span>
            <textarea
              className="input textarea"
              value={props.draft.sshPrivateKey}
              disabled={!props.isCreating}
              onInput={(e) => props.onUpdateDraft({ sshPrivateKey: (e.currentTarget as HTMLTextAreaElement).value })}
            />
          </label>
          <label className="field">
            <span>{t('txt_public_key')}</span>
            <textarea
              className="input textarea"
              value={props.draft.sshPublicKey}
              disabled={!props.isCreating}
              onInput={(e) => props.onUpdateSshPublicKey((e.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
          <label className="field">
            <span>{t('txt_fingerprint')}</span>
            <input className="input input-readonly" value={props.draft.sshFingerprint} readOnly />
          </label>
        </div>
      )}

      {/* Hidden file input for icon upload */}
      <input
        ref={iconInputRef}
        type="file"
        accept="image/*"
        className="attachment-file-input"
        onChange={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          void handleIconFile(input.files?.[0] || null);
          input.value = '';
        }}
      />

      {props.draft.customIcon && (
        <div className="card">
          <div className="section-head">
            <h4>{t('txt_custom_icon')}</h4>
            <button type="button" className="btn btn-secondary small" onClick={() => props.onUpdateDraft({ customIcon: '' })}>
              {t('txt_remove')}
            </button>
          </div>
          <div className="detail-sub">{t('txt_custom_icon_hint')}</div>
        </div>
      )}

      <div className="card">
        <div className="section-head attachment-head">
          <h4>{t('txt_attachments')}</h4>
          <button
            type="button"
            className="btn btn-secondary small attachment-add-btn"
            disabled={props.busy}
            onClick={() => props.attachmentInputRef.current?.click()}
            title={t('txt_upload_attachments')}
            aria-label={t('txt_upload_attachments')}
          >
            <Plus size={14} className="btn-icon" />
          </button>
        </div>
        {!!props.uploadingAttachmentName && <div className="detail-sub">{uploadLabel}</div>}
        {!props.isCreating && props.selectedCipher && props.editExistingAttachments.length > 0 && (
          <div className="attachment-list">
            {props.editExistingAttachments.map((attachment) => {
              const attachmentId = String(attachment?.id || '').trim();
              if (!attachmentId) return null;
              const removed = !!props.removedAttachmentIds[attachmentId];
              const fileName = String(attachment.decFileName || attachment.fileName || attachmentId).trim() || attachmentId;
              return (
                <div key={`edit-attachment-${attachmentId}`} className={`attachment-row ${removed ? 'is-removed' : ''}`}>
                  <div className="attachment-main">
                    <Paperclip size={14} />
                    <div className="attachment-text">
                      <strong className="value-ellipsis" title={fileName}>{fileName}</strong>
                      <span>{formatAttachmentSize(attachment)}</span>
                    </div>
                  </div>
                  <div className="kv-actions">
                    <button
                      type="button"
                      className="btn btn-secondary small"
                      disabled={props.busy || removed || props.downloadingAttachmentKey === `${props.selectedCipher?.id || ''}:${attachmentId}`}
                      onClick={() => props.onDownloadAttachment(props.selectedCipher as Cipher, attachmentId)}
                    >
                      <Download size={14} className="btn-icon" /> {formatDownloadLabel(attachmentId)}
                    </button>
                    <button type="button" className="btn btn-secondary small" disabled={props.busy} onClick={() => props.onToggleExistingAttachmentRemoval(attachmentId)}>
                      <X size={14} className="btn-icon" />
                      {removed ? t('txt_cancel') : t('txt_remove')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!!props.removedAttachmentCount && <div className="detail-sub">{t('txt_marked_for_removal_count', { count: props.removedAttachmentCount })}</div>}
        <input
          ref={props.attachmentInputRef}
          type="file"
          className="attachment-file-input"
          multiple
          disabled={props.busy}
          onChange={(e) => {
            const input = e.currentTarget as HTMLInputElement;
            props.onQueueAttachmentFiles(input.files);
            input.value = '';
          }}
        />
        {!!props.attachmentQueue.length && (
          <div className="attachment-list">
            <div className="attachment-queue-title">{t('txt_new_attachments')}</div>
            {props.attachmentQueue.map((file, index) => (
              <div key={`queued-attachment-${index}-${file.name}`} className="attachment-row">
                <div className="attachment-main">
                  <Upload size={14} />
                  <div className="attachment-text">
                    <strong className="value-ellipsis" title={file.name}>{file.name}</strong>
                    <span>{formatAttachmentSize({ size: file.size })}</span>
                  </div>
                </div>
                <div className="kv-actions">
                  <button type="button" className="btn btn-secondary small" disabled={props.busy} onClick={() => props.onRemoveQueuedAttachment(index)}>
                    <X size={14} className="btn-icon" />
                    {t('txt_remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-head">
          <h4>{t('txt_custom_fields')}</h4>
          <button type="button" className="btn btn-secondary small" onClick={props.onOpenFieldModal}>
            <Plus size={14} className="btn-icon" /> {t('txt_add_field')}
          </button>
        </div>
        {props.draft.customFields.length === 0 && (
          <div className="detail-sub">{t('txt_no_custom_fields')}</div>
        )}
        {(() => {
          const visible = props.draft.customFields
            .map((field, index) => ({ field, index }));
          const linkedIdOptions = getLinkedIdOptions();
          const linkedIdLabel = (linkedId: number) => {
            const option = linkedIdOptions.find(o => o.value === linkedId);
            return option?.label || t('txt_unknown');
          };
          const groups = new Map<string, typeof visible>();
          for (const entry of visible) {
            const g = entry.field.group || '';
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g)!.push(entry);
          }
          const groupEntries = Array.from(groups.entries());
          return groupEntries.map(([groupName, entries]) => (
            <div key={`group-${groupName || '__ungrouped'}`}>
              {groupName && (
                <div className="custom-field-group-header">
                  <span className="custom-field-group-name">{groupName}</span>
                </div>
              )}
              {entries.map(({ field, index }) => (
                <div key={`field-${index}`} className="custom-field-card">
                  <div className="custom-field-order-actions">
                    <button
                      type="button"
                      className="btn btn-secondary small field-order-btn"
                      title={t('txt_move_up')}
                      aria-label={t('txt_move_up')}
                      disabled={index === 0}
                      onClick={() => {
                        const fields = [...props.draft.customFields];
                        if (index <= 0) return;
                        [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
                        props.onUpdateDraftCustomFields(fields);
                      }}
                    >
                      <ArrowUp size={14} className="btn-icon" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary small field-order-btn"
                      title={t('txt_move_down')}
                      aria-label={t('txt_move_down')}
                      disabled={index >= props.draft.customFields.length - 1}
                      onClick={() => {
                        const fields = [...props.draft.customFields];
                        if (index >= fields.length - 1) return;
                        [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
                        props.onUpdateDraftCustomFields(fields);
                      }}
                    >
                      <ArrowDown size={14} className="btn-icon" />
                    </button>
                  </div>
                  <div className="custom-field-main">
                    <label className="field custom-field-label">
                      <span>{t('txt_field_label')}</span>
                      <input className="input" value={field.label} onInput={(e) => props.onPatchDraftCustomField(index, { label: (e.currentTarget as HTMLInputElement).value })} />
                    </label>
                    <label className="field custom-field-group-input">
                      <span>{t('txt_field_group')}</span>
                      <input className="input" value={field.group || ''} placeholder={t('txt_field_group_placeholder')} onInput={(e) => props.onPatchDraftCustomField(index, { group: (e.currentTarget as HTMLInputElement).value || undefined })} />
                    </label>
                    <div className="custom-field-body">
                      <div className="custom-field-value">
                        {field.type === 3 ? (
                          <div className="detail-sub">{t('txt_linked_identity_field')}: {linkedIdLabel(field.linkedId ?? 0)}</div>
                        ) : field.type === 2 ? (
                          <label className="check-line cf-check custom-field-check">
                            <input
                              type="checkbox"
                              checked={toBooleanFieldValue(field.value)}
                              onInput={(e) => props.onPatchDraftCustomField(index, { value: (e.currentTarget as HTMLInputElement).checked ? 'true' : 'false' })}
                            />
                            <span>{toBooleanFieldValue(field.value) ? t('txt_checked') : t('txt_unchecked')}</span>
                          </label>
                        ) : field.type === 4 ? (
                          <div className="custom-field-attachment">
                            {field._file ? (
                              <div className="attachment-row">
                                <span className="value-ellipsis" title={field._file.name}>{field._file.name}</span>
                                <button
                                  type="button"
                                  className="btn btn-secondary small"
                                  onClick={() => props.onPatchDraftCustomField(index, { _file: null, value: '' })}
                                >
                                  <X size={14} className="btn-icon" />
                                </button>
                              </div>
                            ) : field.attachmentId ? (
                              <div className="detail-sub">{t('txt_field_attachment_saved')}</div>
                            ) : (
                              <div className="detail-sub">{t('txt_field_attachment_hint')}</div>
                            )}
                          </div>
                        ) : (
                          <textarea
                            className="input textarea custom-field-textarea"
                            value={field.value}
                            onInput={(e) => props.onPatchDraftCustomField(index, { value: (e.currentTarget as HTMLTextAreaElement).value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="custom-field-right-actions">
                    <button type="button" className="btn btn-secondary small custom-field-remove" onClick={() => props.onUpdateDraftCustomFields(props.draft.customFields.filter((_, i) => i !== index))}>
                      <X size={14} className="btn-icon" />
                      {t('txt_remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ));
        })()}
      </div>

      <div className="card">
        <h4>{t('txt_additional_options')}</h4>
        <label className="field">
          <span>{t('txt_notes')}</span>
          <textarea className="input textarea" value={props.draft.notes} onInput={(e) => props.onUpdateDraft({ notes: (e.currentTarget as HTMLTextAreaElement).value })} />
        </label>
        <label className="check-line">
          <input type="checkbox" checked={props.draft.reprompt} onInput={(e) => props.onUpdateDraft({ reprompt: (e.currentTarget as HTMLInputElement).checked })} />
          {t('txt_master_password_reprompt')}
        </label>
      </div>

      <div className="detail-actions">
        <div className="actions">
          <button type="button" className="btn btn-primary" disabled={saveDisabled} onClick={props.onSave}>
            {props.busy ? <span className="btn-spinner" /> : <CheckCheck size={14} className="btn-icon" />}
            {props.busy ? t('txt_saving') : t('txt_confirm')}
          </button>
          <button type="button" className="btn btn-secondary" disabled={props.busy} onClick={props.onCancel}>
            <X size={14} className="btn-icon" />
            {t('txt_cancel')}
          </button>
        </div>
        {!props.isCreating && props.selectedCipher && (
          <button type="button" className="btn btn-danger" disabled={props.busy} onClick={props.onDeleteSelected}>
            <Trash2 size={14} className="btn-icon" />
            {t('txt_delete')}
          </button>
        )}
      </div>
      {props.localError && <div className="local-error">{props.localError}</div>}
      {pgOpen && typeof document !== 'undefined' ? createPortal((
        <div className="dialog-mask open" onClick={(event) => event.target === event.currentTarget && setPgOpen(false)}>
          <section className="dialog-card pw-gen-dialog open" role="dialog" aria-modal="true" aria-label={t('txt_generate_password')}>
            <div className="pw-gen-head">
              <h3 className="dialog-title">{t('txt_generate_password')}</h3>
              <button
                type="button"
                className="pw-gen-close"
                onClick={() => setPgOpen(false)}
                title={t('txt_close')}
                aria-label={t('txt_close')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="pw-gen-body">
              <div className="pw-gen-preview-row">
                <input className="input pw-gen-preview" value={pgPassword} readOnly />
                <button type="button" className="btn btn-secondary small" onClick={regeneratePreview}>
                  <RefreshCw size={14} className="btn-icon" />
                </button>
              </div>
              <div className="pw-gen-slider-row">
                <span>{t('txt_password_length')}: {pgLength}</span>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={pgLength}
                  className="pw-gen-slider"
                  onInput={(e) => {
                    const newLen = Number((e.currentTarget as HTMLInputElement).value);
                    setPgLength(newLen);
                    setPgPassword(generatePasswordWithOptions(newLen, pgUppercase, pgLowercase, pgNumbers, pgSymbols, pgExcludeSimilar));
                  }}
                />
              </div>
              <div className="pw-gen-options">
                <label className="pw-gen-option">
                  <input type="checkbox" checked={pgUppercase} onInput={() => {
                    const next = !pgUppercase; setPgUppercase(next);
                    setPgPassword(generatePasswordWithOptions(pgLength, next, pgLowercase, pgNumbers, pgSymbols, pgExcludeSimilar));
                  }} />
                  <span>A-Z</span>
                </label>
                <label className="pw-gen-option">
                  <input type="checkbox" checked={pgLowercase} onInput={() => {
                    const next = !pgLowercase; setPgLowercase(next);
                    setPgPassword(generatePasswordWithOptions(pgLength, pgUppercase, next, pgNumbers, pgSymbols, pgExcludeSimilar));
                  }} />
                  <span>a-z</span>
                </label>
                <label className="pw-gen-option">
                  <input type="checkbox" checked={pgNumbers} onInput={() => {
                    const next = !pgNumbers; setPgNumbers(next);
                    setPgPassword(generatePasswordWithOptions(pgLength, pgUppercase, pgLowercase, next, pgSymbols, pgExcludeSimilar));
                  }} />
                  <span>0-9</span>
                </label>
                <label className="pw-gen-option">
                  <input type="checkbox" checked={pgSymbols} onInput={() => {
                    const next = !pgSymbols; setPgSymbols(next);
                    setPgPassword(generatePasswordWithOptions(pgLength, pgUppercase, pgLowercase, pgNumbers, next, pgExcludeSimilar));
                  }} />
                  <span>!@#$%</span>
                </label>
                <label className="pw-gen-option">
                  <input type="checkbox" checked={pgExcludeSimilar} onInput={() => {
                    const next = !pgExcludeSimilar; setPgExcludeSimilar(next);
                    setPgPassword(generatePasswordWithOptions(pgLength, pgUppercase, pgLowercase, pgNumbers, pgSymbols, next));
                  }} />
                  <span>{t('txt_exclude_similar')}</span>
                </label>
              </div>
            </div>
            <div className="pw-gen-footer">
              <button type="button" className="btn btn-primary full" onClick={applyGeneratedPassword}>
                <CheckCheck size={14} className="btn-icon" /> {t('txt_apply')}
              </button>
            </div>
          </section>
        </div>
      ), document.body) : null}
      {totpQrOpen && typeof document !== 'undefined' ? createPortal((
        <div className="dialog-mask totp-scan-mask open" onClick={(event) => event.target === event.currentTarget && setTotpQrOpen(false)}>
          <section className="dialog-card totp-scan-dialog open" role="dialog" aria-modal="true" aria-label={t('txt_scan_totp_qr')}>
            <div className="totp-scan-head">
              <h3 className="dialog-title">{t('txt_scan_totp_qr')}</h3>
              <button
                type="button"
                className="totp-scan-close"
                onClick={() => setTotpQrOpen(false)}
                title={t('txt_close')}
                aria-label={t('txt_close')}
              >
                <X size={20} className="btn-icon" />
              </button>
            </div>
            <div className="totp-scan-frame">
              <video ref={totpQrVideoRef} className="totp-scan-video" muted playsInline />
              <div className="totp-scan-corners" aria-hidden="true" />
            </div>
            <div className="totp-scan-footer">
              <div className="dialog-message totp-scan-status">{totpQrStatus || t('txt_totp_qr_point_camera')}</div>
              <div className="actions totp-scan-actions">
                <button type="button" className="btn btn-secondary dialog-btn" disabled={totpQrBusy} onClick={() => totpQrFileRef.current?.click()}>
                  <Upload size={14} className="btn-icon" />
                  {t('txt_totp_qr_choose_image')}
                </button>
                <button type="button" className="btn btn-primary dialog-btn" onClick={() => setTotpQrOpen(false)}>
                  <X size={14} className="btn-icon" />
                  {t('txt_close')}
                </button>
              </div>
            </div>
            <input
              ref={totpQrFileRef}
              type="file"
              accept="image/*"
              className="attachment-file-input"
              onChange={(event) => {
                const input = event.currentTarget as HTMLInputElement;
                void handleTotpQrFile(input.files?.[0] || null);
                input.value = '';
              }}
            />
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
