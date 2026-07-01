import { useMemo } from 'preact/hooks';
import {
  CreditCard,
  FileKey2,
  Globe,
  KeyRound,
  ShieldUser,
  StickyNote,
} from 'lucide-preact';
import { copyTextToClipboard } from '@/lib/clipboard';
import { t } from '@/lib/i18n';
import type { Cipher, CipherAttachment, CustomFieldType, VaultDraft, VaultDraftField, VaultDraftGroup, VaultDraftGroupLogin, VaultDraftLoginUri } from '@/lib/types';
import WebsiteIcon from './WebsiteIcon';

export type TypeFilter = 'login' | 'card' | 'identity' | 'note' | 'ssh';
export type VaultSortMode = 'edited' | 'created' | 'name';
export type SidebarFilter =
  | { kind: 'all' }
  | { kind: 'favorite' }
  | { kind: 'archive' }
  | { kind: 'trash' }
  | { kind: 'duplicates' }
  | { kind: 'type'; value: TypeFilter }
  | { kind: 'folder'; folderId: string | null };

interface TypeOption {
  type: number;
  label: string;
}

export const CARD_BRAND_OPTIONS = [
  'Visa',
  'Mastercard',
  'American Express',
  'Discover',
  'Diners Club',
  'JCB',
  'Maestro',
  'UnionPay',
  'RuPay',
] as const;

type CardBrand = typeof CARD_BRAND_OPTIONS[number];

const CARD_BRAND_ALIASES: Record<string, CardBrand> = {
  amex: 'American Express',
  'american express': 'American Express',
  americanexpress: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  'diners club': 'Diners Club',
  dinersclub: 'Diners Club',
  jcb: 'JCB',
  maestro: 'Maestro',
  mastercard: 'Mastercard',
  master: 'Mastercard',
  rupay: 'RuPay',
  unionpay: 'UnionPay',
  'union pay': 'UnionPay',
  visa: 'Visa',
};

const CARD_BRAND_LOGO_SLUGS: Partial<Record<CardBrand, string>> = {
  'American Express': 'american-express',
  'Diners Club': 'diners',
  Discover: 'discover',
  JCB: 'jcb',
  Maestro: 'maestro',
  Mastercard: 'mastercard',
  UnionPay: 'unionpay',
  Visa: 'visa',
};

export function normalizeCardBrand(value: string | null | undefined): string {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return CARD_BRAND_ALIASES[normalized.toLowerCase().replace(/\s+/g, ' ')] || normalized;
}

export function displayCardBrand(value: string | null | undefined): string {
  return normalizeCardBrand(value);
}

export function cardLast4(value: string | null | undefined): string {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : '';
}

export function cardListSubtitle(cipher: Cipher): string {
  const brand = displayCardBrand(cipher.card?.decBrand ?? cipher.card?.brand);
  const last4 = cardLast4(cipher.card?.decNumber ?? cipher.card?.number);
  if (brand && last4) return `${brand}, *${last4}`;
  if (brand) return brand;
  if (last4) return `*${last4}`;
  return cipherTypeLabel(3);
}

export function CardBrandIcon({ brand }: { brand?: string | null }) {
  const display = displayCardBrand(brand);
  const key = display.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'generic';
  const label = display || t('txt_card');
  const logoSlug = CARD_BRAND_LOGO_SLUGS[display as CardBrand];
  return (
    <span className={`card-brand-icon card-brand-${key}`} aria-label={label} title={label}>
      {logoSlug ? (
        <img src={`/payment-logos/cards/${logoSlug}.svg`} alt="" loading="lazy" decoding="async" />
      ) : (
        <CreditCard size={18} />
      )}
    </span>
  );
}

const PLATFORM_KEYS = ['google', 'apple', 'facebook', 'microsoft', 'twitter', 'github', 'wechat', 'alipay', 'amazon', 'discord', 'telegram', 'qq', 'weibo'];

