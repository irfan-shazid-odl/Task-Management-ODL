import { Shield, Star, User } from 'lucide-react';

// Role → badge icon, shared by the member card and the detail modal.
export function getRoleIcon(role?: string) {
  if (role === 'super-admin' || role === 'Admin') return Shield;
  if (role === 'Lead') return Star;
  return User;
}
