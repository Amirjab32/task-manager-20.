/**
 * سیستم هماهنگ‌سازی خودکار دیتابیس با لپ‌تاپ (Vite/Express Backend)
 * این سیستم به کلاینت‌ها (گوشی یا لپ‌تاپ) اجازه می‌دهد اطلاعات را روی فایل فیزیکی ذخیره کرده
 * و در شبکه محلی همگام‌سازی نمایند.
 */
import { exportDatabase, importDatabase } from "./store";

// تعریف انواع وضعیت هماهنگی
export type SyncStatus = "connected" | "syncing" | "offline" | "idle";

// رویداد هماهنگی سراسری کلاینت برای مطلع ساختن کامپوننت‌های فرانت‌اند
export const SYNC_EVENT = "focusflow-db-synced";
export const SYNC_STATUS_EVENT = "focusflow-sync-status-changed";

class SyncManager {
  private lastSyncedMtime: number = 0;
  private isPushing: boolean = false;
  private pendingPushTimeout: NodeJS.Timeout | null = null;
  private pollIntervalId: NodeJS.Timeout | null = null;
  private currentStatus: SyncStatus = "idle";
  private hasUnsavedLocalChanges: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // لود کردن آخرین مهر زمانی هماهنگ شده از localStorage
      const cachedTime = localStorage.getItem("focusflow_last_synced_mtime");
      if (cachedTime) {
        this.lastSyncedMtime = parseFloat(cachedTime);
      }

      // شنود تغییرات دیتابیس محلی برای ارسال سریع به سرور (Push)
      window.addEventListener("focusflow-data-changed", () => {
        this.hasUnsavedLocalChanges = true;
        this.setStatus("syncing");
        this.schedulePush();
      });

      // شروع همگام‌سازی دوره‌ای و خودکار در پس‌زمینه
      this.startPolling();
    }
  }

  // تغییر وضعیت اتصال و اطلاع‌رسانی به کامپوننت‌ها
  private setStatus(status: SyncStatus) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: status }));
    }
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  // فرستادن اطلاعات محلی به سرور با تکنیک Debounce برای بهینه‌سازی ترافیک شبکه
  private schedulePush() {
    if (this.pendingPushTimeout) {
      clearTimeout(this.pendingPushTimeout);
    }

    this.pendingPushTimeout = setTimeout(async () => {
      await this.pushLocalToServer();
    }, 500); // ارسال با نیم ثانیه تاخیر جهت ادغام تغییرات پشت سر هم
  }

  // متد اصلی ارسال اطلاعات کلاینت به فایل لپ‌تاپ
  private async pushLocalToServer() {
    if (this.isPushing) return;
    this.isPushing = true;
    this.setStatus("syncing");

    try {
      const dataStr = exportDatabase();
      const parsedData = JSON.parse(dataStr);

      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: parsedData }),
      });

      if (response.ok) {
        const resBody = await response.json();
        if (resBody.success && resBody.lastUpdated) {
          this.lastSyncedMtime = resBody.lastUpdated;
          localStorage.setItem("focusflow_last_synced_mtime", this.lastSyncedMtime.toString());
          this.hasUnsavedLocalChanges = false;
          this.setStatus("connected");
        }
      } else {
        this.setStatus("offline");
      }
    } catch (err) {
      console.warn("Sync: Network is offline, saving locally first...", err);
      this.setStatus("offline");
    } finally {
      this.isPushing = false;
    }
  }

  // هماهنگ‌سازی دستی فوری (بکاپ سریع)
  public async forceSync() {
    this.setStatus("syncing");
    await this.pullFromServer();
    await this.pushLocalToServer();
  }

  // پاک کردن دیتابیس محلی و ارسال دیتابیس خالی به سرور جهت ریست همه دستگاه‌ها به صورت هماهنگ
  public async clearDatabaseAndSync() {
    this.setStatus("syncing");
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }

    // ۱. پاک کردن کامل دیتای محلی برنامه در مرورگر
    localStorage.clear();

    // ۲. صفر کردن مهر زمانی هماهنگ شده کلاینت
    this.lastSyncedMtime = 0;
    this.hasUnsavedLocalChanges = false;

    // ۳. ارسال سریع یک درخواست ریست به بک‌اند لپ‌تاپ تا فایل db.json هم خالی شود
    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: {} }), // دیتابیس کاملاً خالی
      });

      if (response.ok) {
        const resBody = await response.json();
        this.lastSyncedMtime = resBody.lastUpdated || Date.now();
        localStorage.setItem("focusflow_last_synced_mtime", this.lastSyncedMtime.toString());
      }
    } catch (err) {
      console.error("Failed to clear database on the laptop server:", err);
    }

    // ۴. بارگذاری مجدد صفحه برای شروع تمیز و تازه برنامه
    window.location.reload();
  }

  // متد دریافت اطلاعات از فایل دیتابیس لپ‌تاپ (Pull)
  private async pullFromServer(): Promise<boolean> {
    if (this.isPushing || this.hasUnsavedLocalChanges) return false;

    try {
      const response = await fetch("/api/db");
      if (!response.ok) {
        this.setStatus("offline");
        return false;
      }

      const resBody = await response.json();
      const serverMtime = resBody.lastUpdated || 0;

      // اگر فایل سرور جدیدتر از کلاینت باشد یا کلاینت هنوز خالی باشد
      if (serverMtime > this.lastSyncedMtime || this.lastSyncedMtime === 0) {
        if (resBody.data && Object.keys(resBody.data).length > 0) {
          const success = importDatabase(JSON.stringify(resBody.data));
          if (success) {
            this.lastSyncedMtime = serverMtime;
            localStorage.setItem("focusflow_last_synced_mtime", serverMtime.toString());
            
            // شلیک رویداد هماهنگی پایگاه داده جهت ریلود آنی کدهای فرانت‌اند
            window.dispatchEvent(new CustomEvent(SYNC_EVENT));
          }
        }
        this.setStatus("connected");
        return true;
      }
      
      this.setStatus("connected");
      return false;
    } catch (err) {
      this.setStatus("offline");
      return false;
    }
  }

  // شروع پایش مستمر هر ۲.۵ ثانیه برای هماهنگی ریل‌تایم بین گوشی و لپ‌تاپ
  private startPolling() {
    // ابتدا یک بار لود اولیه انجام شود
    this.pullFromServer();

    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }

    this.pollIntervalId = setInterval(async () => {
      // فقط زمانی پولینگ دریافت شود که کلاینت در حال تغییرات موضعی فوری نباشد
      if (!this.hasUnsavedLocalChanges && !this.isPushing) {
        await this.pullFromServer();
      }
    }, 2500);
  }

  // توقف همگام‌سازی در صورت لزوم
  public destroy() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    if (this.pendingPushTimeout) {
      clearTimeout(this.pendingPushTimeout);
    }
  }
}

// ایجاد و اکسپورت تک‌نمونه (Singleton) از مدیر هماهنگی
export const syncManager = new SyncManager();