export function PlatformIcon({ platform }: { platform?: string }) {
  const label = platform || '';
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'generic';
  const known = PLATFORM_KEYS.includes(key) ? key : 'generic';
  const ICON_SIZE = 20;
  return (
    <span className={`platform-icon platform-${key}`} aria-label={label} title={label}>
      {known === 'google' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {key === 'apple' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )}
      {key === 'facebook' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      {key === 'microsoft' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
          <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
          <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
          <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
          <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
        </svg>
      )}
      {key === 'twitter' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#000">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )}
      {key === 'github' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      )}
      {key === 'wechat' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#07C160">
          <path d="M8.5 2C4.36 2 1 4.87 1 8.44c0 2.11 1.03 3.99 2.68 5.28l-.68 2.1 2.48-1.37c.93.27 1.91.42 2.92.42l.43-.01A6.43 6.43 0 0 1 8.5 12.5C8.5 7.81 12.08 4 16.5 4L16 3.95C14.22 2.7 11.97 2 9.5 2c-.34 0-.67.02-1 .05m4.5 1C21.17 3 26 7.48 26 12.83c0 3.02-1.69 5.72-4.31 7.46l.89 2.71-3.18-1.76c-1.09.3-2.24.47-3.44.47l-.57-.01A6.98 6.98 0 0 0 18 16.5c0-4.14-3.58-7.5-8-7.5z" transform="scale(0.85) translate(1, 1)"/>
        </svg>
      )}
      {key === 'alipay' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#1677FF">
          <path d="M21.43 17.29c-1.9-1.03-8.11-4.14-10.72-5.79A7.35 7.35 0 0 0 12.88 10c-2.16 0-5.28 1.21-7.16 2.4a8.24 8.24 0 0 0-1.95 1.54c.1.43.28.83.53 1.18A7.08 7.08 0 0 0 7.33 17c1.78.7 3.68.89 5.55.55a6.56 6.56 0 0 0 2.31-.86c.28-.16.54-.34.79-.53l3.65 1.6c-.18.24-.38.47-.6.68a8.45 8.45 0 0 1-5.29 2.24c-2.5.15-4.93-.49-7.07-1.63-1.37-.73-2.5-1.72-3.46-2.88l-.01.01C2.5 14.85 1.5 12.6 1.24 10.3c-.08-.69-.03-1.39.07-2.06C2.16 4.04 6.1 1.55 11.5 1.55c2.2 0 4.55.55 6.42 1.88 1.99 1.4 3.16 3.57 3.37 5.96.11 1.14.03 2.25-.24 3.34-.03.13-.1.38-.1.38l-8.22-3.53v.12c1.29 1.01 2.84 1.71 4.37 2.34 1.64.67 4.16 1.8 6.15 2.54.2.08.4.12.56.1.39-.08.75-.19 1.1-.15.68.08 1.19.5 1.19 1.14 0 .18-.04.36-.11.52-.26.6-.6 1.12-1.03 1.58-.9.95-1.98 1.6-3.14 2.04l.01.01Zm-5.44-8.84-1.73 3.53 3.24 1.39c.01-.76.02-1.51.08-2.26.06-.85.24-1.68.55-2.45l-2.14-.21Z"/>
        </svg>
      )}
      {key === 'amazon' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#FF9900">
          <path d="M13.86 14.34c1.1-.42 2.38-.85 3.29-1.17.91-.32 1.58-.46 1.58-.46s-.46.37-1.18.73c-1.62.82-3.95 1.65-5.95 1.65-2.47 0-4.7-1.18-6.21-2.93-.42-.49-.07-.28.3-.1.95.5 2.12.95 3.37 1.19 1.33.26 2.63.36 3.85.28 1.15-.08 2.16-.31 2.95-.64l-.05-.03c1.1-.46 2.67-1.64 2.93-2.33.04-.1.03-.13-.02-.1-.83.57-2.76 1.64-4.06 1.95-1.46.34-2.82.47-4.46.45-1.68-.02-3.3-.39-4.49-1.1-1.02-.61-1.78-1.49-2.3-2.56-.54-1.1-.86-2.52-.86-4.15 0-1.66.33-3.16.86-4.26.52-1.07 1.29-1.96 2.3-2.57C8.45.63 10.07.26 11.75.28c1.46.01 2.81.16 4.04.42 1.08.23 2.14.56 3.16.98.17.07.32.14.47.21V.87h1.83v8.77c0 1.27-.23 2.37-.68 3.3-.45.93-1.08 1.7-1.88 2.31-.81.61-1.77 1.07-2.88 1.38-1.11.31-2.31.47-3.6.47-1.43 0-2.73-.24-3.9-.73-1.13-.47-2.08-1.13-2.86-1.98-.08-.09-.13-.16-.15-.21l.06-.06c.02-.02.05-.01.08 0 .93.49 1.99.88 3.16 1.17 1.2.3 2.46.45 3.76.45.86 0 1.8-.08 2.79-.26zM8.79 7.99c.02.37.11.71.27 1.01.16.3.38.56.65.78.51.41 1.12.62 1.83.62.79 0 1.45-.28 1.98-.83.53-.55.9-1.33 1.1-2.34.2-1.01.3-2.2.3-3.59v-.18c-.04-.27-.11-.52-.22-.73-.11-.21-.25-.38-.43-.51-.33-.24-.72-.36-1.17-.36-.79 0-1.44.28-1.96.84-.52.56-.88 1.34-1.07 2.35-.19 1.01-.28 2.19-.28 3.56z"/>
        </svg>
      )}
      {key === 'discord' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#5865F2">
          <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )}
      {key === 'telegram' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#0088CC">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      )}
      {key === 'qq' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#12B7F5">
          <path d="M22.36 14.56c-.6-1.1-1.4-2.1-2.4-2.9.2-.9.3-1.8.3-2.8 0-4.5-2.7-7.5-7.5-7.5S5.26 4.36 5.26 8.86c0 1 .1 1.9.3 2.8-1 .8-1.8 1.8-2.4 2.9-.7 1.2-1 2.5-1 3.8 0 .8.2 1.5.5 2.1.8 1.4 2.4 2.2 4.5 2.2 1.6 0 3-.5 4-1.3.4.1.8.2 1.2.2s.8-.1 1.2-.2c1 .8 2.4 1.3 4 1.3 2.1 0 3.7-.8 4.5-2.2.4-.6.5-1.3.5-2.1 0-1.3-.3-2.6-1.1-3.8zm-5.9 1.6c-.4.6-1.2 1-2.1 1-.9 0-1.7-.4-2.1-1-.2-.3-.1-.7.2-.9.3-.2.7-.1.9.2.2.3.6.5 1 .5s.8-.2 1-.5c.2-.3.6-.4.9-.2.3.2.4.6.2.9z"/>
        </svg>
      )}
      {key === 'weibo' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#E6162D">
          <path d="M10.1 21.05c-4.2.5-7.7-1.3-8.2-3.9s2.6-5.2 6.8-5.6c4.2-.5 7.7 1.3 8.2 3.9s-2.6 5.1-6.8 5.6zm-1.1-6.6c-2.9.3-4.3 2.1-3.9 3.8.4 1.7 2.7 2.8 5.6 2.5 2.9-.3 4.3-2.1 3.9-3.8-.4-1.7-2.7-2.8-5.6-2.5zm-.7 4.5c-.7.1-1.2-.2-1.2-.6s.4-.8 1.1-.9c.7-.1 1.2.2 1.2.6s-.4.8-1.1.9zm4-2.2c-.3.1-.5-.1-.5-.3s.2-.5.5-.5c.3-.1.5.1.5.3s-.2.5-.5.5zM20.4 5.3c-1.2-1.4-3.3-2-5.3-1.5-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 2.5-.6 5.1.1 6.6 1.9 1.5 1.7 1.8 4.3 1 6.6-.2.5-.7.7-1.2.5-.5-.2-.7-.7-.5-1.2.6-1.7.3-3.6-.8-4.9l.5-.1zm-2.7.4c-1.3-.5-2.7-.3-3.7.2-.3.2-.7.1-.9-.2-.2-.3-.1-.7.2-.9 1.3-.7 3.1-.9 4.7-.2.4.2.5.6.4 1-.2.3-.5.4-.7.1z"/>
        </svg>
      )}
      {known === 'generic' && (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="#64748b">
          <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
        </svg>
      )}
    </span>
  );
}

