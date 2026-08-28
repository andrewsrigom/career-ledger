import type { ContactRecord, PublicLink } from './model.ts';

export function contactLinks(contact: ContactRecord | undefined, fallback: readonly PublicLink[] = []): PublicLink[] {
  return contact?.links ?? [...fallback];
}

export function hasContact(contact: ContactRecord | undefined, fallback: readonly PublicLink[] = []): boolean {
  return Boolean(contact?.email || contact?.phone || contactLinks(contact, fallback).length);
}

export function formatPhone(phone: string): string {
  return phone.replace(/^\+55(\d{2})(\d{4,5})(\d{4})$/, '+55 ($1) $2-$3');
}

export function emailHref(email: string): string {
  return `mailto:${encodeURIComponent(email).replace('%40', '@')}`;
}
