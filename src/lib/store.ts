export interface TaskInterval {
  id: string;
  started_at: number;
  ended_at: number;
  elapsed_seconds: number;
  status_at_end: "todo" | "done" | "in_progress";
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  comment?: string;
  tags?: string[];
  scheduled_date?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  kanban_column: "todo" | "in_progress" | "done";
  created_date: string;
  elapsed_seconds: number;
  timer_started_at?: number | null;
  timeline_slot?: string | null;
  timeline_date?: string | null;
  activity_id?: string | null;
  completed_at?: number | null;
  intervals?: TaskInterval[];
}
export interface RecurringActivity {
  id: string;
  name: string;
  color: string;
  created_date: string;
  tags?: string[];
}
export interface HabitGroup {
  id: string;
  name: string;
  color: string;
  created_date: string;
  order?: number;
}
export interface Habit {
  id: string;
  name: string;
  color: string;
  completed_dates: string[];
  created_date: string;
  streakCount?: number;
  lastCompletedDate?: string;
  is_pinned?: boolean;
  group_id?: string | null;
  order?: number;
}
export interface StudyTopic {
  id: string;
  title: string;
  description?: string;
  last_reviewed_date?: string;
  next_review_date?: string;
  current_interval: number;
  review_count: number;
  total_stages: number;
  created_date: string;
}
export interface QuizSubject {
  id: string;
  name: string;
  color: string;
  chapters: QuizChapter[];
  created_date: string;
}
export interface QuizChapter {
  id: string;
  name: string;
}
export interface QuizEntry {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  count: number;
  date: string;
  note?: string;
  tags?: string[];
  created_date: string;
}
export interface TimelineActivityEntry {
  id: string;
  activity_id: string;
  date: string;
  from_time: string;
  to_time: string;
  note?: string;
  created_date: string;
  slot_ids: string[];
  duration_seconds?: number;
  tags?: string[];
}
export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  folder?: string; // e.g. "all", "work", "personal", "study"
  is_pinned?: boolean;
  is_bold?: boolean;
  created_date: string;
  updated_at: number;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
function getToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
function getStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("focusflow-data-changed", { detail: { key } }));
  }
}

