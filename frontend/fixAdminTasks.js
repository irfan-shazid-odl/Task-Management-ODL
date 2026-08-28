const fs = require('fs');
const content = fs.readFileSync('src/app/admin/tasks/page.tsx', 'utf8');

const returnBlock = `
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">All Tasks (Admin)</h1>
        <button 
          onClick={() => {
            setCreatingTask(true);
            setEditTaskId(null);
            setShowTaskForm(true);
          }}
          className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <AdminTaskTableSkeleton />
        ) : (
          <AdminTaskTable
            tasks={tasks}
            teamMembers={teamMembers}
            canEditHours={canEditHours}
            totalTasks={totalTasks}
            page={page}
            pageSize={PAGE_SIZE || 25}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
            editingWorkingHoursTaskId={editingWorkingHoursTaskId}
            editingWorkingHoursValue={editingWorkingHoursValue}
            onEditWorkingHoursStart={(id, val) => {
              setEditingWorkingHoursTaskId(id);
              setEditingWorkingHoursValue(String(val));
            }}
            onEditWorkingHoursValueChange={setEditingWorkingHoursValue}
            onSaveWorkingHours={saveWorkingHours}
            onCancelEditWorkingHours={() => {
              setEditingWorkingHoursTaskId(null);
              setEditingWorkingHoursValue('');
            }}
            editingBillingHoursTaskId={editingBillingHoursTaskId}
            editingBillingHoursValue={editingBillingHoursValue}
            onEditBillingHoursStart={(id, val) => {
              setEditingBillingHoursTaskId(id);
              setEditingBillingHoursValue(String(val));
            }}
            onEditBillingHoursValueChange={setEditingBillingHoursValue}
            onSaveBillingHours={saveBillingHours}
            onCancelEditBillingHours={() => {
              setEditingBillingHoursTaskId(null);
              setEditingBillingHoursValue('');
            }}
            editingHoursDate={editingHoursDate}
            onEditingHoursDateChange={setEditingHoursDate}
            taskWorkingHours={taskWorkingHours}
            taskBillingHours={taskBillingHours}
          />
        )}
      </div>

      <AdminTaskForm
        show={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={() => {
          setShowTaskForm(false);
          fetchData();
        }}
        editTaskId={editTaskId}
        creatingTask={creatingTask}
        projects={projects}
        newTaskProjectId={newTaskProjectId}
        onProjectChange={setNewTaskProjectId}
        projectSearch={projectSearch}
        onProjectSearchChange={setProjectSearch}
        projectDropdownOpen={projectDropdownOpen}
        projectDropdownRef={projectDropdownRef}
        triggerRef={triggerRef}
        dropdownRect={dropdownRect}
        onToggleProjectDropdown={() => setProjectDropdownOpen(!projectDropdownOpen)}
        newTaskDescription={newTaskDescription}
        onDescriptionChange={setNewTaskDescription}
        newTaskPriority={newTaskPriority}
        onPriorityChange={setNewTaskPriority}
        newTaskStatus={newTaskStatus}
        onStatusChange={setNewTaskStatus}
        newTaskDeadline={newTaskDeadline}
        onDeadlineChange={setNewTaskDeadline}
        newTaskLogDate={newTaskLogDate}
        onLogDateChange={setNewTaskLogDate}
        newTaskRefDocId={newTaskRefDocId}
        projectDocs={projectDocs}
        loadingDocs={loadingDocs}
        docDropdownOpen={docDropdownOpen}
        docDropdownRef={docDropdownRef}
        docTriggerRef={docTriggerRef}
        docRect={docRect}
        docSearch={docSearch}
        onToggleDocDropdown={() => setDocDropdownOpen(!docDropdownOpen)}
        onSelectDoc={setNewTaskRefDocId}
        onClearDoc={() => setNewTaskRefDocId('')}
        onDocSearchChange={setDocSearch}
        teamMembers={teamMembers}
        newTaskAssignees={newTaskAssignees}
        onToggleAssignee={toggleAssignee}
      />
    </div>
  );
}
`;

fs.writeFileSync('src/app/admin/tasks/page.tsx', content + returnBlock);
console.log('Fixed page.tsx');
