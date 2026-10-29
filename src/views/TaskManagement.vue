<template>
  <div class="task-management-page">
    <!-- Floating Toast Notification (Replaces all browser alerts) -->
    <transition name="toast-slide">
      <div v-if="toast.show" class="toast-notification" :class="toast.type">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" width="18" height="18"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>
        </div>
        <div class="toast-body">
          <span class="toast-text">{{ toast.message }}</span>
        </div>
        <button class="toast-close" type="button" @click="toast.show = false">&times;</button>
      </div>
    </transition>

    <!-- Page Header (Kokonut / Vengence UI) -->
    <CrmPageHeader
      eyebrow="Work Management"
      title="Task Management"
      description="Internal team task assignment, tracking, deadlines, collaboration &amp; SLA monitoring."
    >
      <template #actions>
        <button class="btn-tactile btn-tactile-secondary" type="button" @click="refreshData" :disabled="loadingTasks">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Refresh
        </button>
        <button class="btn-tactile btn-tactile-primary" type="button" @click="openCreateModal">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Task
        </button>
      </template>
    </CrmPageHeader>

    <!-- Main Navigation Tabs (Kokonut UI Sliding Bar) -->
    <nav class="tasks-tabs-nav bento-card">
      <button :class="{ active: currentTab === 'dashboard' }" @click="switchTab('dashboard')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z"/></svg>
        <span>Dashboard</span>
      </button>
      <button :class="{ active: currentTab === 'all' }" @click="switchTab('all')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        <span>All Tasks</span>
        <span v-if="metrics.total_open" class="tab-badge">{{ metrics.total_open }}</span>
      </button>
      <button :class="{ active: currentTab === 'my' }" @click="switchTab('my')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span>My Tasks</span>
        <span v-if="metrics.my_open" class="tab-badge primary">{{ metrics.my_open }}</span>
      </button>
      <button :class="{ active: currentTab === 'assigned_by_me' }" @click="switchTab('assigned_by_me')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <span>Assigned by Me</span>
      </button>
      <button :class="{ active: currentTab === 'reports' }" @click="switchTab('reports')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 3h14v18H5V3Zm3 14h2v-6H8v6Zm3 0h2V7h-2v10Zm3 0h2v-4h-2v4Z"/></svg>
        <span>Task Reports</span>
      </button>
      <button :class="{ active: currentTab === 'settings' }" @click="switchTab('settings')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m19.43 12.98.04-.98-.04-.98 2.11-1.65-2-3.46-2.49 1a7.1 7.1 0 0 0-1.69-.98L15 3h-4l-.36 2.93c-.6.24-1.17.56-1.69.98l-2.49-1-2 3.46 2.11 1.65-.04.98.04.98-2.11 1.65 2 3.46 2.49-1c.52.42 1.09.74 1.69.98L11 21h4l.36-2.93c.6-.24 1.17-.56 1.69-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>
        <span>Task Settings</span>
      </button>
    </nav>

    <!-- TAB 1: DASHBOARD -->
    <section v-if="currentTab === 'dashboard'" class="tab-content dashboard-content">
      <div class="metrics-grid">
        <div class="metric-card" @click="switchTab('all')">
          <div class="metric-card-top">
            <span class="metric-label">Total Open Tasks</span>
            <div class="metric-icon-box blue">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value">{{ metrics.total_open }}</strong>
          <span class="metric-subtitle">Active across team</span>
        </div>

        <div class="metric-card" @click="switchTab('my')">
          <div class="metric-card-top">
            <span class="metric-label">My Open Tasks</span>
            <div class="metric-icon-box indigo">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value text-primary">{{ metrics.my_open }}</strong>
          <span class="metric-subtitle">Assigned directly to you</span>
        </div>

        <div class="metric-card">
          <div class="metric-card-top">
            <span class="metric-label">Due Today</span>
            <div class="metric-icon-box amber">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value text-amber">{{ metrics.due_today }}</strong>
          <span class="metric-subtitle">Immediate attention</span>
        </div>

        <div class="metric-card" @click="filterOverdueTasks">
          <div class="metric-card-top">
            <span class="metric-label">Overdue Tasks</span>
            <div class="metric-icon-box red">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value text-red">{{ metrics.overdue }}</strong>
          <span class="metric-subtitle">Past deadline</span>
        </div>

        <div class="metric-card">
          <div class="metric-card-top">
            <span class="metric-label">Critical Priority</span>
            <div class="metric-icon-box rose">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value text-rose">{{ metrics.critical }}</strong>
          <span class="metric-subtitle">Urgent severity</span>
        </div>

        <div class="metric-card">
          <div class="metric-card-top">
            <span class="metric-label">Blocked Tasks</span>
            <div class="metric-icon-box purple">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1c1.06 1.35 1.69 3.05 1.69 4.9 0 4.42-3.58 8-8 8z" fill="currentColor"/></svg>
            </div>
          </div>
          <strong class="metric-value text-purple">{{ metrics.blocked }}</strong>
          <span class="metric-subtitle">Waiting on blockers</span>
        </div>
      </div>

      <div class="dashboard-widgets-grid">
        <!-- Status Breakdown Widget -->
        <div class="widget-card bento-card">
          <div class="widget-header">
            <h3>Tasks by Status</h3>
            <span class="muted small">{{ Object.values(dashboardData.by_status).reduce((a, b) => a + b, 0) }} total</span>
          </div>
          <div class="breakdown-list">
            <div v-for="(count, st) in dashboardData.by_status" :key="st" class="breakdown-item" @click="filterByStatus(st)">
              <span class="status-badge" :class="statusClass(st)">{{ st }}</span>
              <div class="bar-wrap">
                <div class="bar-fill" :class="statusClass(st)" :style="{ width: percentOfTotal(count) + '%' }"></div>
              </div>
              <strong class="count-badge">{{ count }}</strong>
            </div>
          </div>
        </div>

        <!-- Priority Breakdown Widget -->
        <div class="widget-card bento-card">
          <div class="widget-header">
            <h3>Open Tasks by Priority</h3>
          </div>
          <div class="priority-list">
            <div v-for="p in ['Critical', 'High', 'Medium', 'Low']" :key="p" class="priority-item" @click="filterByPriority(p)">
              <div class="priority-item-left">
                <span class="priority-badge" :class="priorityClass(p)">{{ p }}</span>
                <span class="muted small">{{ getPriorityDesc(p) }}</span>
              </div>
              <strong class="count-badge">{{ dashboardData.by_priority[p] || 0 }}</strong>
            </div>
          </div>
        </div>

        <!-- Top Workload Widget -->
        <div class="widget-card bento-card">
          <div class="widget-header">
            <h3>Team Capacity &amp; Workload</h3>
          </div>
          <div class="workload-list">
            <div v-for="w in dashboardData.by_assignee" :key="w.name" class="workload-item">
              <div class="workload-user">
                <div class="avatar-sm">{{ getInitials(w.name) }}</div>
                <span class="assignee-name">{{ w.name }}</span>
              </div>
              <span class="pill-count">{{ w.count }} tasks</span>
            </div>
            <div v-if="!dashboardData.by_assignee.length" class="empty-state small">No active team workload logged yet.</div>
          </div>
        </div>


      </div>
    </section>

    <!-- TAB 2, 3, 4: TASK LISTS (ALL, MY, ASSIGNED BY ME) -->
    <section v-if="['all', 'my', 'assigned_by_me'].includes(currentTab)" class="tab-content list-content">
      <!-- Filter Bar (Scrolltide & Kokonut UI) -->
      <div class="filters-bar bento-card">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" class="search-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
          <input v-model="searchQuery" placeholder="Search tasks by #, title, assignee, client..." @input="debouncedFetch" />
        </div>
        <select v-model="filterStatus" @change="fetchTasks" class="filter-select">
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
          <option value="On Hold">On Hold</option>
          <option value="In Review">In Review</option>
          <option value="Changes Requested">Changes Requested</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select v-model="filterPriority" @change="fetchTasks" class="filter-select">
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select v-model="filterType" @change="fetchTasks" class="filter-select">
          <option value="">All Task Types</option>
          <option v-for="t in taskTypes" :key="t.name" :value="t.name">{{ t.name }}</option>
        </select>
        <button
          type="button"
          class="btn-filter-pill"
          :class="{ active: filterOverdue }"
          @click="toggleOverdueFilter"
        >
          <span class="pill-dot" :class="{ red: filterOverdue }"></span>
          Overdue
        </button>

        <!-- View Mode Switcher (List vs Kanban Board) -->
        <div class="view-mode-toggle">
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'list' }"
            title="List Table View"
            @click="viewMode = 'list'"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            <span>List</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'kanban' }"
            title="Kanban Board View"
            @click="viewMode = 'kanban'"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M4 4h4v16H4V4zm6 0h4v10h-4V4zm6 0h4v6h-4V4z"/>
            </svg>
            <span>Board</span>
          </button>
        </div>
      </div>

      <!-- Task View Area -->
      <div v-if="loadingTasks" class="record-card empty-state bento-card">
        <ModernSpinner size="md" :show-core="true" label="Loading tasks..." />
      </div>
      <div v-else-if="tasks.length === 0" class="record-card empty-state bento-card">
        <svg viewBox="0 0 24 24" width="44" height="44" style="color: #94a3b8; margin-bottom: 8px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg>
        <p>No tasks found matching your filter criteria.</p>
        <button class="btn-tactile btn-tactile-secondary" style="margin-top: 12px;" @click="openCreateModal">+ Create New Task</button>
      </div>

      <!-- KANBAN BOARD VIEW -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-board">
        <div v-for="col in kanbanColumns" :key="col.id" class="kanban-column bento-card">
          <div class="kanban-col-header" :class="col.tone">
            <div class="kanban-col-title">
              <span class="kanban-status-dot"></span>
              <strong>{{ col.label }}</strong>
            </div>
            <span class="kanban-col-count">{{ col.items.length }}</span>
          </div>

          <div class="kanban-cards-wrap">
            <div
              v-for="task in col.items"
              :key="task.id"
              class="kanban-card bento-card"
              @click="openDetail(task)"
            >
              <div class="kanban-card-top">
                <span class="task-number">{{ task.task_number }}</span>
                <span class="priority-badge" :class="priorityClass(task.priority)">{{ task.priority }}</span>
              </div>

              <strong class="kanban-card-title">{{ task.title }}</strong>

              <div v-if="task.customer_name || task.project_name" class="tags-row">
                <span v-if="task.customer_name" class="context-tag client">🏢 {{ task.customer_name }}</span>
                <span v-if="task.project_name" class="context-tag project">📁 {{ task.project_name }}</span>
              </div>

              <div v-if="task.checklist_total > 0" class="kanban-progress-wrap">
                <div class="progress-bar-sm">
                  <div class="progress-fill" :style="{ width: task.progress_pct + '%' }"></div>
                </div>
                <span class="kanban-progress-text">{{ task.checklist_completed }}/{{ task.checklist_total }} subtasks</span>
              </div>

              <div class="kanban-card-footer">
                <div class="assignee-cell-mini">
                  <div class="avatar-sm mini">{{ getInitials(task.assignee_name) }}</div>
                  <span class="assignee-name-sm">{{ task.assignee_name }}</span>
                </div>
                <div class="due-cell-mini" :class="{ 'overdue-text': task.is_overdue }">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  <span>{{ task.due_date }}</span>
                </div>
              </div>
            </div>

            <div v-if="col.items.length === 0" class="kanban-empty-slot">
              <span>No tasks</span>
            </div>
          </div>
        </div>
      </div>

      <!-- LIST TABLE VIEW -->
      <div v-else class="table-container bento-card">
        <table class="record-table">
          <thead>
            <tr>
              <th style="width: 120px;">Task #</th>
              <th>Title &amp; Context</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Subtasks</th>
              <th>Status</th>
              <th class="right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id" class="clickable-row" @click="openDetail(task)">
              <td>
                <strong class="task-number">{{ task.task_number }}</strong>
                <span v-if="task.task_type" class="type-pill-sm">{{ task.task_type }}</span>
              </td>
              <td>
                <div class="task-title-cell">
                  <strong class="task-title-text">{{ task.title }}</strong>
                  <div class="tags-row">
                    <span v-if="task.customer_name" class="context-tag client">🏢 {{ task.customer_name }}</span>
                    <span v-if="task.project_name" class="context-tag project">📁 {{ task.project_name }}</span>
                    <span v-if="task.environment && task.environment !== 'None'" class="context-tag env">⚙️ {{ task.environment }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="assignee-cell">
                  <div class="avatar-sm">{{ getInitials(task.assignee_name) }}</div>
                  <div>
                    <strong>{{ task.assignee_name }}</strong>
                    <span v-if="task.assignee_notification_email" class="notif-mail-indicator" :title="'Notifications sent to: ' + task.assignee_notification_email">
                      ✉️ {{ task.assignee_notification_email }}
                    </span>
                    <span v-else-if="task.assignee_email" class="muted block small">{{ task.assignee_email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="priority-badge" :class="priorityClass(task.priority)">{{ task.priority }}</span>
              </td>
              <td>
                <span :class="{ 'overdue-text': task.is_overdue }">
                  {{ task.due_date }}
                  <span v-if="task.due_time" class="muted small block">{{ task.due_time }}</span>
                </span>
                <span v-if="task.is_overdue" class="badge-overdue">OVERDUE</span>
              </td>
              <td>
                <div v-if="task.checklist_total > 0" class="subtask-progress">
                  <div class="progress-bar-sm">
                    <div class="progress-fill" :style="{ width: task.progress_pct + '%' }"></div>
                  </div>
                  <small>{{ task.checklist_completed }}/{{ task.checklist_total }} ({{ task.progress_pct }}%)</small>
                </div>
                <span v-else class="muted small">—</span>
              </td>
              <td>
                <span class="status-badge" :class="statusClass(task.status)">{{ task.status }}</span>
              </td>
              <td class="right" @click.stop>
                <button class="action-btn" title="View details" @click="openDetail(task)">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination-footer">
          <span class="muted small">Showing {{ tasks.length }} of {{ pagination.total }} tasks</span>
          <div class="page-controls">
            <button class="button secondary small" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">Previous</button>
            <span class="small font-bold">Page {{ pagination.page }} of {{ pagination.pages || 1 }}</span>
            <button class="button secondary small" :disabled="pagination.page >= pagination.pages" @click="changePage(pagination.page + 1)">Next</button>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 5: TASK REPORTS -->
    <section v-if="currentTab === 'reports'" class="tab-content reports-content">
      <div class="reports-grid">
        <div class="report-card">
          <div class="widget-header">
            <h3>Team Workload &amp; Hours Summary</h3>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Assignee</th>
                <th class="right">Open Tasks</th>
                <th class="right">Est. Hours</th>
                <th class="right">Logged Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in reportsData.team_workload" :key="w.name">
                <td><strong>{{ w.name }}</strong></td>
                <td class="right">{{ w.tasks }}</td>
                <td class="right">{{ w.est_hours }}h</td>
                <td class="right" style="color: #2563eb; font-weight: 700;">{{ w.act_hours }}h</td>
              </tr>
              <tr v-if="!reportsData.team_workload.length"><td colspan="4" class="empty-state small">No workload logged yet.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="report-card">
          <div class="widget-header">
            <h3>Tasks by Project</h3>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th class="right">Total Tasks</th>
                <th class="right">Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in reportsData.by_project" :key="p.project">
                <td><strong>{{ p.project }}</strong></td>
                <td class="right">{{ p.count }}</td>
                <td class="right" style="color: #10b981; font-weight: 700;">{{ p.completed }}</td>
              </tr>
              <tr v-if="!reportsData.by_project.length"><td colspan="3" class="empty-state small">No project-linked tasks found.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="report-card full-width">
          <div class="widget-header">
            <h3>Active Overdue Task Register</h3>
          </div>
          <table class="record-table">
            <thead>
              <tr>
                <th>Task #</th>
                <th>Title</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in reportsData.overdue_tasks" :key="t.id" class="clickable-row" @click="openDetail(t)">
                <td><strong class="task-number">{{ t.task_number }}</strong></td>
                <td>{{ t.title }}</td>
                <td>{{ t.assignee_name }}</td>
                <td><span class="priority-badge" :class="priorityClass(t.priority)">{{ t.priority }}</span></td>
                <td class="overdue-text">{{ t.due_date }}</td>
                <td><span class="status-badge" :class="statusClass(t.status)">{{ t.status }}</span></td>
              </tr>
              <tr v-if="!reportsData.overdue_tasks.length"><td colspan="6" class="empty-state small">🎉 No overdue tasks! All work is within deadlines.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 6: TASK SETTINGS (NO ALERT CLUTTER, BEAUTIFUL CLEAN FORMS) -->
    <section v-if="currentTab === 'settings'" class="tab-content settings-content">
      <div class="settings-grid">
        <!-- SLA & Priority Policy -->
        <div class="settings-card full-width">
          <div class="settings-header">
            <div>
              <h3>SLA Target Policies</h3>
              <p class="muted small">Define response and resolution expectations per priority level.</p>
            </div>
            <span class="settings-badge">Service Level Agreements</span>
          </div>

          <div class="sla-table-wrap mt-16">
            <table class="record-table">
              <thead>
                <tr>
                  <th style="width: 180px;">Priority Level</th>
                  <th>Target Response Expectation</th>
                  <th>Target Resolution Expectation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sla in settingsForm.sla_policies" :key="sla.priority">
                  <td>
                    <span class="priority-badge" :class="priorityClass(sla.priority)">{{ sla.priority }}</span>
                  </td>
                  <td>
                    <div class="input-with-unit">
                      <input v-model.number="sla.response_hours" type="number" min="1" class="unit-input" />
                      <span class="unit-tag">hours</span>
                    </div>
                  </td>
                  <td>
                    <div class="input-with-unit">
                      <input v-model.number="sla.resolution_hours" type="number" min="1" class="unit-input" />
                      <span class="unit-tag">hours</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SMTP Email Settings -->
        <div class="settings-card full-width">
          <div class="settings-header">
            <div>
              <h3>Task Email Notification SMTP Server</h3>
              <p class="muted small">Configure SMTP to deliver automated assignment notifications to each employee's Notification Email.</p>
            </div>
            <span class="settings-badge">Notification Server</span>
          </div>

          <div class="smtp-form-grid mt-16">
            <div class="field-item">
              <label>SMTP Host</label>
              <input v-model="settingsForm.smtp_settings.host" placeholder="smtp.gmail.com or mail.swarajyaconsultancy.in" />
            </div>
            <div class="field-item">
              <label>SMTP Port</label>
              <input v-model.number="settingsForm.smtp_settings.port" type="number" placeholder="587" />
            </div>
            <div class="field-item">
              <label>Username / Email</label>
              <input v-model="settingsForm.smtp_settings.username" placeholder="user@swarajyaconsultancy.in" />
            </div>
            <div class="field-item">
              <label>Password</label>
              <input v-model="settingsForm.smtp_settings.password" type="password" placeholder="••••••••" />
            </div>
            <div class="field-item">
              <label>Sender From Email</label>
              <input v-model="settingsForm.smtp_settings.from_email" placeholder="notifications@swarajyaconsultancy.in" />
            </div>
            <div class="field-item">
              <label>Sender From Name</label>
              <input v-model="settingsForm.smtp_settings.from_name" placeholder="Swarajya CRM" />
            </div>

            <div class="field-item full-width mt-8">
              <div class="toggles-row">
                <label class="toggle-control">
                  <input type="checkbox" v-model="settingsForm.smtp_settings.use_tls" />
                  <span>Use TLS Encryption</span>
                </label>
                <label class="toggle-control">
                  <input type="checkbox" v-model="settingsForm.smtp_settings.is_enabled" />
                  <span>Enable Automated Email Dispatch</span>
                </label>
              </div>
              <p class="hint-text mt-8">
                ℹ️ When enabled, whenever a task is assigned or status changes, notification emails are routed to the employee's configured <strong>Notification Email</strong>.
              </p>
            </div>
          </div>
        </div>

        <div class="full-width text-right">
          <button class="button primary" :disabled="savingSettings" @click="saveSettings">
            {{ savingSettings ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>
    </section>

    <!-- CREATE TASK MODAL (SMOOTH SCROLLING) -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-dialog modal-scroll-container">
        <header class="modal-header">
          <div>
            <h3>Create New Task</h3>
            <p class="muted small">Assign internal work, set deadlines, and track completion.</p>
          </div>
          <button class="close-btn" @click="showCreateModal = false">&times;</button>
        </header>

        <form @submit.prevent="submitCreateTask" class="modal-body-scrollable">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Task Title *</label>
              <input v-model="createForm.title" required placeholder="e.g. Deploy client web portal to staging" />
            </div>

            <div class="form-group">
              <label>Task Type *</label>
              <select v-model="createForm.task_type" required>
                <option v-for="t in taskTypes" :key="t.name" :value="t.name">{{ t.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Priority *</label>
              <select v-model="createForm.priority" required>
                <option value="Critical">Critical (Immediate)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div class="form-group">
              <label>Assignee *</label>
              <select v-model="createForm.assignee_id" required>
                <option value="" disabled>Select Team Member...</option>
                <option v-for="u in activeUsers" :key="u.id" :value="u.id">
                  {{ u.full_name }} {{ u.notification_email ? `(Alerts: ${u.notification_email})` : `(${u.email})` }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Category</label>
              <select v-model="createForm.category">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Due Date *</label>
              <input v-model="createForm.due_date" type="date" required />
            </div>

            <div class="form-group">
              <label>Due Time</label>
              <input v-model="createForm.due_time" type="time" />
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input v-model="createForm.start_date" type="date" />
            </div>

            <div class="form-group">
              <label>Estimated Effort (Hours)</label>
              <input v-model.number="createForm.estimated_hours" type="number" step="0.5" min="0" placeholder="e.g. 4.0" />
            </div>

            <div class="form-group">
              <label>Environment</label>
              <select v-model="createForm.environment">
                <option value="None">None / General</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>

            <div class="form-group">
              <label>Linked Client / Customer</label>
              <select v-model="createForm.customer_id">
                <option :value="null">No Client (Internal Task)</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.company_name || c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Linked Project</label>
              <select v-model="createForm.project_id">
                <option :value="null">No Project</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name || p.title }}</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>Detailed Task Description *</label>
              <textarea v-model="createForm.description" rows="4" required placeholder="Specify scope, requirements, steps to reproduce, or verification criteria..."></textarea>
            </div>

            <!-- Review Configuration -->
            <div class="form-group full-width review-panel">
              <label class="checkbox-label">
                <input type="checkbox" v-model="createForm.review_required" />
                <span><strong>Mandatory Review Required</strong> (Task cannot be completed without reviewer approval)</span>
              </label>
              <div v-if="createForm.review_required" class="mt-8">
                <label>Designated Reviewer</label>
                <select v-model="createForm.reviewer_id" required>
                  <option value="" disabled>Select Reviewer...</option>
                  <option v-for="u in activeUsers" :key="u.id" :value="u.id">{{ u.full_name }} ({{ u.email }})</option>
                </select>
              </div>
            </div>

            <!-- Checklist / Subtasks -->
            <div class="form-group full-width checklist-panel">
              <div class="checklist-header">
                <strong>Checklist &amp; Subtasks</strong>
                <button type="button" class="button secondary small" @click="addChecklistRow">+ Add Subtask</button>
              </div>
              <div v-for="(item, idx) in createForm.checklists" :key="idx" class="checklist-input-row">
                <input v-model="createForm.checklists[idx]" placeholder="Subtask description..." />
                <button v-if="createForm.checklists.length > 1" type="button" class="delete-btn" @click="removeChecklistRow(idx)">&times;</button>
              </div>
            </div>
          </div>

          <div v-if="createError" class="error-banner">{{ createError }}</div>

          <footer class="modal-footer">
            <button type="button" class="button secondary" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="button primary" :disabled="submittingTask">
              {{ submittingTask ? 'Assigning...' : 'Create & Assign Task' }}
            </button>
          </footer>
        </form>
      </div>
    </div>

    <!-- TASK DETAIL DRAWER / MODAL -->
    <div v-if="showDetailModal && selectedTask" class="modal-backdrop" @click.self="showDetailModal = false">
      <div class="modal-dialog modal-lg modal-scroll-container">
        <header class="modal-header">
          <div>
            <div class="detail-header-top">
              <span class="task-number-lg">{{ selectedTask.task_number }}</span>
              <span class="status-badge" :class="statusClass(selectedTask.status)">{{ selectedTask.status }}</span>
              <span class="priority-badge" :class="priorityClass(selectedTask.priority)">{{ selectedTask.priority }}</span>
            </div>
            <h2 class="detail-title-text">{{ selectedTask.title }}</h2>
          </div>
          <button class="close-btn" @click="showDetailModal = false">&times;</button>
        </header>

        <!-- Status Action Toolbar -->
        <div class="workflow-toolbar">
          <span class="toolbar-label">WORKFLOW:</span>
          <button v-if="selectedTask.status === 'To Do'" class="btn-flow" @click="changeStatus('In Progress')">
            ▶ Start Work
          </button>
          <button v-if="['To Do', 'In Progress'].includes(selectedTask.status)" class="btn-flow warning" @click="openReasonModal('Blocked')">
            ⚠️ Mark Blocked
          </button>
          <button v-if="selectedTask.status === 'Blocked'" class="btn-flow success" @click="changeStatus('In Progress')">
            ✓ Unblock Task
          </button>
          <button v-if="['To Do', 'In Progress'].includes(selectedTask.status)" class="btn-flow muted-btn" @click="openReasonModal('On Hold')">
            ⏸ Put On Hold
          </button>
          <button v-if="selectedTask.status === 'On Hold'" class="btn-flow" @click="changeStatus('In Progress')">
            ▶ Resume Work
          </button>
          <button v-if="selectedTask.status === 'In Progress' && selectedTask.review_required" class="btn-flow review-btn" @click="changeStatus('In Review')">
            🔍 Submit for Review
          </button>
          <button v-if="selectedTask.status === 'In Review'" class="btn-flow success" @click="changeStatus('Completed')">
            ✓ Approve Completion
          </button>
          <button v-if="selectedTask.status === 'In Review'" class="btn-flow danger" @click="openReasonModal('Changes Requested')">
            ↺ Request Changes
          </button>
          <button v-if="['In Progress', 'Changes Requested'].includes(selectedTask.status) && !selectedTask.review_required" class="btn-flow success" @click="changeStatus('Completed')">
            ✓ Mark Completed
          </button>
          <button v-if="selectedTask.status === 'Completed'" class="btn-flow muted-btn" @click="openReasonModal('Reopen')">
            ↺ Reopen Task
          </button>
          <button v-if="selectedTask.status !== 'Cancelled' && selectedTask.status !== 'Completed'" class="btn-flow danger-text" @click="openReasonModal('Cancelled')">
            Cancel Task
          </button>
        </div>

        <div class="modal-body-scrollable">
          <!-- Overview Cards -->
          <div class="detail-overview-grid">
            <div class="d-box">
              <span class="muted small">Assignee</span>
              <strong>{{ selectedTask.assignee_name }}</strong>
              <small v-if="selectedTask.assignee_notification_email" class="notif-mail-indicator">✉️ {{ selectedTask.assignee_notification_email }}</small>
            </div>
            <div class="d-box">
              <span class="muted small">Due Date</span>
              <strong :class="{ 'overdue-text': selectedTask.is_overdue }">{{ selectedTask.due_date }} ({{ selectedTask.due_time || '18:00' }})</strong>
            </div>
            <div class="d-box">
              <span class="muted small">Effort (Est / Logged)</span>
              <strong>{{ selectedTask.estimated_hours || 0 }}h / {{ selectedTask.actual_hours || 0 }}h</strong>
            </div>
            <div class="d-box">
              <span class="muted small">Assigned By</span>
              <strong>{{ selectedTask.creator_user_name || 'System' }}</strong>
            </div>
          </div>

          <!-- Reason Callout Note if Blocked / On Hold / Changes Requested -->
          <div v-if="selectedTask.blocker_reason" class="reason-callout danger">
            <div class="callout-icon">⛔</div>
            <div>
              <strong>Task is Blocked:</strong>
              <p>{{ selectedTask.blocker_reason }}</p>
            </div>
          </div>
          <div v-if="selectedTask.on_hold_reason" class="reason-callout warning">
            <div class="callout-icon">⏸</div>
            <div>
              <strong>Task is On Hold:</strong>
              <p>{{ selectedTask.on_hold_reason }}</p>
            </div>
          </div>
          <div v-if="selectedTask.changes_requested_reason" class="reason-callout amber">
            <div class="callout-icon">↺</div>
            <div>
              <strong>Review Feedback / Changes Requested:</strong>
              <p>{{ selectedTask.changes_requested_reason }}</p>
            </div>
          </div>

          <!-- Description -->
          <div class="section-block">
            <h4>Description</h4>
            <p class="description-text">{{ selectedTask.description || 'No description provided.' }}</p>
          </div>

          <!-- Subtasks / Checklist with Seamless Inline Addition -->
          <div class="section-block">
            <div class="section-header-flex">
              <h4>Checklist &amp; Subtasks ({{ selectedTask.checklist_completed || 0 }}/{{ selectedTask.checklist_total || 0 }})</h4>
            </div>
            <div class="subtask-list">
              <label v-for="it in (selectedTask.checklists || [])" :key="it.id" class="subtask-row">
                <input type="checkbox" :checked="it.is_completed" @change="toggleChecklistItem(it)" />
                <span :class="{ 'completed-strike': it.is_completed }">{{ it.title }}</span>
              </label>
              <div v-if="!selectedTask.checklists || selectedTask.checklists.length === 0" class="muted small">No subtasks defined yet.</div>
            </div>

            <!-- Inline Subtask Input (No browser prompts!) -->
            <div class="inline-subtask-add mt-12">
              <input
                v-model="newSubtaskTitle"
                placeholder="Add a new checklist item and press Enter..."
                @keydown.enter.prevent="addChecklistInline"
              />
              <button
                type="button"
                class="button secondary small"
                :disabled="!newSubtaskTitle.trim() || addingSubtask"
                @click="addChecklistInline"
              >
                {{ addingSubtask ? 'Adding...' : '+ Add' }}
              </button>
            </div>
          </div>

          <!-- Time Logging -->
          <div class="section-block">
            <div class="section-header-flex">
              <h4>Time Tracking</h4>
              <span class="muted small">Logged: {{ selectedTask.actual_hours || 0 }}h / Est: {{ selectedTask.estimated_hours || 0 }}h</span>
            </div>
            <form @submit.prevent="submitTimeLog" class="inline-time-form">
              <input v-model.number="timeForm.hours" type="number" step="0.25" min="0.25" placeholder="Hours" required style="width: 110px;" />
              <input v-model="timeForm.description" placeholder="Work summary..." required style="flex: 1;" />
              <button type="submit" class="button small">Log Hours</button>
            </form>
            <div v-if="taskTimeLogs.length" class="time-logs-history mt-12">
              <div v-for="log in taskTimeLogs" :key="log.id" class="time-log-item">
                <span><strong>{{ log.hours }}h</strong> by {{ log.user_name }}</span>
                <span class="muted">{{ log.description }}</span>
                <small class="muted">{{ log.work_date }}</small>
              </div>
            </div>
          </div>

          <!-- Comments & Discussion -->
          <div class="section-block">
            <h4>Comments &amp; Discussion</h4>
            <div class="comments-list">
              <div v-for="comm in taskComments" :key="comm.id" class="comment-box">
                <div class="comment-header">
                  <strong>{{ comm.author_name }}</strong>
                  <span class="muted small">{{ formatDate(comm.created_at) }}</span>
                </div>
                <p>{{ comm.comment_text }}</p>
              </div>
              <div v-if="!taskComments.length" class="muted small">No comments posted yet.</div>
            </div>
            <form @submit.prevent="submitComment" class="comment-post-form mt-12">
              <textarea v-model="newCommentText" rows="2" placeholder="Write a comment or update (use @name to mention)..." required></textarea>
              <button type="submit" class="button small" style="align-self: flex-end;">Post Comment</button>
            </form>
          </div>

          <!-- Activity Audit Log -->
          <div class="section-block">
            <h4>Activity History</h4>
            <div class="activity-timeline-sm">
              <div v-for="act in taskActivities" :key="act.id" class="act-row">
                <span class="act-dot"></span>
                <div class="act-info">
                  <span>{{ act.details }}</span>
                  <small class="muted">{{ act.user_name }} • {{ formatDate(act.created_at) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="button secondary" @click="showDetailModal = false">Close</button>
        </footer>
      </div>
    </div>

    <!-- REASON MODAL (Clean in-app replacement for window.prompt) -->
    <div v-if="reasonModal.show" class="modal-backdrop" @click.self="reasonModal.show = false">
      <div class="modal-dialog modal-sm">
        <header class="modal-header">
          <div>
            <h3>{{ reasonModal.title }}</h3>
            <p class="muted small">{{ reasonModal.subtitle }}</p>
          </div>
          <button class="close-btn" @click="reasonModal.show = false">&times;</button>
        </header>

        <form @submit.prevent="confirmReasonModal">
          <div class="modal-body-scrollable">
            <div class="form-group full-width">
              <label>{{ reasonModal.fieldLabel }} *</label>
              <textarea
                v-model="reasonModal.reasonText"
                rows="4"
                :placeholder="reasonModal.placeholder"
                required
                class="reason-textarea"
                autofocus
              ></textarea>
            </div>
          </div>

          <footer class="modal-footer">
            <button type="button" class="button secondary" @click="reasonModal.show = false">Cancel</button>
            <button
              type="submit"
              class="button"
              :class="reasonModal.btnClass"
              :disabled="!reasonModal.reasonText.trim()"
            >
              {{ reasonModal.confirmText }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import CrmPageHeader from '../components/CrmPageHeader.vue'
import { apiGet, apiPost, apiPut } from '../api/client'

const currentTab = ref('dashboard')
const viewMode = ref('list') // 'list' | 'kanban'

const kanbanColumns = computed(() => {
  const cols = [
    { id: 'todo', label: 'To Do', tone: 'slate', items: [] },
    { id: 'progress', label: 'In Progress', tone: 'blue', items: [] },
    { id: 'review', label: 'In Review', tone: 'purple', items: [] },
    { id: 'blocked', label: 'Blocked / Hold', tone: 'amber', items: [] },
    { id: 'completed', label: 'Completed', tone: 'green', items: [] }
  ]
  tasks.value.forEach(task => {
    if (task.status === 'In Progress') {
      cols[1].items.push(task)
    } else if (task.status === 'In Review' || task.status === 'Changes Requested') {
      cols[2].items.push(task)
    } else if (task.status === 'Blocked' || task.status === 'On Hold') {
      cols[3].items.push(task)
    } else if (task.status === 'Completed') {
      cols[4].items.push(task)
    } else {
      cols[0].items.push(task)
    }
  })
  return cols
})
const loadingTasks = ref(false)
const tasks = ref([])
const activeUsers = ref([])
const customers = ref([])
const projects = ref([])

// Toast State (Replaces all window.alert)
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  timeout: null
})

function showToast(message, type = 'success') {
  if (toast.timeout) clearTimeout(toast.timeout)
  toast.message = message
  toast.type = type
  toast.show = true
  toast.timeout = setTimeout(() => {
    toast.show = false
  }, 3500)
}

// Reason Modal State (Replaces all window.prompt)
const reasonModal = reactive({
  show: false,
  actionType: '',
  title: '',
  subtitle: '',
  fieldLabel: '',
  placeholder: '',
  reasonText: '',
  confirmText: 'Submit',
  btnClass: 'primary'
})

function openReasonModal(actionType) {
  reasonModal.actionType = actionType
  reasonModal.reasonText = ''
  if (actionType === 'Blocked') {
    reasonModal.title = 'Mark Task Blocked'
    reasonModal.subtitle = 'Please describe the blocker preventing progress.'
    reasonModal.fieldLabel = 'Blocker Reason'
    reasonModal.placeholder = 'e.g. Waiting on client credentials, API endpoint down...'
    reasonModal.confirmText = 'Mark Blocked'
    reasonModal.btnClass = 'warning'
  } else if (actionType === 'On Hold') {
    reasonModal.title = 'Put Task On Hold'
    reasonModal.subtitle = 'State the reason for pausing this task.'
    reasonModal.fieldLabel = 'On Hold Reason'
    reasonModal.placeholder = 'e.g. Paused pending management review next sprint...'
    reasonModal.confirmText = 'Put On Hold'
    reasonModal.btnClass = 'secondary'
  } else if (actionType === 'Changes Requested') {
    reasonModal.title = 'Request Changes'
    reasonModal.subtitle = 'Provide specific feedback and required modifications.'
    reasonModal.fieldLabel = 'Feedback & Required Changes'
    reasonModal.placeholder = 'e.g. Fix test coverage in auth module and adjust styling...'
    reasonModal.confirmText = 'Request Changes'
    reasonModal.btnClass = 'danger'
  } else if (actionType === 'Reopen') {
    reasonModal.title = 'Reopen Task'
    reasonModal.subtitle = 'Provide a reason for reopening this completed task.'
    reasonModal.fieldLabel = 'Reopen Reason'
    reasonModal.placeholder = 'e.g. Issue recurred in regression testing...'
    reasonModal.confirmText = 'Reopen Task'
    reasonModal.btnClass = 'primary'
  } else if (actionType === 'Cancelled') {
    reasonModal.title = 'Cancel Task'
    reasonModal.subtitle = 'Are you sure you want to cancel this task?'
    reasonModal.fieldLabel = 'Cancellation Reason'
    reasonModal.placeholder = 'e.g. Feature request dropped by client...'
    reasonModal.confirmText = 'Confirm Cancellation'
    reasonModal.btnClass = 'danger'
  }
  reasonModal.show = true
}

async function confirmReasonModal() {
  const reason = reasonModal.reasonText.trim()
  if (!reason) return
  const actionType = reasonModal.actionType
  reasonModal.show = false

  if (actionType === 'Blocked') {
    await changeStatus('Blocked', { blocker_reason: reason })
  } else if (actionType === 'On Hold') {
    await changeStatus('On Hold', { on_hold_reason: reason })
  } else if (actionType === 'Changes Requested') {
    await changeStatus('Changes Requested', { changes_requested_reason: reason })
  } else if (actionType === 'Reopen') {
    await changeStatus('In Progress', { reopen_reason: reason })
  } else if (actionType === 'Cancelled') {
    await changeStatus('Cancelled', { cancellation_reason: reason })
  }
}

// Inline Subtask State
const newSubtaskTitle = ref('')
const addingSubtask = ref(false)

const pagination = reactive({
  page: 1,
  limit: 25,
  total: 0,
  pages: 1
})

const searchQuery = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterType = ref('')
const filterOverdue = ref(false)

const metrics = reactive({
  total_open: 0,
  my_open: 0,
  due_today: 0,
  overdue: 0,
  critical: 0,
  blocked: 0,
  awaiting_review: 0,
  completed_this_week: 0
})

const dashboardData = reactive({
  by_status: {},
  by_priority: {},
  by_assignee: []
})

const reportsData = reactive({
  team_workload: [],
  overdue_tasks: [],
  by_project: [],
  by_type: []
})

const taskTypes = ref([
  { name: 'Development' },
  { name: 'Bug Fix' },
  { name: 'Client Change Request' },
  { name: 'Deployment' },
  { name: 'Testing / QA' },
  { name: 'Configuration' },
  { name: 'Documentation' },
  { name: 'Client Support' },
  { name: 'Maintenance' },
  { name: 'Research' },
  { name: 'Internal Operations' },
  { name: 'Other' }
])

const categories = ref([
  'Client Delivery',
  'Engineering & Tech',
  'Infrastructure & Cloud',
  'Quality Assurance',
  'Internal Operations',
  'Customer Support',
  'Research & Planning'
])

const settingsForm = reactive({
  sla_policies: [],
  smtp_settings: { host: '', port: 587, username: '', password: '', use_tls: true, from_email: '', from_name: '', is_enabled: false }
})

// Modals
const showCreateModal = ref(false)
const submittingTask = ref(false)
const createError = ref('')
const createForm = reactive({
  title: '',
  task_type: 'Development',
  priority: 'Medium',
  assignee_id: '',
  category: 'Client Delivery',
  due_date: new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10),
  due_time: '18:00',
  start_date: new Date().toISOString().substring(0, 10),
  estimated_hours: 4,
  environment: 'Staging',
  customer_id: null,
  project_id: null,
  description: '',
  review_required: false,
  reviewer_id: '',
  checklists: ['Configure environment & prerequisites', 'Execute task changes', 'Test & verify completion']
})

const showDetailModal = ref(false)
const selectedTask = ref(null)
const taskComments = ref([])
const taskActivities = ref([])
const taskTimeLogs = ref([])
const newCommentText = ref('')
const timeForm = reactive({ hours: 1, description: '' })
const savingSettings = ref(false)

function switchTab(tab) {
  currentTab.value = tab
  if (['all', 'my', 'assigned_by_me'].includes(tab)) {
    pagination.page = 1
    fetchTasks()
  } else if (tab === 'dashboard') {
    fetchDashboardMetrics()
  } else if (tab === 'reports') {
    fetchReports()
  } else if (tab === 'settings') {
    fetchSettings()
  }
}

function filterOverdueTasks() {
  filterOverdue.value = true
  switchTab('all')
}

function toggleOverdueFilter() {
  filterOverdue.value = !filterOverdue.value
  fetchTasks()
}

async function fetchDashboardMetrics() {
  try {
    const res = await apiGet('/api/tasks/dashboard-metrics')
    Object.assign(metrics, res.metrics || {})
    dashboardData.by_status = res.by_status || {}
    dashboardData.by_priority = res.by_priority || {}
    dashboardData.by_assignee = res.by_assignee || []
  } catch (err) {
    console.error('Failed to load dashboard metrics:', err)
  }
}

async function fetchTasks() {
  loadingTasks.value = true
  try {
    const params = new URLSearchParams({
      tab: currentTab.value,
      search: searchQuery.value,
      status: filterStatus.value,
      priority: filterPriority.value,
      task_type: filterType.value,
      is_overdue: filterOverdue.value ? 'true' : '',
      page: pagination.page,
      limit: pagination.limit
    })
    const res = await apiGet(`/api/tasks?${params.toString()}`)
    tasks.value = res.tasks || []
    pagination.total = res.total || 0
    pagination.pages = res.pages || 1
  } catch (err) {
    console.error('Failed to fetch tasks:', err)
    showToast(err.message || 'Failed to fetch tasks', 'error')
  } finally {
    loadingTasks.value = false
  }
}

async function fetchReports() {
  try {
    const res = await apiGet('/api/tasks/reports')
    reportsData.team_workload = res.team_workload || []
    reportsData.overdue_tasks = res.overdue_tasks || []
    reportsData.by_project = res.by_project || []
    reportsData.by_type = res.by_type || []
  } catch (err) {
    console.error('Failed to fetch reports:', err)
  }
}

async function fetchSettings() {
  try {
    const res = await apiGet('/api/tasks/settings')
    if (res.settings) {
      settingsForm.sla_policies = res.settings.sla_policies || []
      settingsForm.smtp_settings = res.settings.smtp_settings || {}
      if (res.settings.task_types) taskTypes.value = res.settings.task_types
      if (res.settings.categories) categories.value = res.settings.categories
    }
  } catch (err) {
    console.error('Failed to fetch task settings:', err)
  }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    await apiPut('/api/tasks/settings', settingsForm)
    showToast('Task settings saved successfully!', 'success')
  } catch (err) {
    showToast(err.message || 'Failed to save settings', 'error')
  } finally {
    savingSettings.value = false
  }
}

function refreshData() {
  fetchDashboardMetrics()
  if (['all', 'my', 'assigned_by_me'].includes(currentTab.value)) {
    fetchTasks()
  } else if (currentTab.value === 'reports') {
    fetchReports()
  }
  showToast('Task data refreshed', 'info')
}

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.page = 1
    fetchTasks()
  }, 300)
}

function changePage(p) {
  pagination.page = p
  fetchTasks()
}

function filterByStatus(st) {
  filterStatus.value = st
  switchTab('all')
}

function filterByPriority(p) {
  filterPriority.value = p
  switchTab('all')
}

function getPriorityDesc(p) {
  switch (p) {
    case 'Critical': return 'Requires immediate intervention'
    case 'High': return 'Urgent milestone item'
    case 'Medium': return 'Normal business priority'
    case 'Low': return 'Backlog / minor enhancement'
    default: return ''
  }
}

function percentOfTotal(count) {
  const tot = metrics.total_open || 1
  return Math.min(100, Math.round((count / tot) * 100))
}

function getInitials(name) {
  if (!name) return 'TM'
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
}

function statusClass(st) {
  switch (st) {
    case 'To Do': return 'status-todo'
    case 'In Progress': return 'status-progress'
    case 'Blocked': return 'status-blocked'
    case 'On Hold': return 'status-hold'
    case 'In Review': return 'status-review'
    case 'Changes Requested': return 'status-changes'
    case 'Completed': return 'status-completed'
    case 'Cancelled': return 'status-cancelled'
    default: return 'status-default'
  }
}

function priorityClass(p) {
  switch (p) {
    case 'Critical': return 'pri-critical'
    case 'High': return 'pri-high'
    case 'Medium': return 'pri-medium'
    case 'Low': return 'pri-low'
    default: return 'pri-medium'
  }
}

function formatDate(dt) {
  if (!dt) return '-'
  return String(dt).substring(0, 16).replace('T', ' ')
}

// Create Task Modal & Checklists
function openCreateModal() {
  createError.value = ''
  createForm.title = ''
  createForm.task_type = 'Development'
  createForm.priority = 'Medium'
  createForm.assignee_id = activeUsers.value.length ? activeUsers.value[0].id : ''
  createForm.due_date = new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10)
  createForm.description = ''
  createForm.checklists = ['Configure environment & prerequisites', 'Execute task changes', 'Test & verify completion']
  showCreateModal.value = true
}

function addChecklistRow() {
  createForm.checklists.push('')
}

function removeChecklistRow(idx) {
  createForm.checklists.splice(idx, 1)
}

async function submitCreateTask() {
  submittingTask.value = true
  createError.value = ''
  try {
    const payload = {
      ...createForm,
      checklists: createForm.checklists.filter(c => c.trim())
    }
    await apiPost('/api/tasks', payload)
    showCreateModal.value = false
    showToast('Task created & assigned successfully!', 'success')
    refreshData()
  } catch (err) {
    createError.value = err.message || 'Failed to create task'
    showToast(createError.value, 'error')
  } finally {
    submittingTask.value = false
  }
}

// Task Details & Actions
async function openDetail(t) {
  try {
    const res = await apiGet(`/api/tasks/${t.id}`)
    selectedTask.value = res.task
    taskComments.value = res.comments || []
    taskActivities.value = res.activities || []
    taskTimeLogs.value = res.time_logs || []
    newSubtaskTitle.value = ''
    showDetailModal.value = true
  } catch (err) {
    console.error('Failed to load task details:', err)
    showToast('Failed to load task details', 'error')
  }
}

async function changeStatus(newStatus, extra = {}) {
  try {
    const res = await apiPost(`/api/tasks/${selectedTask.value.id}/status`, {
      status: newStatus,
      ...extra
    })
    selectedTask.value = res.task
    showToast(`Task moved to ${newStatus}`, 'success')
    openDetail(res.task)
    refreshData()
  } catch (err) {
    showToast(err.message || 'Status transition failed', 'error')
  }
}

async function toggleChecklistItem(item) {
  try {
    const res = await apiPut(`/api/tasks/${selectedTask.value.id}/checklists/${item.id}`, {
      is_completed: !item.is_completed
    })
    item.is_completed = !item.is_completed
    selectedTask.value.progress_pct = res.progress_pct
    showToast(item.is_completed ? 'Subtask marked completed' : 'Subtask reopened', 'info')
  } catch (err) {
    console.error('Failed to update checklist item:', err)
    showToast('Failed to update subtask', 'error')
  }
}

async function addChecklistInline() {
  const title = newSubtaskTitle.value.trim()
  if (!title) return
  addingSubtask.value = true
  try {
    await apiPost(`/api/tasks/${selectedTask.value.id}/checklists`, { title })
    newSubtaskTitle.value = ''
    showToast('Subtask added', 'success')
    openDetail(selectedTask.value)
  } catch (err) {
    showToast(err.message || 'Failed to add checklist item', 'error')
  } finally {
    addingSubtask.value = false
  }
}

async function submitTimeLog() {
  try {
    await apiPost(`/api/tasks/${selectedTask.value.id}/time-logs`, timeForm)
    timeForm.hours = 1
    timeForm.description = ''
    showToast('Work hours logged successfully', 'success')
    openDetail(selectedTask.value)
  } catch (err) {
    showToast(err.message || 'Failed to log work hours', 'error')
  }
}

async function submitComment() {
  if (!newCommentText.value.trim()) return
  try {
    await apiPost(`/api/tasks/${selectedTask.value.id}/comments`, { comment_text: newCommentText.value })
    newCommentText.value = ''
    showToast('Comment posted', 'success')
    openDetail(selectedTask.value)
  } catch (err) {
    showToast(err.message || 'Failed to post comment', 'error')
  }
}

async function loadDropdowns() {
  try {
    const usersRes = await apiGet('/api/setup/users')
    activeUsers.value = (usersRes.users || []).filter(u => u.is_active)
  } catch (e) {}

  try {
    const custRes = await apiGet('/api/customers')
    customers.value = custRes.customers || []
  } catch (e) {}

  try {
    const projRes = await apiGet('/api/projects')
    projects.value = projRes.projects || []
  } catch (e) {}
}

onMounted(() => {
  loadDropdowns()
  fetchDashboardMetrics()
})
</script>

<style scoped>
.task-management-page {
  padding: 0 0 40px 0;
  width: 100%;
}

/* Floating Toast Notification */
.toast-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  max-width: 420px;
  border-left: 4px solid #2563eb;
}