const TASKS_KEY = "focusflow_tasks";
export const TaskStore = {
  list(): Task[] {
    return getStore<Task>(TASKS_KEY).sort(
      (a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    );
  },
  create(data: Omit<Task, "id" | "created_date">): Task {
    const task: Task = { ...data, id: generateId(), created_date: getToday() };
    const tasks = getStore<Task>(TASKS_KEY);
    tasks.unshift(task);
    setStore(TASKS_KEY, tasks);
    return task;
  },
  update(id: string, data: Partial<Task>): Task | null {
    const tasks = getStore<Task>(TASKS_KEY);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    setStore(TASKS_KEY, tasks);
    return tasks[idx];
  },
  delete(id: string): void {
    const tasks = getStore<Task>(TASKS_KEY).filter((t) => t.id !== id);
    setStore(TASKS_KEY, tasks);
  },
};

const RECURRING_KEY = "focusflow_recurring_activities";
export const RecurringActivityStore = {
  list(): RecurringActivity[] {
    return getStore<RecurringActivity>(RECURRING_KEY).sort(
      (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
    );
  },
  create(data: Omit<RecurringActivity, "id" | "created_date">): RecurringActivity {
    const item: RecurringActivity = { ...data, id: generateId(), created_date: getToday() };
    const list = getStore<RecurringActivity>(RECURRING_KEY);
    list.push(item);
    setStore(RECURRING_KEY, list);
    return item;
  },
  update(id: string, data: Partial<RecurringActivity>): RecurringActivity | null {
    const list = getStore<RecurringActivity>(RECURRING_KEY);
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    setStore(RECURRING_KEY, list);
    return list[idx];
  },
  delete(id: string): void {
    const list = getStore<RecurringActivity>(RECURRING_KEY).filter((r) => r.id !== id);
    setStore(RECURRING_KEY, list);
  },
  addTag(activityId: string, tag: string): RecurringActivity | null {
    const list = getStore<RecurringActivity>(RECURRING_KEY);
    const idx = list.findIndex((r) => r.id === activityId);
    if (idx === -1) return null;
    const existingTags = list[idx].tags ?? [];
    if (!existingTags.includes(tag)) {
      list[idx].tags = [...existingTags, tag];
      setStore(RECURRING_KEY, list);
    }
    return list[idx];
  },
  removeTag(activityId: string, tag: string): RecurringActivity | null {
    const list = getStore<RecurringActivity>(RECURRING_KEY);
    const idx = list.findIndex((r) => r.id === activityId);
    if (idx === -1) return null;
    const existingTags = list[idx].tags ?? [];
    list[idx].tags = existingTags.filter((t) => t !== tag);
    setStore(RECURRING_KEY, list);
    return list[idx];
  },
};

export function calculateHabitStreak(completedDates: string[]): { streakCount: number; lastCompletedDate: string } {
  if (!completedDates || completedDates.length === 0) {
    return { streakCount: 0, lastCompletedDate: "" };
  }
  const set = new Set(completedDates);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  const getPrevDate = (dateStr: string, offset: number): string => {
    const parts = dateStr.split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  let streak = 0;
  let cursor = today;
  
  if (!set.has(today)) {
    const yesterday = getPrevDate(today, -1);
    if (set.has(yesterday)) {
      cursor = yesterday;
    } else {
      let maxDate = "";
      completedDates.forEach((d) => {
        if (d > maxDate) maxDate = d;
      });
      return { streakCount: 0, lastCompletedDate: maxDate };
    }
  }

  while (set.has(cursor)) {
    streak++;
    cursor = getPrevDate(cursor, -1);
  }

  let lastCompletedDate = "";
  if (set.has(today)) {
    lastCompletedDate = today;
  } else {
    const yesterday = getPrevDate(today, -1);
    if (set.has(yesterday)) {
      lastCompletedDate = yesterday;
    } else {
      let maxDate = "";
      completedDates.forEach((d) => {
        if (d > maxDate) maxDate = d;
      });
      lastCompletedDate = maxDate;
    }
  }

  return { streakCount: streak, lastCompletedDate };
}

const HABITS_KEY = "focusflow_habits";
export const HabitStore = {
  list(): Habit[] {
    let list = getStore<Habit>(HABITS_KEY);
    const hasSystemHabit = list.some((h) => h.id === "system-habit-stay-in-study");
    if (!hasSystemHabit) {
      const systemHabit: Habit = {
        id: "system-habit-stay-in-study",
        name: "ماندن در محیط درس",
        color: "#6366f1",
        completed_dates: [],
        created_date: "2026-01-01",
        streakCount: 0,
        lastCompletedDate: "",
        is_pinned: true,
      };
      list.push(systemHabit);
      setStore(HABITS_KEY, list);
    }

    let changed = false;
    const updatedList = list.map((habit) => {
      if (habit.id === "system-habit-stay-in-study" && (!habit.is_pinned || habit.name !== "ماندن در محیط درس")) {
        habit.is_pinned = true;
        habit.name = "ماندن در محیط درس";
        changed = true;
      }
      const { streakCount, lastCompletedDate } = calculateHabitStreak(habit.completed_dates || []);
      if (habit.streakCount !== streakCount || habit.lastCompletedDate !== lastCompletedDate) {
        changed = true;
        return { ...habit, streakCount, lastCompletedDate };
      }
      return habit;
    });

    if (changed) {
      setStore(HABITS_KEY, updatedList);
    }

    return updatedList.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });
  },
  saveAll(list: Habit[]): void {
    setStore(HABITS_KEY, list);
  },
  create(data: Omit<Habit, "id" | "created_date">): Habit {
    const habit: Habit = { 
      ...data, 
      id: generateId(), 
      created_date: getToday(),
      streakCount: 0,
      lastCompletedDate: ""
    };
    const habits = getStore<Habit>(HABITS_KEY);
    habits.unshift(habit);
    setStore(HABITS_KEY, habits);
    return habit;
  },
  update(id: string, data: Partial<Habit>): Habit | null {
    const habits = getStore<Habit>(HABITS_KEY);
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    habits[idx] = { ...habits[idx], ...data };
    setStore(HABITS_KEY, habits);
    return habits[idx];
  },
  delete(id: string): void {
    if (id === "system-habit-stay-in-study") return;
    const habits = getStore<Habit>(HABITS_KEY).filter((h) => h.id !== id);
    setStore(HABITS_KEY, habits);
  },
};

const HABIT_GROUPS_KEY = "focusflow_habit_groups";
export const HabitGroupStore = {
  list(): HabitGroup[] {
    return getStore<HabitGroup>(HABIT_GROUPS_KEY).sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
    });
  },
  saveAll(list: HabitGroup[]): void {
    setStore(HABIT_GROUPS_KEY, list);
  },
  create(data: Omit<HabitGroup, "id" | "created_date">): HabitGroup {
    const group: HabitGroup = {
      ...data,
      id: generateId(),
      created_date: getToday(),
    };
    const groups = getStore<HabitGroup>(HABIT_GROUPS_KEY);
    groups.push(group);
    setStore(HABIT_GROUPS_KEY, groups);
    return group;
  },
  update(id: string, data: Partial<HabitGroup>): HabitGroup | null {
    const groups = getStore<HabitGroup>(HABIT_GROUPS_KEY);
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], ...data };
    setStore(HABIT_GROUPS_KEY, groups);
    return groups[idx];
  },
  delete(id: string): void {
    const groups = getStore<HabitGroup>(HABIT_GROUPS_KEY).filter((g) => g.id !== id);
    setStore(HABIT_GROUPS_KEY, groups);

    const habits = getStore<Habit>(HABITS_KEY);
    const updatedHabits = habits.map((h) => {
      if (h.group_id === id) {
        return { ...h, group_id: null };
      }
      return h;
    });
    setStore(HABITS_KEY, updatedHabits);
  }
};

