-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "lineUserId" TEXT,
    "preferredLang" TEXT NOT NULL DEFAULT 'JA',
    "notifyChannel" TEXT NOT NULL DEFAULT 'BOTH',
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "lateCancelCount" INTEGER NOT NULL DEFAULT 0,
    "bookingRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "titleJa" TEXT NOT NULL,
    "titleKo" TEXT,
    "description" TEXT,
    "level" TEXT,
    "lessonCount" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "TicketPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "listPrice" INTEGER NOT NULL DEFAULT 4000,
    "validMonths" INTEGER NOT NULL,
    "validFromBasis" TEXT NOT NULL DEFAULT 'first_lesson',
    "courseScope" TEXT
);

-- CreateTable
CREATE TABLE "UserTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "remainingCount" INTEGER NOT NULL,
    "heldCount" INTEGER NOT NULL DEFAULT 0,
    "freeChangeUsed" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" DATETIME,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'PAYMENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserTicket_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TicketPackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "startAt" DATETIME NOT NULL,
    "displayEndAt" DATETIME NOT NULL,
    "blockEndAt" DATETIME NOT NULL,
    "displayDuration" INTEGER NOT NULL DEFAULT 50,
    "blockDuration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'BOTH',
    "location" TEXT,
    "onlineUrl" TEXT,
    "gcalEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Slot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "usedTicketId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_usedTicketId_fkey" FOREIGN KEY ("usedTicketId") REFERENCES "UserTicket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrialIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT,
    "userId" TEXT,
    "studyPeriod" TEXT NOT NULL,
    "motivations" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "textbooks" TEXT NOT NULL DEFAULT '[]',
    "selfLevel" TEXT,
    "preferredMode" TEXT,
    "goalText" TEXT,
    "referralSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrialIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "paidAt" DATETIME,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgressLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "attendance" TEXT NOT NULL DEFAULT 'PRESENT',
    "levelStage" TEXT,
    "teacherNote" TEXT,
    "homework" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgressLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "agreedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "pdfUrl" TEXT,
    CONSTRAINT "Agreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userTicketId" TEXT,
    "usedCount" INTEGER NOT NULL,
    "settledAmount" INTEGER NOT NULL,
    "cancelFee" INTEGER NOT NULL DEFAULT 0,
    "transferFee" INTEGER NOT NULL DEFAULT 0,
    "refundAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "processedAt" DATETIME,
    CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineUserId_key" ON "User"("lineUserId");