export function getCreateTypeOptions(): TypeOption[] {
  return [
    { type: 1, label: t('txt_login') },
    { type: 3, label: t('txt_card') },
    { type: 4, label: t('txt_identity') },
    { type: 2, label: t('txt_note') },
    { type: 5, label: t('txt_ssh_key') },
  ];
}

export const VAULT_SORT_STORAGE_KEY = 'nodewarden.vault.sort.v1';
export const FOLDER_SORT_STORAGE_KEY = 'nodewarden.folder-sort.v1';
export const MOBILE_LAYOUT_QUERY = '(max-width: 1180px)';
export const VAULT_LIST_ROW_HEIGHT = 74;
export const VAULT_LIST_OVERSCAN = 10;
export function getVaultSortOptions(): Array<{ value: VaultSortMode; label: string }> {
  return [
    { value: 'edited', label: t('txt_sort_last_edited') },
    { value: 'created', label: t('txt_sort_created') },
    { value: 'name', label: t('txt_sort_name') },
  ];
}

export function getFolderSortOptions(): Array<{ value: VaultSortMode; label: string }> {
  return [
    { value: 'edited', label: t('txt_sort_last_edited') },
    { value: 'created', label: t('txt_sort_created') },
    { value: 'name', label: t('txt_sort_name') },
  ];
}