const TOPICS_KEY = "focusflow_topics";
export const TopicStore = {
  list(): StudyTopic[] {
    return getStore<StudyTopic>(TOPICS_KEY).sort((a, b) => {
      const ad = a.next_review_date || "9999-12-31";
      const bd = b.next_review_date || "9999-12-31";
      return ad.localeCompare(bd);
    });
  },
  create(data: Omit<StudyTopic, "id" | "created_date">): StudyTopic {
    const topic: StudyTopic = { ...data, id: generateId(), created_date: getToday() };
    const topics = getStore<StudyTopic>(TOPICS_KEY);
    topics.push(topic);
    setStore(TOPICS_KEY, topics);
    return topic;
  },
  update(id: string, data: Partial<StudyTopic>): StudyTopic | null {
    const topics = getStore<StudyTopic>(TOPICS_KEY);
    const idx = topics.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    topics[idx] = { ...topics[idx], ...data };
    setStore(TOPICS_KEY, topics);
    return topics[idx];
  },
  delete(id: string): void {
    const topics = getStore<StudyTopic>(TOPICS_KEY).filter((t) => t.id !== id);
    setStore(TOPICS_KEY, topics);
  },
};

const QUIZ_SUBJECTS_KEY = "focusflow_quiz_subjects";
export const QuizSubjectStore = {
  list(): QuizSubject[] {
    return getStore<QuizSubject>(QUIZ_SUBJECTS_KEY).sort(
      (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
    );
  },
  create(data: Omit<QuizSubject, "id" | "created_date">): QuizSubject {
    const subject: QuizSubject = { ...data, id: generateId(), created_date: getToday() };
    const subjects = getStore<QuizSubject>(QUIZ_SUBJECTS_KEY);
    subjects.push(subject);
    setStore(QUIZ_SUBJECTS_KEY, subjects);
    return subject;
  },
  update(id: string, data: Partial<QuizSubject>): QuizSubject | null {
    const subjects = getStore<QuizSubject>(QUIZ_SUBJECTS_KEY);
    const idx = subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    subjects[idx] = { ...subjects[idx], ...data };
    setStore(QUIZ_SUBJECTS_KEY, subjects);
    return subjects[idx];
  },
  delete(id: string): void {
    const subjects = getStore<QuizSubject>(QUIZ_SUBJECTS_KEY).filter((s) => s.id !== id);
    setStore(QUIZ_SUBJECTS_KEY, subjects);
  },
  addChapter(subjectId: string, chapterName: string): QuizSubject | null {
    const subjects = getStore<QuizSubject>(QUIZ_SUBJECTS_KEY);
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return null;
    const chapter: QuizChapter = { id: generateId(), name: chapterName };
    subjects[idx].chapters.push(chapter);
    setStore(QUIZ_SUBJECTS_KEY, subjects);
    return subjects[idx];
  },
  removeChapter(subjectId: string, chapterId: string): QuizSubject | null {
    const subjects = getStore<QuizSubject>(QUIZ_SUBJECTS_KEY);
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return null;
    subjects[idx].chapters = subjects[idx].chapters.filter((c) => c.id !== chapterId);
    setStore(QUIZ_SUBJECTS_KEY, subjects);
    return subjects[idx];
  },
};

const QUIZ_ENTRIES_KEY = "focusflow_quiz_entries";
export const QuizEntryStore = {
  list(): QuizEntry[] {
    return getStore<QuizEntry>(QUIZ_ENTRIES_KEY).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  },
  listByDate(date: string): QuizEntry[] {
    return getStore<QuizEntry>(QUIZ_ENTRIES_KEY)
      .filter((e) => e.date === date)
      .sort((a, b) => b.created_date.localeCompare(a.created_date));
  },
  listByRange(from: string, to: string): QuizEntry[] {
    return getStore<QuizEntry>(QUIZ_ENTRIES_KEY)
      .filter((e) => e.date >= from && e.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  create(data: Omit<QuizEntry, "id" | "created_date">): QuizEntry {
    const entry: QuizEntry = { ...data, id: generateId(), created_date: getToday() };
    const entries = getStore<QuizEntry>(QUIZ_ENTRIES_KEY);
    entries.push(entry);
    setStore(QUIZ_ENTRIES_KEY, entries);
    return entry;
  },
  delete(id: string): void {
    const entries = getStore<QuizEntry>(QUIZ_ENTRIES_KEY).filter((e) => e.id !== id);
    setStore(QUIZ_ENTRIES_KEY, entries);
  },
};

const TIMELINE_ENTRIES_KEY = "focusflow_timeline_entries";
export const TimelineEntryStore = {
  list(): TimelineActivityEntry[] {
    return getStore<TimelineActivityEntry>(TIMELINE_ENTRIES_KEY);
  },
  listByDate(date: string): TimelineActivityEntry[] {
    return getStore<TimelineActivityEntry>(TIMELINE_ENTRIES_KEY).filter((e) => e.date === date);
  },
  listByRange(from: string, to: string): TimelineActivityEntry[] {
    return getStore<TimelineActivityEntry>(TIMELINE_ENTRIES_KEY).filter(
      (e) => e.date >= from && e.date <= to
    );
  },
  create(data: Omit<TimelineActivityEntry, "id" | "created_date">): TimelineActivityEntry {
    const entry: TimelineActivityEntry = { ...data, id: generateId(), created_date: getToday() };
    const list = getStore<TimelineActivityEntry>(TIMELINE_ENTRIES_KEY);
    list.push(entry);
    setStore(TIMELINE_ENTRIES_KEY, list);
    return entry;
  },
  delete(id: string): void {
    const list = getStore<TimelineActivityEntry>(TIMELINE_ENTRIES_KEY).filter((e) => e.id !== id);
    setStore(TIMELINE_ENTRIES_KEY, list);
  },
};

const NOTES_KEY = "focusflow_notes";
export const NoteStore = {
  list(): Note[] {
    return getStore<Note>(NOTES_KEY).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.updated_at - a.updated_at;
    });
  },
  create(data: Omit<Note, "id" | "created_date" | "updated_at">): Note {
    const note: Note = {
      ...data,
      id: generateId(),
      created_date: getToday(),
      updated_at: Date.now()
    };
    const list = getStore<Note>(NOTES_KEY);
    list.unshift(note);
    setStore(NOTES_KEY, list);
    return note;
  },
  update(id: string, data: Partial<Note>): Note | null {
    const list = getStore<Note>(NOTES_KEY);
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updated_at: Date.now() };
    setStore(NOTES_KEY, list);
    return list[idx];
  },
  delete(id: string): void {
    const list = getStore<Note>(NOTES_KEY).filter((n) => n.id !== id);
    setStore(NOTES_KEY, list);
  }
};

