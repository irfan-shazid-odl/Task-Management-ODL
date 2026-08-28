'use client';

import React from 'react';
import KanbanColumn from '@/components/KanbanColumn';
import { TASK_STATUSES } from '@/lib/types';

import BoardHeader from './_components/BoardHeader';
import BoardTaskListTable from './_components/BoardTaskListTable';
import BoardKanbanSkeleton from './_components/BoardKanbanSkeleton';
import NewTaskModal from './_components/NewTaskModal';
import ActivityReportModal from './_components/ActivityReportModal';
import DailyReportModal from './_components/DailyReportModal';
import { useBoardState } from './_hooks/useBoardState';

export default function BoardPage() {
  const board = useBoardState();

  return (
    <div className="flex flex-col h-screen max-w-[1600px] mx-auto overflow-hidden">
      <div className="shrink-0 px-8 pt-8">
        <BoardHeader
          viewLabel={board.viewLabel()}
          viewMode={board.viewMode}
          canViewAllMembers={board.canViewAllMembers}
          refreshing={board.refreshing}
          boardFilterMode={board.boardFilterMode}
          onSetFilterMode={(mode) => { board.setBoardFilterMode(mode); board.setBoardCalendarOpen(false); }}
          boardDate={board.boardDate}
          boardCalendarOpen={board.boardCalendarOpen}
          boardCalendarViewDate={board.boardCalendarViewDate}
          boardCalendarRef={board.boardCalendarRef}
          onToggleCalendar={() => {
            board.setBoardCalendarOpen(!board.boardCalendarOpen);
            board.setBoardProjectDropdownOpen(false);
            board.setBoardCalendarViewDate(new Date(board.boardDate));
          }}
          onSelectDay={(day) => {
            const selectedDate = new Date(board.boardCalendarViewDate.getFullYear(), board.boardCalendarViewDate.getMonth(), day);
            board.setBoardDate(selectedDate.toLocaleDateString('en-CA'));
            board.setBoardCalendarOpen(false);
          }}
          onChangeMonth={(offset) => {
            board.setBoardCalendarViewDate(new Date(board.boardCalendarViewDate.getFullYear(), board.boardCalendarViewDate.getMonth() + offset, 1));
          }}
          onGoToToday={() => {
            board.setBoardDate(new Date().toLocaleDateString('en-CA'));
            board.setBoardCalendarOpen(false);
          }}
          boardMonth={board.boardMonth}
          onPrevMonth={() => {
            const [y, m] = board.boardMonth.split('-').map(Number);
            const prev = new Date(y, m - 2, 1);
            board.setBoardMonth(prev.toLocaleDateString('en-CA').slice(0, 7));
          }}
          onNextMonth={() => {
            const [y, m] = board.boardMonth.split('-').map(Number);
            const next = new Date(y, m, 1);
            board.setBoardMonth(next.toLocaleDateString('en-CA').slice(0, 7));
          }}
          onGoToCurrentMonth={() => board.setBoardMonth(new Date().toLocaleDateString('en-CA').slice(0, 7))}
          boardProjectId={board.boardProjectId}
          boardProjectDropdownOpen={board.boardProjectDropdownOpen}
          boardProjectSearch={board.boardProjectSearch}
          availableProjects={board.availableProjects}
          boardProjectDropdownRef={board.boardProjectDropdownRef}
          onToggleProjectDropdown={() => {
            board.setBoardProjectDropdownOpen(!board.boardProjectDropdownOpen);
            board.setBoardCalendarOpen(false);
          }}
          onSelectBoardProject={(id) => {
            board.setBoardProjectId(id);
            board.setBoardProjectDropdownOpen(false);
            board.setBoardProjectSearch('');
          }}
          onBoardProjectSearchChange={board.setBoardProjectSearch}
          memberDropdownOpen={board.memberDropdownOpen}
          memberDropdownRef={board.memberDropdownRef}
          teamMembers={board.teamMembers || []}
          onToggleMemberDropdown={() => {
            board.setMemberDropdownOpen(!board.memberDropdownOpen);
            board.setBoardCalendarOpen(false);
            board.setBoardProjectDropdownOpen(false);
          }}
          onSelectView={(mode) => { board.setViewMode(mode); board.setMemberDropdownOpen(false); }}
          onGeneratePDF={board.generatePDF}
          onShowActivityModal={() => board.setShowActivityModal(true)}
          onOpenNewTask={board.openModal}
          onRefresh={board.handleRefresh}
        />

        {board.viewMode !== 'all' && (
          <BoardTaskListTable
            loading={board.loading}
            tableTasks={board.tableTasks}
            todaysActivity={board.todaysActivity}
            todaysTotalHours={board.todaysTotalHours}
            todaysTotalBillingHours={board.todaysTotalBillingHours}
            todaysTotalProjects={board.todaysTotalProjects}
            showTasksTable={board.showTasksTable}
            boardDate={board.boardDate}
            viewMode={board.viewMode}
            onToggleTable={board.toggleTasksTable}
            onOpenReportModal={board.openReportModal}
            onUpdate={board.fetchTasks}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {board.loading ? (
          <BoardKanbanSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={board.tasksByStatus(status)}
                availableProjects={board.availableProjects}
                onStatusChange={board.stableFetchTasks}
                onHoursLogged={board.stableFetchTasks}
                onDropTask={board.stableHandleDropTask}
                boardDate={board.boardDate}
              />
            ))}
          </div>
        )}
      </div>

      <NewTaskModal
        show={board.showNewTaskModal}
        onClose={() => board.setShowNewTaskModal(false)}
        onSubmit={board.handleCreateTask}
        isSubmitting={board.isSubmitting}
        isMember={board.isMember}
        taskDescription={board.taskDescription}
        onDescriptionChange={board.setTaskDescription}
        taskStatus={board.taskStatus}
        onStatusChange={board.setTaskStatus}
        taskPriority={board.taskPriority}
        onPriorityChange={board.setTaskPriority}
        taskDeadline={board.taskDeadline}
        onDeadlineChange={board.setTaskDeadline}
        taskLogDate={board.taskLogDate}
        onLogDateChange={board.setTaskLogDate}
        taskEstimatedTime={board.taskEstimatedTime}
        onEstimatedTimeChange={board.setTaskEstimatedTime}
        taskCategory={board.taskCategory}
        onCategoryChange={board.setTaskCategory}
        taskProjectId={board.taskProjectId}
        taskProjectName={board.taskProjectName}
        availableProjects={board.availableProjects}
        projectSearch={board.projectSearch}
        onProjectSearchChange={board.setProjectSearch}
        projectDropdownOpen={board.projectDropdownOpen}
        projectDropdownRef={board.projectDropdownRef}
        triggerRef={board.triggerRef}
        dropdownRect={board.dropdownRect}
        onToggleProjectDropdown={() => {
          if (!board.projectDropdownOpen && board.triggerRef.current) {
            const rect = board.triggerRef.current.getBoundingClientRect();
            const dropW = rect.width;
            const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
            board.setDropdownRect({ top: rect.bottom + 4, left: clampedLeft, width: dropW });
          }
          board.setProjectDropdownOpen(o => !o);
        }}
        onSelectProject={(id, name) => { board.setTaskProjectId(id); board.setTaskProjectName(name); board.setProjectDropdownOpen(false); board.setProjectSearch(''); }}
        onClearProject={() => { board.setTaskProjectId(''); board.setTaskProjectName(''); board.setProjectDropdownOpen(false); }}
        projectDocs={board.projectDocs}
        loadingDocs={board.loadingDocs}
        refDocId={board.refDocId}
        onRefDocChange={board.setRefDocId}
        teamMembers={board.teamMembers || []}
        taskAssignees={board.taskAssignees}
        onToggleAssignee={board.toggleAssignee}
      />

      <ActivityReportModal
        show={board.showActivityModal}
        onClose={() => board.setShowActivityModal(false)}
        onCopyTable={board.handleCopyTable}
        tasks={board.tasks}
        todaysActivity={board.todaysActivity}
        getDisplayStatus={board.getDisplayStatus}
      />

      <DailyReportModal
        show={board.showReportModal}
        onClose={() => board.setShowReportModal(false)}
        onCopy={board.handleCopyDailyReport}
        reportText={board.showReportModal ? board.buildDailyReport() : ''}
        taskCount={board.tableTasks.length}
      />
    </div>
  );
}