export function getFieldTypeOptions(): Array<{ value: CustomFieldType; label: string }> {
  return [
    { value: 0, label: t('txt_text') },
    { value: 1, label: t('txt_hidden') },
    { value: 2, label: t('txt_boolean') },
    { value: 3, label: t('txt_linked') },
    { value: 4, label: t('txt_attachment') },
  ];
}

export function getLinkedIdOptions(): Array<{ value: number; label: string }> {
  return [
    { value: 100, label: t('txt_title') },
    { value: 117, label: t('txt_first_name') },
    { value: 101, label: t('txt_middle_name') },
    { value: 102, label: t('txt_last_name') },
    { value: 103, label: t('txt_address_1') },
    { value: 104, label: t('txt_address_2') },
    { value: 105, label: t('txt_address_3') },
    { value: 106, label: t('txt_city_town') },
    { value: 107, label: t('txt_state_province') },
    { value: 108, label: t('txt_postal_code') },
    { value: 109, label: t('txt_country') },
    { value: 110, label: t('txt_company') },
    { value: 111, label: t('txt_email') },
    { value: 112, label: t('txt_phone') },
    { value: 113, label: t('txt_ssn') },
    { value: 114, label: t('txt_username') },
    { value: 115, label: t('txt_passport_number') },
    { value: 116, label: t('txt_license_number') },
  ];
}

export function getWebsiteMatchOptions(): Array<{ value: number | null; label: string }> {
  return [
    { value: null, label: t('txt_uri_match_homepage') },
    { value: 1, label: t('txt_uri_match_login_page') },
    { value: 3, label: t('txt_uri_match_other') },
  ];
}

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_RING_RADIUS = 14;
export const TOTP_RING_CIRCUMFERENCE = 2 * Math.PI * TOTP_RING_RADIUS;

export function CreateTypeIcon({ type }: { type: number }) {
  if (type === 1) return <Globe size={15} />;
  if (type === 3) return <CreditCard size={15} />;
  if (type === 4) return <ShieldUser size={15} />;
  if (type === 2) return <StickyNote size={15} />;
  if (type === 5) return <KeyRound size={15} />;
  return <FileKey2 size={15} />;
}

export function cipherTypeKey(type: number): TypeFilter {
  if (type === 1) return 'login';
  if (type === 3) return 'card';
  if (type === 4) return 'identity';
  if (type === 2) return 'note';
  return 'ssh';
}

function cipherDeletedValue(cipher: Cipher): boolean {
  return !!(cipher.deletedDate || (cipher as { deletedAt?: string | null }).deletedAt);
}

function cipherArchivedValue(cipher: Cipher): boolean {
  return !!(cipher.archivedDate || (cipher as { archivedAt?: string | null }).archivedAt);
}

export function isCipherDeleted(cipher: Cipher): boolean {
  return cipherDeletedValue(cipher);
}

export function isCipherArchived(cipher: Cipher): boolean {
  return cipherArchivedValue(cipher) && !cipherDeletedValue(cipher);
}

export function isCipherVisibleInNormalVault(cipher: Cipher): boolean {
  return !cipherDeletedValue(cipher) && !cipherArchivedValue(cipher);
}

export function isCipherVisibleInArchive(cipher: Cipher): boolean {
  return !cipherDeletedValue(cipher) && cipherArchivedValue(cipher);
}

export function isCipherVisibleInTrash(cipher: Cipher): boolean {
  return cipherDeletedValue(cipher);
}

export function cipherTypeLabel(type: number): string {
  if (type === 1) return t('txt_login');
  if (type === 3) return t('txt_card');
  if (type === 4) return t('txt_identity');
  if (type === 2) return t('txt_secure_note');
  if (type === 5) return t('txt_ssh_key');
  return t('txt_item');
}

export function TypeIcon({ type }: { type: number }) {
  if (type === 1) return <Globe size={18} />;
  if (type === 3) return <CreditCard size={18} />;
  if (type === 4) return <ShieldUser size={18} />;
  if (type === 2) return <StickyNote size={18} />;
  if (type === 5) return <KeyRound size={18} />;
  return <FileKey2 size={18} />;
}

export function parseFieldType(value: number | string | null | undefined): CustomFieldType {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  if (value === '1' || String(value).toLowerCase() === 'hidden') return 1;
  if (value === '2' || String(value).toLowerCase() === 'boolean') return 2;
  if (value === '3' || String(value).toLowerCase() === 'linked') return 3;
  if (value === '4' || String(value).toLowerCase() === 'attachment') return 4;
  return 0;
}

