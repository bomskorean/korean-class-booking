import { PrismaClient, LessonMode, SlotStatus } from "@prisma/client";
import { PACKAGES } from "../lib/pricing";

const prisma = new PrismaClient();

const COURSE_DEFS = [
  {
    type: "REGULAR",
    titleJa: "正規クラス（ハングルからコツコツ）",
    titleKo: "정규 클래스",
    description: "ハングル文字から始め、入門・初級・中級・上級まで段階的に学ぶコース。",
    level: "入門〜上級",
  },
  {
    type: "SHORT",
    titleJa: "短期コース（旅行・ドラマ・ファンミ韓国語）",
    titleKo: "단기 코스",
    description: "旅行、K-ドラマ、ファンミーティングなど目的別の会話中心コース。",
    level: "初級〜中級",
  },
  {
    type: "TOPIK",
    titleJa: "TOPIK 対策",
    titleKo: "TOPIK 준비",
    description: "TOPIK 各級に対応。模擬試験・過去問中心の対策コース。",
    level: "初級〜上級（級別）",
  },
  {
    type: "STUDY_ABROAD",
    titleJa: "留学準備（大学）",
    titleKo: "유학 준비",
    description: "韓国大学への留学を目指す方向け。面接・書類・アカデミック韓国語を学ぶ。",
    level: "中級〜上級",
  },
];