export interface BitterMemory {
  id: string;
  title: string;
  description: string;
  is_pinned: boolean;
  created_at: number;
}

const MEMORIES_KEY = "focusflow_memories";
const KONKUR_DATE_KEY = "focusflow_konkur_date";
const FINAL_EXAMS_DATE_KEY = "focusflow_final_exams_date";

export const MotivationStore = {
  getMemories(): BitterMemory[] {
    const memories = getStore<BitterMemory>(MEMORIES_KEY);
    return memories.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.created_at - a.created_at;
    });
  },
  
  addMemory(title: string, description: string): BitterMemory {
    const memory: BitterMemory = {
      id: generateId(),
      title,
      description,
      is_pinned: false,
      created_at: Date.now()
    };
    const list = getStore<BitterMemory>(MEMORIES_KEY);
    list.unshift(memory);
    setStore(MEMORIES_KEY, list);
    return memory;
  },
  
  deleteMemory(id: string): void {
    const list = getStore<BitterMemory>(MEMORIES_KEY).filter((m) => m.id !== id);
    setStore(MEMORIES_KEY, list);
  },
  
  togglePinMemory(id: string): void {
    const list = getStore<BitterMemory>(MEMORIES_KEY);
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx].is_pinned = !list[idx].is_pinned;
      setStore(MEMORIES_KEY, list);
    }
  },
  
  getKonkurDate(): string {
    return localStorage.getItem(KONKUR_DATE_KEY) || "2027-06-25";
  },
  
  setKonkurDate(date: string): void {
    localStorage.setItem(KONKUR_DATE_KEY, date);
    window.dispatchEvent(new CustomEvent("motivation-updated"));
  },
  
  getFinalExamsDate(): string {
    return localStorage.getItem(FINAL_EXAMS_DATE_KEY) || "2027-05-20";
  },
  
  setFinalExamsDate(date: string): void {
    localStorage.setItem(FINAL_EXAMS_DATE_KEY, date);
    window.dispatchEvent(new CustomEvent("motivation-updated"));
  }
};

