"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

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
  }[];
};

type ReminderOption = {
  label: string;
  minutes: number;
};

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: "5 minutes before", minutes: 5 },
  { label: "15 minutes before", minutes: 15 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
  { label: "2 hours before", minutes: 120 },
  { label: "4 hours before", minutes: 240 },
  { label: "1 day before", minutes: 1440 },
  { label: "2 days before", minutes: 2880 },
  { label: "1 week before", minutes: 10080 },
];

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const dueDateTimeString = `${dueDate}T${dueTime}`;
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
          reminders: selectedReminders.map((minutes) => ({ minutes })),
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle("");
        setDescription("");
        setDueDate("");
        setDueTime("");
        setPriority("MEDIUM");
        setSelectedReminders([]);
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setTasks(
          tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const toggleReminder = (minutes: number) => {
    setSelectedReminders((prev) =>
      prev.includes(minutes)
        ? prev.filter((r) => r !== minutes)
        : [...prev, minutes]
    );
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to manage your tasks.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tasks
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "New Task"}
        </button>
      </div>

      {/* Task creation form */}
      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label
                  htmlFor="dueTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Due Time
                </label>
                <input
                  type="time"
                  id="dueTime"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reminders
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {REMINDER_OPTIONS.map((option) => (
                  <label
                    key={option.minutes}
                    className="inline-flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReminders.includes(option.minutes)}
                      onChange={() => toggleReminder(option.minutes)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      )}

      {/* Tasks list */}
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 ${
                task.status === "COMPLETED"
                  ? "border-green-500"
                  : task.priority === "HIGH"
                  ? "border-red-500"
                  : task.priority === "MEDIUM"
                  ? "border-yellow-500"
                  : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleUpdateTaskStatus(
                        task.id,
                        task.status === "COMPLETED" ? "PENDING" : "COMPLETED"
                      )
                    }
                    className={`p-1 rounded-full ${
                      task.status === "COMPLETED"
                        ? "text-green-600 hover:text-green-700"
                        : "text-gray-400 hover:text-gray-500"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 rounded-full text-red-400 hover:text-red-500"
                  >
                    <svg
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

              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {task.description}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Due:</span>{" "}
                  {format(new Date(task.dueDate), "PPp")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Priority:</span>{" "}
                  <span
                    className={
                      task.priority === "HIGH"
                        ? "text-red-500"
                        : task.priority === "MEDIUM"
                        ? "text-yellow-500"
                        : "text-blue-500"
                    }
                  >
                    {task.priority.charAt(0) +
                      task.priority.slice(1).toLowerCase()}
                  </span>
                </p>
                {task.reminders.length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Reminders:</span>{" "}
                    <span>{task.reminders.length} set</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
