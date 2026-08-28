import { api } from '@/lib/api';

/**
 * Logs a sensitive or important project activity to the audit trail.
 */
export async function logActivity(
  projectId: string,
  memberId: string | undefined,
  actionType: string,
  description: string
) {
  if (!memberId) return;

  try {
    await api.activity.create({
      project_id: projectId,
      member_id: memberId,
      action_type: actionType,
      description,
    });
  } catch (err) {
    console.error('Activity logging exception:', err);
  }
}