export const BACKUP_KEYS = [
  "focusflow_tasks",
  "focusflow_recurring_activities",
  "focusflow_habits",
  "focusflow_habit_groups",
  "focusflow_topics",
  "focusflow_quiz_subjects",
  "focusflow_quiz_entries",
  "focusflow_timeline_entries",
  "focusflow_notes",
  "focusflow_memories",
  "focusflow_going_up_settings",
  "focusflow_going_up_state",
  "focusflow_going_up_evaluated_days"
];

export function exportDatabase(): string {
  const data: Record<string, any> = {};
  BACKUP_KEYS.forEach((key) => {
    try {
      const val = localStorage.getItem(key);
      if (val) {
        data[key] = JSON.parse(val);
      } else {
        data[key] = (key === "focusflow_going_up_settings" || key === "focusflow_going_up_state") ? {} : [];
      }
    } catch {
      data[key] = (key === "focusflow_going_up_settings" || key === "focusflow_going_up_state") ? {} : [];
    }
  });
  data["focusflow_konkur_date"] = localStorage.getItem("focusflow_konkur_date") || "2027-06-25";
  data["focusflow_final_exams_date"] = localStorage.getItem("focusflow_final_exams_date") || "2027-05-20";
  return JSON.stringify(data, null, 2);
}

export function importDatabase(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null) return false;
    
    BACKUP_KEYS.forEach((key) => {
      if (parsed[key] !== undefined) {
        if (Array.isArray(parsed[key]) || typeof parsed[key] === "object") {
          localStorage.setItem(key, JSON.stringify(parsed[key]));
        }
      }
    });
    if (parsed["focusflow_konkur_date"]) {
      localStorage.setItem("focusflow_konkur_date", parsed["focusflow_konkur_date"]);
    }
    if (parsed["focusflow_final_exams_date"]) {
      localStorage.setItem("focusflow_final_exams_date", parsed["focusflow_final_exams_date"]);
    }
    return true;
  } catch {
    return false;
  }
}

export function confirmAndDelete(title: string, onConfirm: () => void) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("request-delete", {
      detail: { title, onConfirm }
    }));
  } else {
    onConfirm();
  }
}

