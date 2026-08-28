'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/components/UserContext';
import { TeamMember, SYSTEM_ADMIN_EMAIL } from '@/lib/types';
import { useTeamMembers, useDeleteUser } from '@/hooks/queries/useTeamMembers';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import AddUserModal from '@/features/users/components/AddUserModal';
import UsersTable from '@/features/users/components/UsersTable';

export default function AdminUsersPage() {
  const { currentUser } = useUser();
  const router = useRouter();

  const { data: teamMembers = [] } = useTeamMembers(!!currentUser && currentUser.role !== 'Member');
  const deleteUser = useDeleteUser();

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Hide the system manager account from the displayed list
  const visibleMembers = teamMembers.filter(m => m.email !== SYSTEM_ADMIN_EMAIL);

  // Security check - Only super-admin, Admin, and Lead should see this content
  useEffect(() => {
    if (currentUser && currentUser.role === 'Member') {
      router.replace('/board');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role === 'Member') {
    return (
      <div className="p-8 flex items-center justify-center h-[80vh] bg-slate-50">
        <div className="text-center space-y-3 max-w-sm animate-pulse">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Redirecting...</h2>
          <p className="text-slate-500 text-sm">Team Directory is restricted for Members.</p>
        </div>
      </div>
    );
  }

  const openDeleteModal = (member: TeamMember) => {
    if (member.id === currentUser.id) {
      toast.error("You cannot remove yourself.");
      return;
    }

    if (member.email === SYSTEM_ADMIN_EMAIL) {
      toast.error("The system administrator account cannot be removed.");
      return;
    }

    // Role guards for deletion
    if (member.role === 'super-admin' && currentUser.role !== 'super-admin') {
      toast.error("Only Super Admins can remove other Super Admins.");
      return;
    }
    if (currentUser.role === 'Lead' && member.role !== 'Member') {
       toast.error("Leads can only remove Members.");
       return;
    }
    if (currentUser.role === 'Admin' && member.role === 'Admin') {
       toast.error("Admins cannot remove other Admins.");
       return;
    }

    setUserToDelete(member);
    setDeleteModalOpen(true);
  };

  const confirmRemoveUser = async () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;

    setIsDeletingUser(true);
    try {
      await deleteUser.mutateAsync(id);
      toast.success(`${name} has been removed from the team.`);
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to delete user: " + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setIsDeletingUser(false);
    setUserToDelete(null);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="w-6 h-6 text-violet-600" />
          Team Directory
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Manage system access, assign roles, and remove inactive team members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Users List */}
        <div className="lg:col-span-2 space-y-4">
          <UsersTable
            members={visibleMembers}
            currentUser={currentUser}
            onRequestDelete={openDeleteModal}
          />
        </div>

        {/* Right Col: Add User Form */}
        <AddUserModal currentUser={currentUser} />
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmRemoveUser}
        isDeleting={isDeletingUser}
        title="Remove Team Member?"
        message={`Are you sure you want to remove "${userToDelete?.name}"? They will lose all access to the workspace immediately. This action cannot be undone.`}
        confirmText="Confirm Removal"
      />
    </div>
  );
}
