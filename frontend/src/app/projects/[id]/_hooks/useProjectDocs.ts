'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import { ProjectDocument } from '@/lib/types';

export function useProjectDocs(
  projectId: string,
  _isDemo: boolean,
  currentUser: any,
  documents: ProjectDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<ProjectDocument[]>>
) {
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('Link');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'task' | 'document' | 'credential' } | null>(null);

  const handleDocSubmit = async () => {
    if (!docTitle || !docUrl) return;
    setIsSubmitting(true);
    
    const docData = {
      project_id: projectId,
      title: docTitle,
      url: docUrl,
      doc_type: docType
    };

    if (editingDocId) {
      try {
        const data = await api.documents.update(editingDocId, docData);
        setDocuments(prev => prev.map(d => d.id === editingDocId ? data : d));
        toast.success('Document updated successfully');
        logActivity(projectId, currentUser?.id, 'Update Document', `Updated document "${data.title}"`);
      } catch (error: any) {
        toast.error(`Update failed: ${error.message}`);
      }
    } else {
      try {
        const data = await api.documents.create(docData);
        setDocuments(prev => [data, ...prev]);
        toast.success('Document created successfully');
        logActivity(projectId, currentUser?.id, 'Add Document', `Added new document "${data.title}"`);
      } catch (error: any) {
        toast.error(`Creation failed: ${error.message}`);
      }
    }
    
    setDocTitle(''); setDocUrl(''); setDocType('Link');
    setEditingDocId(null);
    setShowDocModal(false);
    setIsSubmitting(false);
  };

  const handleDeleteDocument = async (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    setIsDeleting(true);
    try {
      await api.documents.remove(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted successfully');
      if (docToDelete) {
        logActivity(projectId, currentUser?.id, 'Delete Document', `Removed document "${docToDelete.title}"`);
      }
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const openNewDocModal = () => {
    setDocTitle(''); setDocUrl(''); setDocType('Link');
    setEditingDocId(null);
    setShowDocModal(true);
  };

  const openEditDocModal = (doc: ProjectDocument) => {
    setEditingDocId(doc.id);
    setDocTitle(doc.title);
    setDocUrl(doc.url);
    setDocType(doc.doc_type);
    setShowDocModal(true);
  };

  return {
    showDocModal, setShowDocModal,
    editingDocId, setEditingDocId,
    docTitle, setDocTitle,
    docUrl, setDocUrl,
    docType, setDocType,
    isSubmitting, isDeleting,
    deleteConfirm, setDeleteConfirm,
    handleDocSubmit, handleDeleteDocument,
    openNewDocModal, openEditDocModal
  };
}
