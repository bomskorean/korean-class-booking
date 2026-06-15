import { PrismaClient } from "@prisma/client";
import { PACKAGES, COURSES } from "../lib/pricing";

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
      create: { id: c.type, type: c.type, titleJa: c.titleJa, titleKo: c.titleKo, description: c.description, level: c.level, isActive: true },
    });
    console.log(`  ✓ Course: ${c.titleJa}`);
  }

  // ── チケット商品（旧データをクリアして再作成） ────────────────────────────
  console.log("Clearing old ticket data...");
  await prisma.userTicket.deleteMany({});
  await prisma.ticketPackage.deleteMany({});

  console.log("Seeding ticket packages (12 = 4 courses × 4/8/12)...");
  for (const pkg of PACKAGES) {
    const id = `pkg_${pkg.courseId}_${pkg.count}`;
    await prisma.ticketPackage.create({
      data: {
        id,
        name:           `${pkg.courseName} ${pkg.name}`,
        totalCount:     pkg.count,
        price:          pkg.price,
        unitPrice:      pkg.unitPrice,
        listPrice:      4000,
        validMonths:    pkg.validMonths,
        validFromBasis: "first_lesson",
        courseScope:    pkg.courseId,
      },
    });
    console.log(`  ✓ ${pkg.courseName} ${pkg.name} — ¥${pkg.price.toLocaleString()} (¥${pkg.unitPrice}/回, ${pkg.validMonths}か月)`);
  }

  // ── 開発用テスト学生 ─────────────────────────────────────────────────────────
  console.log("Seeding dev test students...");
  const devStudents = [
    { name: "田中 さくら",              email: "sakura@dev.local", pkgId: "pkg_REGULAR_4",      remaining: 4, validFrom: null },
    { name: "鈴木 一郎",                email: "ichiro@dev.local", pkgId: "pkg_SHORT_8",         remaining: 2,
      validFrom: new Date(Date.now() - 30 * 86_400_000) },
    { name: "山田 花子",                email: "hanako@dev.local", pkgId: "pkg_TOPIK_12",        remaining: 8, validFrom: null },
    { name: "佐藤 次郎（チケットなし）", email: "jiro@dev.local",   pkgId: null,                  remaining: 0, validFrom: null },
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
        const ticketId = `devtix_${user.id}`;
        await prisma.userTicket.create({
          data: {
            id: ticketId,
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
    const courseLabel = COURSES.find(c => s.pkgId?.includes(c.courseId))?.courseName ?? "";
    console.log(`  ✓ Student: ${s.name} (${s.pkgId ? `${courseLabel} 残り${s.remaining}回` : "チケットなし"})`);
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