export function toBooleanFieldValue(raw: string): boolean {
  const v = String(raw || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export { firstCipherUri, hostFromUri, websiteIconUrl } from '@/lib/website-utils';

const DOMAIN_TO_NAME: Record<string, string> = {
  'google.com': 'Google',
  'mail.google.com': 'Gmail',
  'drive.google.com': 'Google Drive',
  'docs.google.com': 'Google Docs',
  'youtube.com': 'YouTube',
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'bitbucket.org': 'Bitbucket',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'twitter.com': 'Twitter',
  'x.com': 'X / Twitter',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'whatsapp.com': 'WhatsApp',
  'telegram.org': 'Telegram',
  'discord.com': 'Discord',
  'slack.com': 'Slack',
  'microsoft.com': 'Microsoft',
  'outlook.com': 'Outlook',
  'live.com': 'Microsoft Live',
  'office.com': 'Microsoft 365',
  'azure.com': 'Microsoft Azure',
  'apple.com': 'Apple',
  'icloud.com': 'iCloud',
  'amazon.com': 'Amazon',
  'amazon.co.jp': 'Amazon Japan',
  'aws.amazon.com': 'AWS',
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'twitch.tv': 'Twitch',
  'dropbox.com': 'Dropbox',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'vercel.com': 'Vercel',
  'heroku.com': 'Heroku',
  'digitalocean.com': 'DigitalOcean',
  'cloudflare.com': 'Cloudflare',
  'stackoverflow.com': 'Stack Overflow',
  'medium.com': 'Medium',
  'wordpress.com': 'WordPress',
  'wikipedia.org': 'Wikipedia',
  'baidu.com': '百度',
  'zhihu.com': '知乎',
  'bilibili.com': 'Bilibili',
  'weibo.com': '微博',
  'douyin.com': '抖音',
  'taobao.com': '淘宝',
  'tmall.com': '天猫',
  'jd.com': '京东',
  'meituan.com': '美团',
  'dianping.com': '大众点评',
  'alipay.com': '支付宝',
  'tencent.com': '腾讯',
  'qq.com': 'QQ',
  'weixin.qq.com': '微信',
  '163.com': '网易',
  'sina.com.cn': '新浪',
  'xiaomi.com': '小米',
  'bytedance.com': '字节跳动',
  'paypal.com': 'PayPal',
  'stripe.com': 'Stripe',
  'atlassian.com': 'Atlassian',
  'jira.com': 'Jira',
  'notion.com': 'Notion',
  'canva.com': 'Canva',
  'zoom.us': 'Zoom',
  'teams.microsoft.com': 'Microsoft Teams',
  'chat.openai.com': 'ChatGPT',
  'claude.ai': 'Claude',
};

function stripWww(host: string): string {
  return host.replace(/^www\./, '');
}

function domainToReadableName(host: string): string {
  const stripped = stripWww(host);
  // Check exact match first
  if (DOMAIN_TO_NAME[stripped]) return DOMAIN_TO_NAME[stripped];
  // Check parent domain
  const parts = stripped.split('.');
  if (parts.length >= 2) {
    const parent = parts.slice(parts.length - 2).join('.');
    if (DOMAIN_TO_NAME[parent]) return DOMAIN_TO_NAME[parent];
  }
  // Fallback: capitalize the first part of the domain
  const namePart = parts[0] || stripped;
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function suggestNameFromUrl(url: string): string | null {
  if (!url.trim()) return null;
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const hostname = new URL(normalized).hostname;
    if (!hostname) return null;
    return domainToReadableName(hostname);
  } catch {
    return null;
  }
}

export function createEmptyLoginUri(): VaultDraftLoginUri {
  return { uri: '', match: null, originalUri: '', extra: {} };
}

export function websiteMatchLabel(value: number | null | undefined): string {
  const normalized = typeof value === 'number' && Number.isFinite(value) ? value : null;
  return getWebsiteMatchOptions().find((option) => option.value === normalized)?.label || t('txt_uri_match_default_base_domain');
}

function valueOrFallback(value: string | null | undefined): string {
  return String(value || '');
}

export function buildCipherDuplicateSignature(cipher: Cipher): string {
  const normalized = {
    type: Number(cipher.type || 1),
    folderId: cipher.folderId || null,
    favorite: !!cipher.favorite,
    reprompt: Number(cipher.reprompt || 0),
    name: valueOrFallback(cipher.decName ?? cipher.name),
    notes: valueOrFallback(cipher.decNotes ?? cipher.notes),
    login: cipher.login
      ? {
          username: valueOrFallback(cipher.login.decUsername ?? cipher.login.username),
          password: valueOrFallback(cipher.login.decPassword ?? cipher.login.password),
          totp: valueOrFallback(cipher.login.decTotp ?? cipher.login.totp),
          uris: (cipher.login.uris || []).map((uri) => ({
            uri: valueOrFallback(uri.decUri ?? uri.uri),
            match: uri.match ?? null,
          })),
          fido2Credentials: (cipher.login.fido2Credentials || []).map((credential) => ({
            creationDate: valueOrFallback(credential.creationDate),
          })),
        }
      : null,
    card: cipher.card
      ? {
          cardholderName: valueOrFallback(cipher.card.decCardholderName ?? cipher.card.cardholderName),
          number: valueOrFallback(cipher.card.decNumber ?? cipher.card.number),
          brand: valueOrFallback(cipher.card.decBrand ?? cipher.card.brand),
          expMonth: valueOrFallback(cipher.card.decExpMonth ?? cipher.card.expMonth),
          expYear: valueOrFallback(cipher.card.decExpYear ?? cipher.card.expYear),
          code: valueOrFallback(cipher.card.decCode ?? cipher.card.code),
        }
      : null,
    identity: cipher.identity
      ? {
          title: valueOrFallback(cipher.identity.decTitle ?? cipher.identity.title),
          firstName: valueOrFallback(cipher.identity.decFirstName ?? cipher.identity.firstName),
          middleName: valueOrFallback(cipher.identity.decMiddleName ?? cipher.identity.middleName),
          lastName: valueOrFallback(cipher.identity.decLastName ?? cipher.identity.lastName),
          username: valueOrFallback(cipher.identity.decUsername ?? cipher.identity.username),
          company: valueOrFallback(cipher.identity.decCompany ?? cipher.identity.company),
          ssn: valueOrFallback(cipher.identity.decSsn ?? cipher.identity.ssn),
          passportNumber: valueOrFallback(cipher.identity.decPassportNumber ?? cipher.identity.passportNumber),
          licenseNumber: valueOrFallback(cipher.identity.decLicenseNumber ?? cipher.identity.licenseNumber),
          email: valueOrFallback(cipher.identity.decEmail ?? cipher.identity.email),
          phone: valueOrFallback(cipher.identity.decPhone ?? cipher.identity.phone),
          address1: valueOrFallback(cipher.identity.decAddress1 ?? cipher.identity.address1),
          address2: valueOrFallback(cipher.identity.decAddress2 ?? cipher.identity.address2),
          address3: valueOrFallback(cipher.identity.decAddress3 ?? cipher.identity.address3),
          city: valueOrFallback(cipher.identity.decCity ?? cipher.identity.city),
          state: valueOrFallback(cipher.identity.decState ?? cipher.identity.state),
          postalCode: valueOrFallback(cipher.identity.decPostalCode ?? cipher.identity.postalCode),
          country: valueOrFallback(cipher.identity.decCountry ?? cipher.identity.country),
        }
      : null,
    sshKey: cipher.sshKey
      ? {
          privateKey: valueOrFallback(cipher.sshKey.decPrivateKey ?? cipher.sshKey.privateKey),
          publicKey: valueOrFallback(cipher.sshKey.decPublicKey ?? cipher.sshKey.publicKey),
          fingerprint: valueOrFallback(cipher.sshKey.decFingerprint ?? cipher.sshKey.keyFingerprint ?? cipher.sshKey.fingerprint),
        }
      : null,
    secureNoteType: cipher.secureNote?.type ?? null,
    fields: (cipher.fields || []).map((field) => ({
      type: field.type ?? null,
      name: valueOrFallback(field.decName ?? field.name),
      value: valueOrFallback(field.decValue ?? field.value),
      linkedId: field.linkedId ?? null,
    })),
    passwordHistory: (cipher.passwordHistory || []).map((entry) => ({
      password: valueOrFallback(entry.decPassword ?? entry.password),
      lastUsedDate: valueOrFallback(entry.lastUsedDate),
    })),
  };
  return JSON.stringify(normalized);
}

export function createEmptyGroupLogin(): VaultDraftGroupLogin {
  return {
    id: crypto.randomUUID(),
    loginType: 'password',
    username: '',
    password: '',
    totp: '',
    fido2Credentials: [],
    thirdPartyPlatform: '',
    thirdPartyAccount: '',
    phoneNumber: '',
  };
}

export function createEmptyGroup(): VaultDraftGroup {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    logins: [createEmptyGroupLogin()],
    customFields: [],
    attachments: [],
    removedAttachmentIds: {},
  };
}

export function createEmptyDraft(type: number): VaultDraft {
  return {
    id: crypto.randomUUID(),
    type,
    favorite: false,
    name: '',
    folderId: '',
    customIcon: '',
    loginType: 'password',
    thirdPartyPlatform: '',
    thirdPartyAccount: '',
    phoneNumber: '',
    notes: '',
    reprompt: false,
    loginUsername: '',
    loginPassword: '',
    loginTotp: '',
    loginUris: [createEmptyLoginUri()],
    loginFido2Credentials: [],
    cardholderName: '',
    cardNumber: '',
    cardBrand: '',
    cardExpMonth: '',
    cardExpYear: '',
    cardCode: '',
    identTitle: '',
    identFirstName: '',
    identMiddleName: '',
    identLastName: '',
    identUsername: '',
    identCompany: '',
    identSsn: '',
    identPassportNumber: '',
    identLicenseNumber: '',
    identEmail: '',
    identPhone: '',
    identAddress1: '',
    identAddress2: '',
    identAddress3: '',
    identCity: '',
    identState: '',
    identPostalCode: '',
    identCountry: '',
    sshPrivateKey: '',
    sshPublicKey: '',
    sshFingerprint: '',
    customFields: [],
    groups: [],
    groupsTitle: '',
    groupsDescription: '',
  };
}

export function draftFromCipher(cipher: Cipher): VaultDraft {
  const draft = createEmptyDraft(Number(cipher.type || 1));
  draft.id = cipher.id;
  draft.favorite = !!cipher.favorite;
  draft.name = cipher.decName || '';
  draft.folderId = cipher.folderId || '';
  draft.notes = cipher.decNotes || '';
  draft.reprompt = Number(cipher.reprompt || 0) === 1;

  if (cipher.login) {
    draft.loginUsername = cipher.login.decUsername || '';
    draft.loginPassword = cipher.login.decPassword || '';
    draft.loginTotp = cipher.login.decTotp || '';
    draft.loginUris = (cipher.login.uris || []).map((x) => ({
      uri: x.decUri || x.uri || '',
      match: x.match ?? null,
      originalUri: x.decUri || x.uri || '',
      extra: Object.fromEntries(
        Object.entries(x as Record<string, unknown>).filter(([key]) => !['uri', 'match', 'decUri'].includes(key))
      ),
    }));
    draft.loginFido2Credentials = Array.isArray(cipher.login.fido2Credentials)
      ? cipher.login.fido2Credentials.map((credential) => ({ ...credential }))
      : [];
    draft.customIcon = cipher.decIcon || '';
    const decLoginType = (cipher.login as Record<string, string>).decLoginType;
    const decThirdPartyPlatform = (cipher.login as Record<string, string>).decThirdPartyPlatform || '';
    draft.thirdPartyPlatform = decThirdPartyPlatform;
    draft.thirdPartyAccount = (cipher.login as Record<string, string>).decThirdPartyAccount || '';
    draft.phoneNumber = (cipher.login as Record<string, string>).decPhoneNumber || '';
    draft.loginType = (decLoginType === 'sms_code' || decLoginType === 'qr_scan' || decLoginType === 'third_party') ? decLoginType : (!!decThirdPartyPlatform ? 'third_party' : 'password');
    if (!draft.loginUris.length) draft.loginUris = [createEmptyLoginUri()];
  }
  if (cipher.card) {
    draft.cardholderName = cipher.card.decCardholderName || '';
    draft.cardNumber = cipher.card.decNumber || '';
    draft.cardBrand = normalizeCardBrand(cipher.card.decBrand || '');
    draft.cardExpMonth = cipher.card.decExpMonth || '';
    draft.cardExpYear = cipher.card.decExpYear || '';
    draft.cardCode = cipher.card.decCode || '';
  }
  if (cipher.identity) {
    draft.identTitle = cipher.identity.decTitle || '';
    draft.identFirstName = cipher.identity.decFirstName || '';
    draft.identMiddleName = cipher.identity.decMiddleName || '';
    draft.identLastName = cipher.identity.decLastName || '';
    draft.identUsername = cipher.identity.decUsername || '';
    draft.identCompany = cipher.identity.decCompany || '';
    draft.identSsn = cipher.identity.decSsn || '';
    draft.identPassportNumber = cipher.identity.decPassportNumber || '';
    draft.identLicenseNumber = cipher.identity.decLicenseNumber || '';
    draft.identEmail = cipher.identity.decEmail || '';
    draft.identPhone = cipher.identity.decPhone || '';
    draft.identAddress1 = cipher.identity.decAddress1 || '';
    draft.identAddress2 = cipher.identity.decAddress2 || '';
    draft.identAddress3 = cipher.identity.decAddress3 || '';
    draft.identCity = cipher.identity.decCity || '';
    draft.identState = cipher.identity.decState || '';
    draft.identPostalCode = cipher.identity.decPostalCode || '';
    draft.identCountry = cipher.identity.decCountry || '';
  }
  if (cipher.sshKey) {
    draft.sshPrivateKey = cipher.sshKey.decPrivateKey || '';
    draft.sshPublicKey = cipher.sshKey.decPublicKey || '';
    draft.sshFingerprint = cipher.sshKey.decFingerprint || '';
  }
  draft.customFields = (cipher.fields || []).map((field) => ({
    type: parseFieldType(field.type),
    label: field.decName || '',
    value: field.decValue || '',
    group: field.decGroup || field.group || undefined,
    linkedId: field.linkedId ?? null,
    attachmentId: field.type === 4 ? (field.attachmentId || null) : null,
  }));

  // Auto-create default group from existing login data
  if (cipher.login) {
    const hasLoginData = cipher.login.decUsername || cipher.login.decPassword || cipher.login.decTotp || cipher.login.decPhoneNumber
      || (cipher.login as Record<string, string>).decThirdPartyPlatform;
    if (hasLoginData) {
      const defaultLogin = createEmptyGroupLogin();
      defaultLogin.username = cipher.login.decUsername || '';
      defaultLogin.password = cipher.login.decPassword || '';
      defaultLogin.totp = cipher.login.decTotp || '';
      defaultLogin.fido2Credentials = Array.isArray(cipher.login.fido2Credentials)
        ? cipher.login.fido2Credentials.map((c) => ({ ...c }))
        : [];
      const decThirdPartyPlatform = (cipher.login as Record<string, string>).decThirdPartyPlatform || '';
      const decThirdPartyAccount = (cipher.login as Record<string, string>).decThirdPartyAccount || '';
      defaultLogin.thirdPartyPlatform = decThirdPartyPlatform;
      defaultLogin.thirdPartyAccount = decThirdPartyAccount;
      defaultLogin.phoneNumber = (cipher.login as Record<string, string>).decPhoneNumber || '';
      if (decThirdPartyPlatform) defaultLogin.loginType = 'third_party';

      const defaultGroup = createEmptyGroup();
      defaultGroup.name = t('txt_default_group');
      defaultGroup.logins = [defaultLogin];
      draft.groups = [defaultGroup];
      draft.groupsTitle = t('txt_groups');
      draft.groupsDescription = '';
    }
  }

  return draft;
}

export function maskSecret(value: string): string {
  if (!value) return '';
  return '*'.repeat(Math.max(8, Math.min(24, value.length)));
}

export function formatTotp(code: string): string {
  if (!code) return code;
  if (code.length === 5) return `${code.slice(0, 2)} ${code.slice(2)}`;
  if (code.length < 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3, 6)}`;
}

export function formatHistoryTime(value: string | null | undefined): string {
  if (!value) return t('txt_dash');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString();
}

export function parseAttachmentSizeBytes(attachment: CipherAttachment): number {
  const raw = attachment?.size;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return 0;
}

export function formatAttachmentSize(attachment: CipherAttachment): string {
  const sizeName = String(attachment?.sizeName || '').trim();
  if (sizeName) return sizeName;
  const bytes = parseAttachmentSizeBytes(attachment);
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function sortTimeValue(cipher: Cipher): number {
  const candidates = [cipher.revisionDate, cipher.creationDate];
  for (const value of candidates) {
    const time = new Date(String(value || '')).getTime();
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

export function creationTimeValue(cipher: Cipher): number {
  const time = new Date(String(cipher.creationDate || '')).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function firstPasskeyCreationTime(cipher: Cipher | null): string | null {
  const credentials = cipher?.login?.fido2Credentials;
  if (!Array.isArray(credentials) || credentials.length === 0) return null;
  for (const credential of credentials) {
    const raw = String(credential?.creationDate || '').trim();
    if (raw) return raw;
  }
  return null;
}

export function VaultListIcon({ cipher }: { cipher: Cipher }) {
  if (Number(cipher.type || 1) === 3) {
    return <CardBrandIcon brand={cipher.card?.decBrand ?? cipher.card?.brand} />;
  }
  return <WebsiteIcon cipher={cipher} fallback={<TypeIcon type={Number(cipher.type || 1)} />} />;
}

export function copyToClipboard(value: string): void {
  if (!value.trim()) return;
  void copyTextToClipboard(value);
}

export function openUri(raw: string): void {
  const value = raw.trim();
  if (!value) return;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  window.open(url, '_blank', 'noopener');
}

export async function resizeImageToIcon(file: File, maxSize: number): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    img.close();
    throw new Error('Canvas context unavailable');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  img.close();

  return canvas.toDataURL('image/png', 0.92);
}
