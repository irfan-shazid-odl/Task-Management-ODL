import type { VaultItem } from '@/lib/api/resources/vault';

// A vault entry is exactly the server shape; reveal/decrypt state is kept
// locally in the list component, not on the entry object.
export type VaultEntry = VaultItem;

// Special sentinel folder ids used by the sidebar / filtering.
export const ALL_FOLDER = '__all__';
export const UNFILED_FOLDER = '__unfiled__';

export const EMPTY_VAULT_FORM = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  folder: '',
};

export type VaultFormValues = typeof EMPTY_VAULT_FORM;
