import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Camera, Globe } from 'lucide-preact';
import type { Cipher } from '@/lib/types';
import {
  beginWebsiteIconLoad,
  getWebsiteIconImageUrl,
  getWebsiteIconStatus,
  subscribeWebsiteIconStatus,
} from '@/lib/website-icon-cache';
import { demoBrandIconUrl } from '@/lib/demo-brand-icons';
import { getCurrentNetworkStatus, subscribeNetworkStatus } from '@/lib/network-status';
import { firstCipherUri, hostFromUri, websiteIconUrl } from '@/lib/website-utils';

const ICON_LOAD_ROOT_MARGIN = '180px 0px';
const SHOULD_LOAD_DEMO_BRAND_ICONS = __NODEWARDEN_DEMO__;

interface WebsiteIconProps {
  cipher: Cipher;
  fallback?: ComponentChildren;
  customIcon?: string;
  editable?: boolean;
  onUpload?: () => void;
  onClick?: () => void;
}

export default function WebsiteIcon(props: WebsiteIconProps) {
  const firstUri = useMemo(() => firstCipherUri(props.cipher), [props.cipher]);
  const host = useMemo(() => hostFromUri(firstUri), [firstUri]);
  const src = host ? websiteIconUrl(host, firstUri) : '';
  const nodeRef = useRef<HTMLSpanElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(() => (host ? getWebsiteIconStatus(host) === 'loaded' : true));
  const [status, setStatus] = useState(() => (host ? getWebsiteIconStatus(host) : 'idle'));
  const [imageUrl, setImageUrl] = useState(() => (host ? getWebsiteIconImageUrl(host) : ''));
  const [networkStatus, setNetworkStatus] = useState(getCurrentNetworkStatus);
  const demoIconUrl = SHOULD_LOAD_DEMO_BRAND_ICONS && host ? demoBrandIconUrl(host) : '';

  const hasCustomIcon = !!props.customIcon;

  useEffect(() => subscribeNetworkStatus(setNetworkStatus), []);

  useEffect(() => {
    if (!host) {
      setShouldLoad(true);
      setStatus('idle');
      setImageUrl('');
      return;
    }
    const nextStatus = getWebsiteIconStatus(host);
    setShouldLoad(nextStatus === 'loaded');
    setStatus(nextStatus);
    setImageUrl(getWebsiteIconImageUrl(host));
    return subscribeWebsiteIconStatus(host, (next) => {
      setStatus(next);
      setImageUrl(getWebsiteIconImageUrl(host));
    });
  }, [host]);

  useEffect(() => {
    if (!host || shouldLoad || status === 'loaded' || status === 'error') return;
    const node = nodeRef.current;
    if (!node) return;
    if (typeof IntersectionObserver !== 'function') {
      setShouldLoad(true);
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) continue;
          if (!cancelled) setShouldLoad(true);
          observer.disconnect();
          break;
        }
      },
      { rootMargin: ICON_LOAD_ROOT_MARGIN }
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [host, shouldLoad, status]);

  useEffect(() => {
    if (SHOULD_LOAD_DEMO_BRAND_ICONS) return;
    if (demoIconUrl) return;
    if (networkStatus !== 'online') return;
    if (!host || !src || !shouldLoad || status !== 'idle') return;
    beginWebsiteIconLoad(host, src);
  }, [demoIconUrl, host, networkStatus, src, shouldLoad, status]);

  const renderImage = (imgSrc: string, className: string) => (
    <img className={className} src={imgSrc} alt="" loading="lazy" decoding="async" />
  );

  const handleClick = () => {
    if (props.editable && props.onUpload) {
      props.onUpload();
    } else if (props.onClick) {
      props.onClick();
    }
  };

  // Custom icon takes precedence
  if (hasCustomIcon) {
    return (
      <span
        className={`list-icon-stack ${props.editable ? 'icon-editable' : ''}`}
        ref={nodeRef}
        onClick={handleClick}
        role={props.editable ? 'button' : undefined}
        tabIndex={props.editable ? 0 : undefined}
        onKeyDown={props.editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        {renderImage(props.customIcon!, 'list-icon loaded')}
        {props.editable && <span className="icon-edit-badge"><Camera size={12} /></span>}
      </span>
    );
  }

  if (demoIconUrl) {
    return (
      <span
        className={`list-icon-stack ${props.editable ? 'icon-editable' : ''}`}
        ref={nodeRef}
        onClick={handleClick}
        role={props.editable ? 'button' : undefined}
        tabIndex={props.editable ? 0 : undefined}
        onKeyDown={props.editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        {renderImage(demoIconUrl, 'list-icon loaded')}
        {props.editable && <span className="icon-edit-badge"><Camera size={12} /></span>}
      </span>
    );
  }

  if (!host || status === 'error') {
    return (
      <span
        className={`list-icon-stack ${props.editable ? 'icon-editable' : ''}`}
        ref={nodeRef}
        onClick={handleClick}
        role={props.editable ? 'button' : undefined}
        tabIndex={props.editable ? 0 : undefined}
        onKeyDown={props.editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        <span className="list-icon-fallback">{props.fallback ?? <Globe size={18} />}</span>
        {props.editable && <span className="icon-edit-badge"><Camera size={12} /></span>}
      </span>
    );
  }

  const shouldRenderIconImage = !!imageUrl && status === 'loaded';

  return (
    <span
      className={`list-icon-stack ${props.editable ? 'icon-editable' : ''}`}
      ref={nodeRef}
      onClick={handleClick}
      role={props.editable ? 'button' : undefined}
      tabIndex={props.editable ? 0 : undefined}
      onKeyDown={props.editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {status !== 'loaded' && <span className="list-icon-fallback">{props.fallback ?? <Globe size={18} />}</span>}
      {shouldRenderIconImage && (
        <img
          className={`list-icon${status === 'loaded' ? ' loaded' : ''}`}
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      {props.editable && <span className="icon-edit-badge"><Camera size={12} /></span>}
    </span>
  );
}
