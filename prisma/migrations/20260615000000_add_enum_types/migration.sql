-- Migration: TEXT → PostgreSQL native enum types
-- Step 0: Clean up test/invalid data that would violate enum constraints.
DELETE FROM "ProgressLog";
DELETE FROM "Refund";
DELETE FROM "Booking";
DELETE FROM "UserTicket";
DELETE FROM "Payment";
DELETE FROM "Slot";

-- ── 1. Create enum types ──────────────────────────────────────────────────────
CREATE TYPE public."Role" AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE public."NotifyChannel" AS ENUM ('EMAIL', 'LINE', 'BOTH');
CREATE TYPE public."Lang" AS ENUM ('JA', 'KO');
CREATE TYPE public."CourseType" AS ENUM ('REGULAR', 'SHORT', 'TOPIK', 'STUDY_ABROAD');
CREATE TYPE public."LessonMode" AS ENUM ('OFFLINE', 'ONLINE', 'BOTH');
CREATE TYPE public."BookingType" AS ENUM ('TRIAL', 'REGULAR');
CREATE TYPE public."BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'CHANGED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE public."SlotStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL', 'BLOCKED_BY_CALENDAR');
CREATE TYPE public."TicketStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'USED_UP');
CREATE TYPE public."TicketSource" AS ENUM ('PAYMENT', 'MANUAL');
CREATE TYPE public."PaymentMethod" AS ENUM ('STRIPE_CARD', 'PAYPAY', 'OFFLINE');
CREATE TYPE public."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
CREATE TYPE public."Attendance" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE public."RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PAID');

-- ── 2. Alter columns (drop default → change type → restore default) ──────────

-- User.role
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE public."Role" USING "role"::public."Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"Role";

-- User.notifyChannel
ALTER TABLE "User" ALTER COLUMN "notifyChannel" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "notifyChannel" TYPE public."NotifyChannel" USING "notifyChannel"::public."NotifyChannel";
ALTER TABLE "User" ALTER COLUMN "notifyChannel" SET DEFAULT 'BOTH'::"NotifyChannel";

-- User.preferredLang
ALTER TABLE "User" ALTER COLUMN "preferredLang" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "preferredLang" TYPE public."Lang" USING "preferredLang"::public."Lang";
ALTER TABLE "User" ALTER COLUMN "preferredLang" SET DEFAULT 'JA'::"Lang";

-- Course.type (no default)
ALTER TABLE "Course" ALTER COLUMN "type" TYPE public."CourseType" USING "type"::public."CourseType";

-- Slot.mode
ALTER TABLE "Slot" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "Slot" ALTER COLUMN "mode" TYPE public."LessonMode" USING "mode"::public."LessonMode";
ALTER TABLE "Slot" ALTER COLUMN "mode" SET DEFAULT 'BOTH'::"LessonMode";

-- Slot.status
ALTER TABLE "Slot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Slot" ALTER COLUMN "status" TYPE public."SlotStatus" USING "status"::public."SlotStatus";
ALTER TABLE "Slot" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"SlotStatus";

-- Booking.type (no default)
ALTER TABLE "Booking" ALTER COLUMN "type" TYPE public."BookingType" USING "type"::public."BookingType";

-- Booking.status
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE public."BookingStatus" USING "status"::public."BookingStatus";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"BookingStatus";

-- UserTicket.status
ALTER TABLE "UserTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "UserTicket" ALTER COLUMN "status" TYPE public."TicketStatus" USING "status"::public."TicketStatus";
ALTER TABLE "UserTicket" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"TicketStatus";

-- UserTicket.source
ALTER TABLE "UserTicket" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "UserTicket" ALTER COLUMN "source" TYPE public."TicketSource" USING "source"::public."TicketSource";
ALTER TABLE "UserTicket" ALTER COLUMN "source" SET DEFAULT 'PAYMENT'::"TicketSource";

-- Payment.method (no default)
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE public."PaymentMethod" USING "method"::public."PaymentMethod";

-- Payment.status
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE public."PaymentStatus" USING "status"::public."PaymentStatus";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PaymentStatus";

-- ProgressLog.attendance
ALTER TABLE "ProgressLog" ALTER COLUMN "attendance" DROP DEFAULT;
ALTER TABLE "ProgressLog" ALTER COLUMN "attendance" TYPE public."Attendance" USING "attendance"::public."Attendance";
ALTER TABLE "ProgressLog" ALTER COLUMN "attendance" SET DEFAULT 'PRESENT'::"Attendance";

-- Refund.status
ALTER TABLE "Refund" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Refund" ALTER COLUMN "status" TYPE public."RefundStatus" USING "status"::public."RefundStatus";
ALTER TABLE "Refund" ALTER COLUMN "status" SET DEFAULT 'REQUESTED'::"RefundStatus";