.toast-notification.success {
  border-left-color: #10b981;
}

.toast-notification.error {
  border-left-color: #ef4444;
}

.toast-notification.info {
  border-left-color: #3b82f6;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-notification.success .toast-icon { color: #10b981; }
.toast-notification.error .toast-icon { color: #ef4444; }
.toast-notification.info .toast-icon { color: #60a5fa; }

.toast-body { flex: 1; }
.toast-text { font-weight: 600; line-height: 1.4; }

.toast-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.toast-close:hover { color: #fff; }

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease-out;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Header & Actions */
.crm-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.badge-eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #2563eb;
  background: #eff6ff;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.crm-page-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.muted {
  color: #64748b;
  font-size: 13px;
}

.crm-page-header__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

/* Buttons */
.button {
  background: #2563eb;
  color: #fff;
  border: 1px solid transparent;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  text-decoration: none;
}

.button:hover { background: #1d4ed8; }
.button.secondary {
  background: #fff;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.button.secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}
.button.small { padding: 6px 12px; font-size: 12px; }
.button.warning { background: #d97706; color: #fff; }
.button.danger { background: #dc2626; color: #fff; }

/* Tabs Navigation */
.tasks-tabs-nav {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tasks-tabs-nav button {
  background: none;
  border: none;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  transition: all 0.15s;
  white-space: nowrap;
}

.tasks-tabs-nav button:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.tasks-tabs-nav button.active {
  color: #2563eb;
  background: #eff6ff;
  font-weight: 700;
}

.tab-badge {
  background: #e2e8f0;
  color: #475569;
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}
.tab-badge.primary { background: #2563eb; color: #fff; }

/* KPI Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
}

.metric-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.metric-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.metric-icon-box.blue { background: #eff6ff; color: #2563eb; }
.metric-icon-box.indigo { background: #e0e7ff; color: #4f46e5; }
.metric-icon-box.amber { background: #fef3c7; color: #d97706; }
.metric-icon-box.red { background: #fee2e2; color: #dc2626; }
.metric-icon-box.rose { background: #ffe4e6; color: #e11d48; }
.metric-icon-box.purple { background: #f3e8ff; color: #9333ea; }

.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 11px;
  color: #94a3b8;
}

.text-primary { color: #2563eb !important; }
.text-amber { color: #d97706 !important; }
.text-red { color: #dc2626 !important; }
.text-rose { color: #e11d48 !important; }
.text-purple { color: #9333ea !important; }

/* Dashboard Widgets */
.dashboard-widgets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.widget-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-card h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}


.breakdown-list, .priority-list, .workload-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.bar-wrap {
  flex: 1;
  background: #f1f5f9;
  border-radius: 6px;
  height: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  background: #2563eb;
}

.bar-fill.status-todo { background: #94a3b8; }
.bar-fill.status-progress { background: #2563eb; }
.bar-fill.status-blocked { background: #dc2626; }
.bar-fill.status-hold { background: #d97706; }
.bar-fill.status-review { background: #7c3aed; }
.bar-fill.status-changes { background: #ea580c; }
.bar-fill.status-completed { background: #10b981; }

.count-badge {
  background: #f1f5f9;
  color: #334155;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.priority-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.priority-item:hover { background: #f1f5f9; }

.priority-item-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.workload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid #f1f5f9;
}
.workload-item:last-child { border-bottom: none; }

.workload-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pill-count {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 3px 9px;
  border-radius: 12px;
}

/* Filter Bar */
.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 260px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.search-wrap input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
}
.search-wrap input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-select {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.btn-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-filter-pill:hover { background: #f8fafc; }
.btn-filter-pill.active {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}
.pill-dot.red { background: #dc2626; }

/* Tables */
.table-container {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.record-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.record-table th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.record-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.clickable-row { cursor: pointer; transition: background 0.1s; }
.clickable-row:hover { background: #f8fafc; }

.task-number { color: #2563eb; font-weight: 700; }
.task-number-lg { font-size: 18px; font-weight: 800; color: #2563eb; margin-right: 10px; }

.type-pill-sm {
  display: block;
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  margin-top: 2px;
}

.task-title-cell { display: flex; flex-direction: column; gap: 4px; }
.task-title-text { font-size: 13px; color: #0f172a; }

.tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.context-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-mail-indicator {
  display: block;
  font-size: 11px;
  color: #2563eb;
  font-weight: 600;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status-todo { background: #f1f5f9; color: #475569; }
.status-progress { background: #dbeafe; color: #1e40af; }
.status-blocked { background: #fee2e2; color: #dc2626; }
.status-hold { background: #fef3c7; color: #b45309; }
.status-review { background: #ede9fe; color: #6d28d9; }
.status-changes { background: #ffedd5; color: #c2410c; }
.status-completed { background: #d1fae5; color: #047857; }
.status-cancelled { background: #f1f5f9; color: #64748b; }

/* Priority Badges */
.priority-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.pri-critical { background: #fee2e2; color: #dc2626; }
.pri-high { background: #ffedd5; color: #ea580c; }
.pri-medium { background: #eff6ff; color: #2563eb; }
.pri-low { background: #f1f5f9; color: #64748b; }

.overdue-text { color: #dc2626; font-weight: 700; }
.badge-overdue {
  background: #dc2626;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 6px;
}

.subtask-progress {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 90px;
}

.progress-bar-sm {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  background: #10b981;
  height: 100%;
}

.right { text-align: right; }
.action-btn {
  background: #fff;
  border: 1px solid #cbd5e1;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
}
.action-btn:hover { background: #f8fafc; color: #0f172a; }

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.page-controls { display: flex; gap: 8px; align-items: center; }

/* Settings Tab Styling */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.settings-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.settings-badge {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 12px;
}

.input-with-unit {
  display: inline-flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.unit-input {
  width: 70px;
  border: none !important;
  padding: 8px 10px;
  font-size: 13px;
  text-align: right;
  outline: none;
}

.unit-tag {
  background: #f8fafc;
  padding: 8px 10px;
  font-size: 12px;
  color: #64748b;
  border-left: 1px solid #e2e8f0;
  font-weight: 600;
}

.smtp-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.field-item input {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
}

.toggles-row {
  display: flex;
  gap: 24px;
  align-items: center;
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.toggle-control input[type="checkbox"] {
  width: 18px !important;
  height: 18px !important;
  min-height: 18px !important;
  margin: 0 !important;
  accent-color: #2563eb !important;
  cursor: pointer;
}

.hint-text {
  font-size: 12px;
  color: #64748b;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-dialog {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-dialog.modal-lg { max-width: 940px; }
.modal-dialog.modal-sm { max-width: 520px; }

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  flex-shrink: 0;
}

.modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 26px; color: #94a3b8; cursor: pointer; }
.close-btn:hover { color: #0f172a; }

.modal-body-scrollable {
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 12px; font-weight: 700; color: #475569; }
.form-group input, .form-group select, .form-group textarea {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
}

.review-panel, .checklist-panel {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px !important;
  height: 18px !important;
  min-height: 18px !important;
  margin: 0 !important;
  accent-color: #2563eb !important;
}

.checklist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.checklist-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
.checklist-input-row input { flex: 1; }
.delete-btn { background: none; border: none; color: #ef4444; font-size: 20px; cursor: pointer; }

.modal-footer {
  padding: 14px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.error-banner {
  background: #fee2e2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 8px;
  margin-top: 14px;
  font-size: 13px;
}

/* Detail Modal Specifics */
.detail-header-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title-text {
  font-size: 20px;
  font-weight: 800;
  margin: 6px 0 0 0;
  color: #0f172a;
}

.workflow-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  margin-right: 4px;
  letter-spacing: 0.5px;
}

.btn-flow {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-flow:hover { opacity: 0.9; }
.btn-flow.warning { background: #d97706; }
.btn-flow.success { background: #059669; }
.btn-flow.danger { background: #dc2626; }
.btn-flow.muted-btn { background: #64748b; }
.btn-flow.review-btn { background: #7c3aed; }
.btn-flow.danger-text { background: none; color: #dc2626; border: 1px solid #fecaca; }

.detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.d-box span { display: block; margin-bottom: 2px; }

/* Clean In-App Callouts */
.reason-callout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 1.5;
}
.reason-callout p { margin: 4px 0 0 0; }
.reason-callout.danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.reason-callout.warning { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; }
.reason-callout.amber { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
.callout-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }

.section-block { margin-bottom: 24px; }
.section-block h4 { margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a; }
.section-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.description-text { font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin: 0; }

.subtask-list { display: flex; flex-direction: column; gap: 8px; }
.subtask-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}
.subtask-row input[type="checkbox"] {
  width: 18px !important;
  height: 18px !important;
  min-height: 18px !important;
  margin: 0 !important;
  accent-color: #2563eb !important;
}

.completed-strike { text-decoration: line-through; color: #94a3b8; }

.inline-subtask-add {
  display: flex;
  gap: 8px;
  align-items: center;
}
.inline-subtask-add input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
}

.inline-time-form { display: flex; gap: 8px; margin-top: 8px; }
.inline-time-form input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; }
.time-log-item { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }

.comments-list { display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; }
.comment-box { background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; border: 1px solid #f1f5f9; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.comment-post-form { display: flex; flex-direction: column; gap: 8px; }
.comment-post-form textarea { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: inherit; }

.activity-timeline-sm { display: flex; flex-direction: column; gap: 8px; }
.act-row { display: flex; gap: 10px; font-size: 12px; }
.act-dot { width: 6px; height: 6px; background: #64748b; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }

.reason-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

/* Reports Specifics */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.report-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.report-card.full-width { grid-column: 1 / -1; }

.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .dashboard-widgets-grid,
  .reports-grid,
  .smtp-form-grid,
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================================
   MODULE 2 REVAMP: KOKONUT BENTO, SKIPER TACTILE & KANBAN
   ========================================================= */

/* Sliding Tabs Bar */
.tasks-tabs-nav.bento-card {
  padding: 6px;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.tasks-tabs-nav button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: none;
  background: transparent;
  color: #64748b;
  font-family: var(--font-sans, sans-serif);
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.tasks-tabs-nav button:hover {
  color: #0284c7;
  background: rgba(2, 132, 199, 0.06);
}

.tasks-tabs-nav button.active {
  color: #0284c7;
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%);
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.08);
}

/* Metric Cards with Glowing Underline */
.metric-card.bento-card {
  position: relative;
  padding: 18px 20px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}

.metric-card.bento-card:hover {
  transform: translateY(-3px);
  border-color: rgba(2, 132, 199, 0.35);
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.1), 0 0 18px rgba(2, 132, 199, 0.08);
}

.metric-glow-line {
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 18px;
  height: 3px;
  border-radius: 999px;
  opacity: 0.35;
  transition: opacity 0.24s ease;
}

.metric-card.bento-card:hover .metric-glow-line {
  opacity: 1;
}

.metric-glow-line.blue { background: linear-gradient(90deg, #0284c7, #38bdf8); }
.metric-glow-line.indigo { background: linear-gradient(90deg, #4f46e5, #818cf8); }
.metric-glow-line.amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.metric-glow-line.red { background: linear-gradient(90deg, #dc2626, #f87171); }
.metric-glow-line.rose { background: linear-gradient(90deg, #e11d48, #fb7185); }
.metric-glow-line.green { background: linear-gradient(90deg, #10b981, #34d399); }

/* Filter Bar Bento Box */
.filters-bar.bento-card {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* View Mode Switcher Pill */
.view-mode-toggle {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-left: auto;
}

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-family: var(--font-sans, sans-serif);
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.view-toggle-btn:hover {
  color: #0f172a;
}

.view-toggle-btn.active {
  background: #ffffff;
  color: #0284c7;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* KANBAN BOARD */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(240px, 1fr));
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 540px;
}

.kanban-column.bento-card {
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  padding: 12px;
  min-height: 480px;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  margin-bottom: 12px;
}

.kanban-col-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}

.kanban-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.kanban-col-header.slate .kanban-status-dot { background: #64748b; }
.kanban-col-header.blue .kanban-status-dot { background: #0284c7; box-shadow: 0 0 6px rgba(2, 132, 199, 0.6); }
.kanban-col-header.purple .kanban-status-dot { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.6); }
.kanban-col-header.amber .kanban-status-dot { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.6); }
.kanban-col-header.green .kanban-status-dot { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }

.kanban-col-count {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.kanban-cards-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.kanban-card.bento-card {
  padding: 14px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.kanban-card.bento-card:hover {
  transform: translateY(-2px);
  border-color: rgba(2, 132, 199, 0.35);
  box-shadow: 0 8px 18px -4px rgba(15, 23, 42, 0.08);
}

.kanban-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kanban-card-title {
  font-family: var(--font-sans, sans-serif);
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.kanban-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}

.kanban-progress-text {
  font-size: 10.5px;
  color: #64748b;
  font-family: var(--font-mono, monospace);
}

.kanban-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.assignee-cell-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar-sm.mini {
  width: 22px;
  height: 22px;
  font-size: 9.5px;
}

.assignee-name-sm {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.due-cell-mini {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  font-family: var(--font-mono, monospace);
}

.due-cell-mini.overdue-text {
  color: #dc2626;
  font-weight: 700;
}

.kanban-empty-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 12px;
}

/* Modals & Dialogs (Skiper UI Frosted Elevation) */
.modal-backdrop {
  background: rgba(15, 23, 42, 0.45) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.modal-dialog {
  border-radius: 18px !important;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(241, 245, 249, 1);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(241, 245, 249, 1);
}

</style>