async function main() {
  // ── コース ────────────────────────────────────────────────────────────────────
  console.log("Seeding courses...");
  for (const c of COURSE_DEFS) {
    await prisma.course.upsert({
      where: { id: c.type },
      update: { titleJa: c.titleJa, titleKo: c.titleKo, description: c.description, level: c.level, isActive: true },
      create: { id: c.type, type: c.type as "REGULAR" | "SHORT" | "TOPIK" | "STUDY_ABROAD", titleJa: c.titleJa, titleKo: c.titleKo, description: c.description, level: c.level, isActive: true },
    });
    console.log(`  ✓ Course: ${c.titleJa}`);
  }

  // ── チケット商品（旧データをクリアして再作成） ────────────────────────────
  console.log("Clearing old ticket data (progress → bookings → tickets → packages)...");
  await prisma.progressLog.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.userTicket.deleteMany({});
  await prisma.ticketPackage.deleteMany({});

  console.log(`Seeding ticket packages (${PACKAGES.length} packages)...`);
  for (const pkg of PACKAGES) {
    const id = `pkg_${pkg.count}`;
    await prisma.ticketPackage.upsert({
      where: { id },
      update: {
        name:        pkg.name,
        totalCount:  pkg.count,
        price:       pkg.price,
        unitPrice:   pkg.unitPrice,
        listPrice:   4000,
        validMonths: pkg.validMonths,
      },
      create: {
        id,
        name:           pkg.name,
        totalCount:     pkg.count,
        price:          pkg.price,
        unitPrice:      pkg.unitPrice,
        listPrice:      4000,
        validMonths:    pkg.validMonths,
        validFromBasis: "first_lesson",
        courseScope:    null,
      },
    });
    console.log(`  ✓ ${pkg.name} — ¥${pkg.price.toLocaleString()} (¥${pkg.unitPrice}/回, ${pkg.validMonths}か月)`);
  }

  // ── 開発用テスト学生 ─────────────────────────────────────────────────────────
  console.log("Seeding dev test students...");
  const devStudents = [
    { name: "田中 さくら",                email: "sakura@dev.local", pkgId: "pkg_4",  remaining: 4, validFrom: null },
    { name: "鈴木 一郎",                  email: "ichiro@dev.local", pkgId: "pkg_8",  remaining: 2,
      validFrom: new Date(Date.now() - 30 * 86_400_000) },
    { name: "山田 花子",                  email: "hanako@dev.local", pkgId: "pkg_12", remaining: 8, validFrom: null },
    { name: "佐藤 次郎（チケットなし）",   email: "jiro@dev.local",   pkgId: null,     remaining: 0, validFrom: null },
  ];

  for (const s of devStudents) {
    const user = await prisma.user.upsert({
      where:  { email: s.email },
      update: { name: s.name },
      create: { name: s.name, email: s.email, role: "STUDENT" },
    });

    if (s.pkgId) {
      const pkg = await prisma.ticketPackage.findUnique({ where: { id: s.pkgId } });
      if (pkg) {
        const expiresAt = s.validFrom
          ? (() => { const d = new Date(s.validFrom); d.setMonth(d.getMonth() + pkg.validMonths); return d; })()
          : null;
        await prisma.userTicket.create({
          data: {
            id:             `devtix_${s.email.replace(/@.*/, "")}`,
            userId:         user.id,
            packageId:      s.pkgId,
            remainingCount: s.remaining,
            status:         "ACTIVE",
            source:         "MANUAL",
            validFrom:      s.validFrom ?? null,
            expiresAt,
          },
        });
      }
    }
    console.log(`  ✓ Student: ${s.name} (${s.pkgId ? `残り${s.remaining}回` : "チケットなし"})`);
  }

  // ── 予約可能スロット（今日から14日分） ──────────────────────────────────────
  console.log("Clearing old OPEN slots...");
  await prisma.slot.deleteMany({ where: { status: "OPEN" } });

  console.log("Seeding OPEN slots (14 days × 10:00-21:00 JST, 30-min grid, ONLINE+OFFLINE)...");
  const JST_OFFSET = 9 * 60 * 60_000;
  const now = new Date();
  const todayJst = new Date(now.getTime() + JST_OFFSET);
  todayJst.setUTCHours(0, 0, 0, 0);

  const slotData: {
    courseId: string; startAt: Date; displayEndAt: Date; blockEndAt: Date;
    displayDuration: number; blockDuration: number; mode: LessonMode; status: SlotStatus;
  }[] = [];

  for (let day = 0; day < 14; day++) {
    const dayJst = new Date(todayJst.getTime() + day * 86_400_000);
    const y  = dayJst.getUTCFullYear();
    const mo = dayJst.getUTCMonth();
    const d  = dayJst.getUTCDate();

    // 10:00〜20:30 JST（最終 blockEnd = 21:30 → 20:00 まで）
    for (let h = 10; h <= 20; h++) {
      for (const min of [0, 30]) {
        if (h === 20 && min === 30) continue; // blockEnd が 21:30 になるため除外
        const startAt      = new Date(Date.UTC(y, mo, d, h - 9, min, 0));
        const displayEndAt = new Date(startAt.getTime() + 50 * 60_000);
        const blockEndAt   = new Date(startAt.getTime() + 70 * 60_000); // 正規: 70分占有
        slotData.push({
          courseId:        "REGULAR",
          startAt,
          displayEndAt,
          blockEndAt,
          displayDuration: 50,
          blockDuration:   70,
          mode:            LessonMode.BOTH,
          status:          SlotStatus.OPEN,
        });
      }
    }
  }

  await prisma.slot.createMany({ data: slotData });
  console.log(`  ✓ Created ${slotData.length} OPEN slots (BOTH mode)`);

  // ── 最終確認 ──────────────────────────────────────────────────────────────────
  const [courseCount, pkgCount, studentCount, ticketCount, slotCount] = await Promise.all([
    prisma.course.count(),
    prisma.ticketPackage.count(),
    prisma.user.count(),
    prisma.userTicket.count(),
    prisma.slot.count({ where: { status: "OPEN" } }),
  ]);

  console.log("\n=== Seed summary ===");
  console.log(`  コース:       ${courseCount}`);
  console.log(`  チケット商品: ${pkgCount}`);
  console.log(`  学生:         ${studentCount}`);
  console.log(`  チケット:     ${ticketCount}`);
  console.log(`  スロット:     ${slotCount}`);
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
