"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { format, isAfter, isBefore, isToday } from "date-fns";

type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  priority: string;
  reminders: {
    id: string;
    sendAt: string;
    minutes: number;
  }[];
};

type ReminderInput = {
  value: number;
  unit: "minutes" | "hours" | "days";
};

const TIME_UNITS = [
  { label: "Minutes", value: "minutes", multiplier: 1 },
  { label: "Hours", value: "hours", multiplier: 60 },
  { label: "Days", value: "days", multiplier: 1440 },
];

const PRIORITY_COLORS = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const STATUS_COLORS = {
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

type TabType = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: {
      status?: boolean;
      delete?: boolean;
      reminders?: boolean;
    };
  }>({});

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [reminders, setReminders] = useState<ReminderInput[]>([]);
  const [newTaskReminder, setNewTaskReminder] = useState<ReminderInput>({
    value: 15,
    unit: "minutes",
  });

  const [editingReminders, setEditingReminders] = useState<string | null>(null);
  const [newReminderValue, setNewReminderValue] = useState<number>(15);
  const [newReminderUnit, setNewReminderUnit] = useState<
    "minutes" | "hours" | "days"
  >("minutes");

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const dueDateTimeString = `${dueDate}T${dueTime}`;
      const reminderMinutes = reminders.map((reminder) => ({
        minutes:
          reminder.value *
          TIME_UNITS.find((unit) => unit.value === reminder.unit)!.multiplier,
      }));

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDateTimeString,
          priority,
          reminders: reminderMinutes,
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle("");
        setDescription("");
        setDueDate("");
        setDueTime("");
        setPriority("MEDIUM");
        setReminders([]);
        setShowForm(false);

        // Refresh tasks
        fetchTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const addReminder = () => {
    if (newReminderValue > 0) {
      setReminders([
        ...reminders,
        { value: newReminderValue, unit: newReminderUnit },
      ]);
      setNewReminderValue(15);
      setNewReminderUnit("minutes");
    }
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const setTaskLoadingState = (
    taskId: string,
    action: "status" | "delete" | "reminders",
    isLoading: boolean
  ) => {
    setLoadingStates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [action]: isLoading,
      },
    }));
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setTaskLoadingState(taskId, "status", true);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // If status is being changed to COMPLETED, we'll send empty reminders
      const reminders =
        newStatus === "COMPLETED"
          ? []
          : task.reminders.map((reminder) => ({
              minutes: calculateMinutesFromSendAt(
                reminder.sendAt,
                task.dueDate
              ),
            }));

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: newStatus,
          priority: task.priority,
          reminders,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setTaskLoadingState(taskId, "status", false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      setTaskLoadingState(taskId, "delete", true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setTaskLoadingState(taskId, "delete", false);
    }
  };

  const handleUpdateTaskReminders = async (
    taskId: string,
    updatedReminders: { minutes: number }[]
  ) => {
    try {
      setTaskLoadingState(taskId, "reminders", true);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          reminders: updatedReminders,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
      }
    } catch (error) {
      console.error("Error updating task reminders:", error);
    } finally {
      setTaskLoadingState(taskId, "reminders", false);
    }
  };

  const addReminderToTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const minutes =
      newTaskReminder.value *
      TIME_UNITS.find((unit) => unit.value === newTaskReminder.unit)!
        .multiplier;

    const existingReminders = task.reminders.map((reminder) => ({
      minutes: calculateMinutesFromSendAt(reminder.sendAt, task.dueDate),
    }));

    const updatedReminders = [...existingReminders, { minutes }];
    handleUpdateTaskReminders(taskId, updatedReminders);
    setNewTaskReminder({ value: 15, unit: "minutes" });
  };

  const removeReminderFromTask = (taskId: string, reminderIndex: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedReminders = task.reminders
      .filter((_, index) => index !== reminderIndex)
      .map((reminder) => ({
        minutes: calculateMinutesFromSendAt(reminder.sendAt, task.dueDate),
      }));

    handleUpdateTaskReminders(taskId, updatedReminders);
  };

  const calculateMinutesFromSendAt = (
    sendAt: string,
    dueDate: string
  ): number => {
    const sendAtTime = new Date(sendAt).getTime();
    const dueDateTime = new Date(dueDate).getTime();
    return Math.round((dueDateTime - sendAtTime) / (60 * 1000)); // Convert milliseconds to minutes
  };

  const formatReminderTime = (minutes: number): string => {
    if (minutes >= 1440) {
      // days
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} before`;
    } else if (minutes >= 60) {
      // hours
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} before`;
    } else {
      // minutes
      return `${minutes} minute${minutes > 1 ? "s" : ""} before`;
    }
  };

  const getTaskStatusClass = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    if (task.status === "COMPLETED") {
      return "border-green-200 dark:border-green-800";
    }

    if (isBefore(dueDate, now) && task.status !== "COMPLETED") {
      return "border-red-200 dark:border-red-800";
    }

    if (isToday(dueDate)) {
      return "border-yellow-200 dark:border-yellow-800";
    }

    return "border-gray-200 dark:border-gray-700";
  };

  const getFilteredTasks = () => {
    const now = new Date();

    switch (activeTab) {
      case "OVERDUE":
        return tasks.filter(
          (task) => task.status !== "COMPLETED" && new Date(task.dueDate) < now
        );
      case "PENDING":
        return tasks.filter(
          (task) => task.status === "PENDING" && new Date(task.dueDate) >= now
        );
      case "IN_PROGRESS":
        return tasks.filter(
          (task) =>
            task.status === "IN_PROGRESS" && new Date(task.dueDate) >= now
        );
      case "COMPLETED":
        return tasks.filter((task) => task.status === "COMPLETED");
      default:
        return tasks;
    }
  };

  const getTabCount = (tabType: TabType): number => {
    const now = new Date();
    switch (tabType) {
      case "OVERDUE":
        return tasks.filter(
          (task) => task.status !== "COMPLETED" && new Date(task.dueDate) < now
        ).length;
      case "PENDING":
        return tasks.filter(
          (task) => task.status === "PENDING" && new Date(task.dueDate) >= now
        ).length;
      case "IN_PROGRESS":
        return tasks.filter(
          (task) =>
            task.status === "IN_PROGRESS" && new Date(task.dueDate) >= now
        ).length;
      case "COMPLETED":
        return tasks.filter((task) => task.status === "COMPLETED").length;
      default:
        return 0;
    }
  };

  const renderReminderForm = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Reminders
      </label>
      <div className="space-y-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              type="number"
              min="1"
              value={newReminderValue}
              onChange={(e) =>
                setNewReminderValue(Math.max(1, parseInt(e.target.value) || 0))
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter time"
            />
          </div>
          <div className="flex-1">
            <select
              value={newReminderUnit}
              onChange={(e) =>
                setNewReminderUnit(
                  e.target.value as "minutes" | "hours" | "days"
                )
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {TIME_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addReminder}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>

        {reminders.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Reminders:
            </p>
            <div className="flex flex-wrap gap-2">
              {reminders.map((reminder, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                >
                  <span>
                    {reminder.value} {reminder.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to manage your tasks.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-10">
            <div className="mr-4 bg-indigo-600 rounded-xl p-3 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Task Management
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {showForm ? "Cancel" : "Create New Task"}
            </span>
          </button>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <form
              onSubmit={handleCreateTask}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {renderReminderForm()}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {(
                ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as TabType[]
              ).map((tab) => {
                const count = getTabCount(tab);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab
                          ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }
                    `}
                  >
                    {tab.replace("_", " ")}
                    {count > 0 && (
                      <span
                        className={`
                          ml-2 py-0.5 px-2 rounded-full text-xs
                          ${
                            activeTab === tab
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }
                        `}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex justify-center items-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </motion.div>
          ) : getFilteredTasks().length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <p className="text-gray-500 dark:text-gray-400">
                No {activeTab.toLowerCase()} tasks found.
              </p>
            </motion.div>
          ) : (
            getFilteredTasks().map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 ${getTaskStatusClass(
                  task
                )} relative`}
              >
                {(loadingStates[task.id]?.status ||
                  loadingStates[task.id]?.delete ||
                  loadingStates[task.id]?.reminders) && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <div className="flex space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        PRIORITY_COLORS[
                          task.priority as keyof typeof PRIORITY_COLORS
                        ]
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {task.description}
                  </p>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateTaskStatus(task.id, e.target.value)
                        }
                        disabled={loadingStates[task.id]?.status}
                        className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent disabled:opacity-50"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={loadingStates[task.id]?.delete}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reminders
                      </h4>
                      {task.status !== "COMPLETED" && (
                        <button
                          onClick={() =>
                            setEditingReminders(
                              editingReminders === task.id ? null : task.id
                            )
                          }
                          disabled={loadingStates[task.id]?.reminders}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm disabled:opacity-50"
                        >
                          {editingReminders === task.id ? "Done" : "Edit"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.reminders.map((reminder, reminderIndex) => (
                        <div
                          key={reminder.id}
                          className="flex items-center space-x-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-sm"
                        >
                          <span>
                            {formatReminderTime(
                              calculateMinutesFromSendAt(
                                reminder.sendAt,
                                task.dueDate
                              )
                            )}
                          </span>
                          {editingReminders === task.id &&
                            task.status !== "COMPLETED" && (
                              <button
                                onClick={() =>
                                  removeReminderFromTask(task.id, reminderIndex)
                                }
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 ml-1"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                        </div>
                      ))}
                    </div>

                    {editingReminders === task.id &&
                      task.status !== "COMPLETED" && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={newTaskReminder.value}
                            onChange={(e) =>
                              setNewTaskReminder({
                                ...newTaskReminder,
                                value: Math.max(
                                  1,
                                  parseInt(e.target.value) || 0
                                ),
                              })
                            }
                            className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Time"
                          />
                          <select
                            value={newTaskReminder.unit}
                            onChange={(e) =>
                              setNewTaskReminder({
                                ...newTaskReminder,
                                unit: e.target.value as
                                  | "minutes"
                                  | "hours"
                                  | "days",
                              })
                            }
                            className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                          >
                            {TIME_UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => addReminderToTask(task.id)}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
