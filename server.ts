import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // تنظیم پوشه ذخیره‌سازی اطلاعات
  const SAVE_DIR = path.join(process.cwd(), "save");
  const DB_FILE = path.join(SAVE_DIR, "db.json");

  // پشتیبانی از بادی‌های بزرگ برای هماهنگ‌سازی کامل دیتابیس کلاینت
  app.use(express.json({ limit: "50mb" }));

  // اطمینان از وجود پوشه save
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }

  // ۱. متد دریافت کل دیتابیس از فایل محلی روی لپ‌تاپ (GET)
  app.get("/api/db", (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        // اگر فایل هنوز ساخته نشده دیتابیس پیش‌فرض خالی ارسال می‌شود
        return res.json({ data: {}, lastUpdated: 0 });
      }
      
      const stats = fs.statSync(DB_FILE);
      const rawData = fs.readFileSync(DB_FILE, "utf-8");
      
      let data = {};
      try {
        if (rawData.trim()) {
          data = JSON.parse(rawData);
        }
      } catch (parseError) {
        console.error("خرابی در فایل db.json شناسایی شد. بک‌آپ تهیه شده و دیتابیس بازیابی می‌شود:", parseError);
        const corruptFile = path.join(SAVE_DIR, `db.corrupt.${Date.now()}.json`);
        fs.writeFileSync(corruptFile, rawData, "utf-8");
        // فایل خراب را حذف می‌کنیم تا کلاینت مجدداً بازنویسی کند
        fs.unlinkSync(DB_FILE);
        return res.json({ data: {}, lastUpdated: 0 });
      }
      
      res.json({
        data,
        lastUpdated: stats.mtimeMs
      });
    } catch (error) {
      console.error("Error reading db.json:", error);
      res.status(500).json({ error: "خطا در خواندن فایل پایگاه داده روی سرور لپ‌تاپ" });
    }
  });

  // ۲. متد ذخیره کردن و بروزرسانی دیتابیس در فایل لپ‌تاپ (POST)
  app.post("/api/db", (req, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "فرمت اطلاعات فرستاده شده معتبر نیست" });
      }

      // ذخیره‌سازی ایمن و اتمیک با فایل موقت و تغییر نام برای جلوگیری از خرابی داده در زمان قطعی برق یا کرش
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
      
      const stats = fs.statSync(DB_FILE);
      res.json({
        success: true,
        lastUpdated: stats.mtimeMs
      });
    } catch (error) {
      console.error("Error writing db.json:", error);
      res.status(500).json({ error: "خطا در نوشتن و ذخیره‌سازی اطلاعات روی لپ‌تاپ" });
    }
  });

  // ادغام هماهنگ با Vite برای سرو کلاینت در توسعه و محصول نهایی
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    // پیدا کردن آی‌پی‌های شبکه محلی برای نمایش لینک‌های کلیک‌شدنی
    const networkInterfaces = os.networkInterfaces();
    const networkLinks: string[] = [];

    for (const interfaceName of Object.keys(networkInterfaces)) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          // فیلتر کردن آی‌پی‌های نسخه ۴ که داخلی (Loopback) نیستند
          if (iface.family === "IPv4" && !iface.internal) {
            networkLinks.push(`http://${iface.address}:${PORT}`);
          }
        }
      }
    }

    console.log(`\n  🚀  سرور FocusFlow با موفقیت اجرا شد!\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    
    if (networkLinks.length > 0) {
      networkLinks.forEach((link) => {
        console.log(`  ➜  Network: ${link}/`);
      });
    } else {
      console.log(`  ➜  Network: [آی‌پی شبکه‌ای یافت نشد. مطمئن شوید به وای‌فای متصل هستید]`);
    }
    
    console.log(`  ➜  Database: ${DB_FILE}\n`);
    console.log(`  [نکته: با زدن آدرس‌های بالا در گوشی خود می‌توانید برنامه را مستقیماً هماهنگ کنید]`);
    console.log(`--------------------------------------------------`);
  });
}

startServer();
