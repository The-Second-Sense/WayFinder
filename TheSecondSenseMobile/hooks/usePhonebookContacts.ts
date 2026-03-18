import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import { ContactLiteDto } from '../app/(tabs)/apiService';

const MAX_CONTACTS = 2000;
const MAX_NAME_LEN = 100;
const MAX_PHONE_LEN = 20;

/** Best-effort conversion of a raw phone number to E.164. */
function normalizePhone(raw: string): string {
  const clean = raw.replace(/[\s\-()./]/g, '');
  if (clean.startsWith('+')) return clean.slice(0, MAX_PHONE_LEN);
  if (clean.startsWith('00')) return ('+' + clean.slice(2)).slice(0, MAX_PHONE_LEN);
  // Romanian local: 07xx / 02x -> +407xx / +402x
  if (/^0[2-9]/.test(clean)) return ('+40' + clean.slice(1)).slice(0, MAX_PHONE_LEN);
  return clean.slice(0, MAX_PHONE_LEN);
}

/**
 * Requests contacts permission and returns at most MAX_CONTACTS contacts
 * with only { name, phone } fields.
 * Returns [] on web or if permission is denied.
 */
export async function fetchPhonebookContacts(): Promise<ContactLiteDto[]> {
  if (Platform.OS === 'web') return [];

  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return [];

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
  });

  const result: ContactLiteDto[] = [];
  for (const contact of data) {
    if (result.length >= MAX_CONTACTS) break;
    const name = (contact.name ?? '').slice(0, MAX_NAME_LEN).trim();
    if (!name) continue;
    for (const ph of contact.phoneNumbers ?? []) {
      if (result.length >= MAX_CONTACTS) break;
      const raw = (ph.number ?? '').trim();
      if (!raw) continue;
      result.push({ name, phone: normalizePhone(raw) });
    }
  }
  return result;
}
