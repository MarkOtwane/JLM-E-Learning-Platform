# 🛠️ PRODUCTION REMEDIATION PLAN - PHASES 2-4

## JLM E-Learning Platform - Implementation Strategy (Continued)

**Created:** February 17, 2026  
**Phases:** 2-4 | Total: 77 hours  
**Version:** 1.0

---

# PHASE 2: PAYMENT & BUSINESS LOGIC STABILIZATION

## Duration: 3 weeks | 105 hours | Target: 72/100

### Overview

This phase fixes payment system, implements proper transaction handling, and stabilizes core business logic.

---

## PHASE 2 TASKS

### Task 2.1: Add Price Field to Course Schema

**Priority:** 🔴 CRITICAL | **Hours:** 3 | **Risk if Unfixed:** CRITICAL

#### Problem

All courses hardcoded at $1000, cannot have different pricing.

#### Database Migration

**1. Create Migration**

```bash
npx prisma migrate dev --name add_course_pricing
```

**2. Update `backend/prisma/schema.prisma`**

```prisma
model Course {
  id          String   @id @default(cuid())
  title       String
  description String
  level       String
  category    String
  duration    Int      // duration in minutes
  isPremium   Boolean  @default(false)
  price       Float    @default(0) // NEW: Price in dollars
  currency    String   @default("USD") // NEW: Currency code
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  instructor   User   @relation("InstructorCourses", fields: [instructorId], references: [id])
  instructorId String

  modules     Module[]
  enrollments Enrollment[]
  quizzes     Quiz[]
  payments    Payment[]
  certificates Certificate[]

  @@index([instructorId])
  @@index([category])
  @@index([level])
  @@index([price])  // NEW: For price range queries
  @@index([createdAt])
}
```

**3. Migration SQL** (generated):

```sql
ALTER TABLE "Course" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
CREATE INDEX "Course_price_idx" ON "Course"("price");
```

**4. Apply Migration**

```bash
npx prisma db push
```

#### Update `backend/src/courses/dto/create-course.dto.ts`

```typescript
import { IsNumber, Min, Max, IsOptional, IsString } from "class-validator";

export class CreateCourseDto {
	@IsString()
	@IsNotEmpty()
	title: string;

	@IsString()
	@IsNotEmpty()
	description: string;

	@IsEnum(CourseLevel)
	level: CourseLevel;

	@IsString()
	@IsNotEmpty()
	category: string;

	@IsInt()
	@Min(1)
	duration: number;

	@IsBoolean()
	@IsOptional()
	isPremium?: boolean;

	// NEW: Price field
	@IsNumber()
	@Min(0)
	@Max(10000) // Max $10,000 per course
	@IsOptional()
	price?: number = 0;

	// NEW: Currency (if supporting multiple)
	@IsString()
	@IsOptional()
	currency?: string = "USD";
}
```

#### Update DTOs for updates

```typescript
export class UpdateCourseDto {
	@IsString()
	@IsOptional()
	title?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsEnum(CourseLevel)
	@IsOptional()
	level?: CourseLevel;

	@IsString()
	@IsOptional()
	category?: string;

	@IsInt()
	@Min(1)
	@IsOptional()
	duration?: number;

	@IsBoolean()
	@IsOptional()
	isPremium?: boolean;

	// NEW
	@IsNumber()
	@Min(0)
	@Max(10000)
	@IsOptional()
	price?: number;

	@IsString()
	@IsOptional()
	currency?: string;
}
```

#### Files Modified:

- ✏️ `backend/prisma/schema.prisma`
- ✏️ `backend/src/courses/dto/create-course.dto.ts`
- ✏️ `backend/src/courses/dto/update-course.dto.ts`

#### Frontend Changes Required: ✅ YES

- Course creation form needs price input field
- Course display needs to show price

#### Database Migration Required: ✅ YES

```bash
npx prisma migrate dev --name add_course_pricing
```

#### Breaking Changes: ⚠️ NONE - field has default value

#### Testing:

```bash
# Create course with price
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced TypeScript",
    "description": "Master TypeScript",
    "level": "Advanced",
    "category": "Programming",
    "duration": 240,
    "isPremium": true,
    "price": 99.99,
    "currency": "USD"
  }'
```

#### Rollback Plan:

```bash
npx prisma migrate resolve --rolled-back add_course_pricing
npx prisma db push
```

---

### Task 2.2: Implement Stripe Webhook Handler

**Priority:** 🔴 CRITICAL | **Hours:** 8 | **Risk if Unfixed:** CRITICAL

#### Problem

Manual payment verification allows race conditions. Payment completed but enrollment not created.

#### Solution

Implement Stripe webhook to handle async payment confirmations.

#### Implementation

**1. Create `backend/src/payment/webhooks/stripe.webhook.ts`** (NEW FILE)

```typescript
import { BadRequestException, Injectable, RawBodyRequest, Controller, Post, Req, Logger } from "@nestjs/common";
import { Request } from "express";
import Stripe from "stripe";
import { Public } from "../../auth/decorators";
import { PaymentsService } from "../payment.service";

@Injectable()
@Controller("webhooks/stripe")
export class StripeWebhookController {
	private readonly logger = new Logger("StripeWebhook");
	private stripe: Stripe;

	constructor(private paymentsService: PaymentsService) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
			apiVersion: "2025-08-27.basil",
		});
	}

	@Public()
	@Post()
	async handleWebhook(@Req() request: RawBodyRequest<Request>): Promise<{ received: boolean }> {
		const sig = request.headers["stripe-signature"] as string;
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

		if (!webhookSecret) {
			throw new BadRequestException("Webhook secret not configured");
		}

		let event: Stripe.Event;

		try {
			// Verify signature
			event = this.stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
		} catch (error: any) {
			this.logger.error(`Webhook signature verification failed: ${error.message}`);
			throw new BadRequestException("Invalid signature");
		}

		try {
			// Handle different event types
			switch (event.type) {
				case "checkout.session.completed":
					await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
					break;

				case "payment_intent.succeeded":
					await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
					break;

				case "charge.refunded":
					await this.handleChargeRefunded(event.data.object as Stripe.Charge);
					break;

				default:
					this.logger.debug(`Unhandled event type: ${event.type}`);
			}
		} catch (error: any) {
			this.logger.error(`Error processing webhook: ${error.message}`);
			// Still return 200 to prevent Stripe retry
		}

		return { received: true };
	}

	private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
		this.logger.log(`Processing checkout session: ${session.id}`);

		const courseId = session.metadata?.courseId;
		const userId = session.metadata?.userId;

		if (!courseId || !userId) {
			this.logger.error("Missing courseId or userId in session metadata");
			return;
		}

		// Delegate to payment service for atomic transaction
		await this.paymentsService.processSuccessfulPayment(userId, courseId, session.id, (session.amount_total ?? 0) / 100, session.payment_status === "paid");
	}

	private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
		this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
		// Additional tracking if needed
	}

	private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
		this.logger.log(`Charge refunded: ${charge.id}`);
		// Handle refund logic
		if (charge.metadata?.paymentId) {
			await this.paymentsService.handleRefund(charge.metadata.paymentId);
		}
	}
}
```

**2. Update `backend/src/payment/payment.service.ts`**

```typescript
export class PaymentsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly stripe: StripeStrategy,
		private readonly mpesa: MpesaStrategy,
	) {}

	// NEW: Called by webhook after payment verified by Stripe
	async processSuccessfulPayment(userId: string, courseId: string, transactionId: string, amount: number, paid: boolean): Promise<void> {
		if (!paid) return;

		// Use Prisma transaction to ensure atomicity
		await this.prisma.$transaction(async (tx) => {
			// 1. Create payment record
			const payment = await tx.payment.create({
				data: {
					userId,
					courseId,
					amount,
					status: "completed",
					provider: "stripe",
					transactionId, // NEW: Store for reconciliation
				},
			});

			// 2. Check if already enrolled
			const existingEnrollment = await tx.enrollment.findFirst({
				where: { userId, courseId },
			});

			// 3. Create enrollment if not exists
			if (!existingEnrollment) {
				await tx.enrollment.create({
					data: { userId, courseId },
				});
			}

			return payment;
		});

		this.logger.log(`Payment processed: ${transactionId} for user ${userId}`);
	}

	// NEW: Handle refunds
	async handleRefund(paymentId: string): Promise<void> {
		const payment = await this.prisma.payment.findUnique({
			where: { id: paymentId },
		});

		if (!payment) return;

		// Update payment status
		await this.prisma.payment.update({
			where: { id: paymentId },
			data: { status: "refunded" },
		});

		// Optionally remove enrollment
		// await this.prisma.enrollment.deleteMany({
		//   where: { userId: payment.userId, courseId: payment.courseId },
		// });

		this.logger.log(`Refund processed for payment: ${paymentId}`);
	}

	// MODIFIED: Update initiatePayment to include webhook-friendly metadata
	async initiatePayment(studentId: string, dto: InitiatePaymentDto) {
		const course = await this.prisma.course.findUnique({
			where: { id: dto.courseId },
		});

		if (!course) throw new NotFoundException("Course not found");
		if (!course.isPremium) {
			throw new BadRequestException("Course is free, no payment required");
		}

		const alreadyEnrolled = await this.prisma.enrollment.findFirst({
			where: { userId: studentId, courseId: dto.courseId },
		});

		if (alreadyEnrolled) {
			throw new ForbiddenException("Already enrolled in this course");
		}

		// NEW: Use course price if available
		const amount = course.price || 100; // Fallback to 100 if not set

		if (dto.provider === PaymentProvider.STRIPE) {
			return this.stripe.createCheckoutSession(
				dto.phoneOrEmail,
				dto.courseId,
				amount,
				studentId, // NEW: Pass userId for webhook metadata
			);
		} else if (dto.provider === PaymentProvider.MPESA) {
			return this.mpesa.initiateStkPush(dto.phoneOrEmail, dto.courseId, amount);
		}

		throw new BadRequestException("Unsupported payment provider");
	}
}
```

**3. Update `backend/src/payment/strategies/stripe.strategy.ts`**

```typescript
export class StripeStrategy {
	private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
		apiVersion: "2025-08-27.basil",
	});

	// MODIFIED: Add userId parameter
	async createCheckoutSession(
		email: string,
		courseId: string,
		amount: number,
		userId?: string, // NEW
	) {
		const session = await this.stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			customer_email: email,
			line_items: [
				{
					price_data: {
						currency: "usd",
						unit_amount: amount * 100,
						product_data: {
							name: `Course: ${courseId}`,
						},
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
			// NEW: Include metadata for webhook processing
			metadata: {
				courseId,
				userId: userId || "unknown", // Will be set by webhook
			},
		});

		return {
			sessionId: session.id,
			paymentUrl: session.url,
			status: PaymentStatus.PENDING,
		};
	}
}
```

**4. Register Webhook Module in `backend/src/app.module.ts`**

```typescript
import { StripeWebhookController } from "./payment/webhooks/stripe.webhook";

@Module({
	imports: [
		// ... existing imports
	],
	controllers: [
		// ... existing controllers
		StripeWebhookController, // NEW
	],
})
export class AppModule {}
```

**5. Update `backend/src/main.ts`** to handle raw body for webhook signature verification

```typescript
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as express from "express";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bodyParser: false, // NEW: Disable default body parsing
	});

	// Middleware to capture raw body for Stripe signature verification
	app.use(
		express.json({
			verify: (req: any, res: any, buf: any) => {
				req.rawBody = buf;
			},
		}),
	);

	// ... rest of bootstrap
}
```

**6. Add Environment Variables**
Update `.env.example`:

```env
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**7. Configure Stripe Webhook** (Manual Task)
In Stripe Dashboard:

- Go to Developers > Webhooks
- Add endpoint: `https://your-api.com/api/webhooks/stripe`
- Events to listen:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `charge.refunded`
- Copy webhook secret to `.env`

#### Files Modified:

- 🆕 `backend/src/payment/webhooks/stripe.webhook.ts`
- ✏️ `backend/src/payment/payment.service.ts`
- ✏️ `backend/src/payment/strategies/stripe.strategy.ts`
- ✏️ `backend/src/main.ts`
- ✏️ `backend/.env.example`

#### Frontend Changes Required: ❌ NO (webhook is backend-only)

#### Database Migration Required: ❌ NO

#### Breaking Changes: ✅ NONE - adds new webhook functionality

#### New API Endpoint:

```
POST /api/webhooks/stripe
- Public endpoint (no auth required)
- Accepts Stripe webhook events
- Returns { received: true }
```

#### Testing:

```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

#### Rollback Plan:

Remove webhook controller and revert payment.service.ts changes.

---

### Task 2.3: Wrap Payment + Enrollment in Atomic Transaction

**Priority:** 🔴 CRITICAL | **Hours:** 4 | **Risk if Unfixed:** CRITICAL

#### Problem

Payment and enrollment are separate operations - if one fails, inconsistent state.

#### Solution

Use Prisma transactions to ensure atomicity.

#### Already handled in Task 2.2's `processSuccessfulPayment` method

#### Additional Updates to `backend/src/student/student.service.ts`

```typescript
async enroll(studentId: string, dto: EnrollDto) {
  const course = await this.prisma.course.findUnique({
    where: { id: dto.courseId },
  });
  if (!course) throw new NotFoundException('Course not found');

  // Use transaction for data consistency
  try {
    const enrollment = await this.prisma.$transaction(async (tx) => {
      // Check for duplicate
      const existing = await tx.enrollment.findFirst({
        where: { userId: studentId, courseId: dto.courseId },
      });

      if (existing) {
        throw new BadRequestException('Already enrolled in this course');
      }

      // For premium courses, payment should be verified before this call
      if (course.isPremium) {
        const payment = await tx.payment.findFirst({
          where: {
            userId: studentId,
            courseId: dto.courseId,
            status: 'completed',
          },
        });

        if (!payment) {
          throw new ForbiddenException('Payment required for this course');
        }
      }

      // Create enrollment
      return await tx.enrollment.create({
        data: { userId: studentId, courseId: dto.courseId },
      });
    });

    return { message: 'Enrolled successfully' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new BadRequestException('Already enrolled in this course');
      }
    }
    throw error;
  }
}
```

#### Files Modified:

- ✏️ `backend/src/student/student.service.ts`

#### Frontend Changes Required: ❌ NO

#### Database Migration Required: ❌ NO

#### Breaking Changes: ✅ NONE

#### Testing:

Already covered in webhook testing.

---

### Task 2.4: Add Payment Records Logging

**Priority:** 🔴 CRITICAL | **Hours:** 3 | **Risk if Unfixed:** HIGH

#### Problem

Payment table exists but never populated - no audit trail or reconciliation capability.

#### Solution

Ensure all payments logged, create payment records on successful transactions.

#### Already handled in Task 2.2 - `processSuccessfulPayment` creation of payment record

#### Additional: Create Payment History Endpoint

**Update `backend/src/payment/payment.controller.ts`**

```typescript
import { Controller, Get, UseGuards, Post, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles, User } from "../auth/decorators";

@Controller("payments")
export class PaymentController {
	constructor(private readonly paymentsService: PaymentsService) {}

	// NEW: Get payment history
	@Get("history")
	@UseGuards(JwtAuthGuard)
	async getPaymentHistory(@User("id") userId: string, @Query("status") status?: string) {
		return this.paymentsService.getPaymentHistory(userId, status);
	}

	// NEW: Get single payment details
	@Get(":paymentId")
	@UseGuards(JwtAuthGuard)
	async getPaymentDetails(@User("id") userId: string, @Param("paymentId") paymentId: string) {
		return this.paymentsService.getPaymentDetails(userId, paymentId);
	}

	// Admin: Get all payments
	@Get()
	@UseGuards(JwtAuthGuard)
	@Roles(UserRole.ADMIN)
	async getAllPayments(@Query("status") status?: string) {
		return this.paymentsService.getAllPayments(status);
	}
}
```

**Update `backend/src/payment/payment.service.ts`**

```typescript
async getPaymentHistory(userId: string, status?: string) {
  return this.prisma.payment.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    include: {
      course: {
        select: { id: true, title: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async getPaymentDetails(userId: string, paymentId: string) {
  const payment = await this.prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: {
      course: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (!payment) throw new NotFoundException('Payment not found');
  return payment;
}

async getAllPayments(status?: string) {
  return this.prisma.payment.findMany({
    where: ...(status && { status }),
    include: {
      user: { select: { id: true, email: true, name: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

#### Files Modified:

- 🆕 `backend/src/payment/payment.controller.ts`
- ✏️ `backend/src/payment/payment.service.ts`

#### Frontend Changes Required: ✅ YES (payment history UI)

#### Database Migration Required: ❌ NO

#### Testing:

```bash
# Get payment history
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/payments/history

# Get single payment
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/payments/{paymentId}
```

---

### Task 2.5: Add Currency & Tax Calculation Support

**Priority:** 🟠 HIGH | **Hours:** 6 | **Risk if Unfixed:** HIGH (Legal)

#### Problem

No tax handling - illegal in many jurisdictions for online sales.

#### Solution

Add tax calculation and multi-currency support.

#### Database Migration

**Update `backend/prisma/schema.prisma`**

```prisma
model Payment {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId  String
  amount    Float    // Subtotal
  tax       Float    @default(0)   // NEW: Tax amount
  total     Float                   // NEW: Amount + tax
  currency  String   @default("USD") // NEW: Currency code
  status    String   // pending, completed, failed
  provider  String   // Stripe, PayPal
  transactionId String? @unique    // NEW: For bank reconciliation
  metadata  String?                // NEW: Additional data (JSON)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([courseId])
  @@index([status])
  @@index([currency])
}
```

**Create Tax Configuration `backend/src/payment/config/tax.config.ts`** (NEW FILE)

```typescript
// Simple tax rates by country (in production, use a service)
export const TAX_RATES: Record<string, number> = {
	US: 0.0, // Sales tax varies by state, requires more complex logic
	CA: 0.13, // 13% HST
	AU: 0.1, // 10% GST
	UK: 0.2, // 20% VAT
	DE: 0.19, // 19% VAT
	EU: 0.23, // Standard VAT (varies by country)
};

export const getDefaultTaxRate = (): number => {
	const tax = process.env.DEFAULT_TAX_RATE;
	return tax ? parseFloat(tax) : 0;
};
```

**Create Tax Service `backend/src/payment/tax/tax.service.ts`** (NEW FILE)

```typescript
import { Injectable } from "@nestjs/common";
import { TAX_RATES, getDefaultTaxRate } from "../config/tax.config";

@Injectable()
export class TaxService {
	calculateTax(amount: number, country?: string, region?: string): { tax: number; total: number } {
		let taxRate = getDefaultTaxRate();

		if (country) {
			taxRate = TAX_RATES[country] || getDefaultTaxRate();
		}

		const tax = parseFloat((amount * taxRate).toFixed(2));
		const total = parseFloat((amount + tax).toFixed(2));

		return { tax, total };
	}

	isInEU(country: string): boolean {
		const euCountries = ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PL"];
		return euCountries.includes(country);
	}
}
```

**Update Payment Service **

```typescript
import { TaxService } from "./tax/tax.service";

@Injectable()
export class PaymentsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly stripe: StripeStrategy,
		private readonly mpesa: MpesaStrategy,
		private readonly taxService: TaxService, // NEW
	) {}

	async initiatePayment(studentId: string, dto: InitiatePaymentDto) {
		const course = await this.prisma.course.findUnique({
			where: { id: dto.courseId },
		});

		if (!course) throw new NotFoundException("Course not found");
		if (!course.isPremium) {
			throw new BadRequestException("Course is free, no payment required");
		}

		const amount = course.price || 100;

		// NEW: Calculate tax
		const { tax, total } = this.taxService.calculateTax(
			amount,
			dto.country, // Must be provided from frontend
		);

		if (dto.provider === PaymentProvider.STRIPE) {
			return this.stripe.createCheckoutSession(
				dto.phoneOrEmail,
				dto.courseId,
				total, // NEW: Charge total with tax
				studentId,
				{ amount, tax, total }, // NEW: Metadata
			);
		}

		throw new BadRequestException("Unsupported payment provider");
	}

	async processSuccessfulPayment(userId: string, courseId: string, transactionId: string, amount: number, paid: boolean, metadata?: { amount: number; tax: number; total: number }): Promise<void> {
		if (!paid) return;

		await this.prisma.$transaction(async (tx) => {
			const payment = await tx.payment.create({
				data: {
					userId,
					courseId,
					amount: metadata?.amount || amount,
					tax: metadata?.tax || 0, // NEW
					total: metadata?.total || amount, // NEW
					currency: "USD", // NEW: Could be dynamic
					status: "completed",
					provider: "stripe",
					transactionId, // NEW
					metadata: metadata ? JSON.stringify(metadata) : null, // NEW
				},
			});

			const existingEnrollment = await tx.enrollment.findFirst({
				where: { userId, courseId },
			});

			if (!existingEnrollment) {
				await tx.enrollment.create({
					data: { userId, courseId },
				});
			}

			return payment;
		});
	}
}
```

**Update DTO `backend/src/payment/dto/initiate-payment.dto.ts`**

```typescript
export class InitiatePaymentDto {
	@IsString()
	@IsNotEmpty()
	courseId: string;

	@IsString()
	@IsNotEmpty()
	phoneOrEmail: string;

	@IsEnum(PaymentProvider)
	provider: PaymentProvider;

	@IsString()
	@IsOptional()
	country?: string; // NEW: For tax calculation
}
```

#### Files Modified:

- ✏️ `backend/prisma/schema.prisma`
- 🆕 `backend/src/payment/config/tax.config.ts`
- 🆕 `backend/src/payment/tax/tax.service.ts`
- ✏️ `backend/src/payment/payment.service.ts`
- ✏️ `backend/src/payment/dto/initiate-payment.dto.ts`

#### Database Migration Required: ✅ YES

```bash
npx prisma migrate dev --name add_tax_and_currency_to_payment
```

#### Frontend Changes Required: ✅ YES

- Add country selector to payment form
- Display tax and total at checkout

#### Testing:

```bash
# Verify tax calculation
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -d '{
    "courseId": "course123",
    "country": "CA",
    "provider": "stripe"
  }'
# Should show tax calculated
```

---

### Task 2.6: Implement Pagination for All Listing Endpoints

**Priority:** 🟠 HIGH | **Hours:** 8 | **Risk if Unfixed:** HIGH

#### Problem

Returning all records in single response - will crash with scale.

#### Solution

Add pagination to all list endpoints.

#### Create Pagination DTO `backend/src/common/dto/pagination.dto.ts`\*\* (NEW FILE)

```typescript
import { Type } from "class-transformer";
import { IsNumber, Min, Max, IsOptional } from "class-validator";

export class PaginationDto {
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@IsOptional()
	page?: number = 1;

	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@Max(100) // Max 100 per page
	@IsOptional()
	limit?: number = 20;

	get skip(): number {
		return (this.page! - 1) * this.limit!;
	}
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
}
```

**Create Pagination Service `backend/src/common/services/pagination.service.ts`** (NEW FILE)

```typescript
import { Injectable } from "@nestjs/common";
import { PaginationDto, PaginatedResponse } from "../dto/pagination.dto";

@Injectable()
export class PaginationService {
	paginate<T>(data: T[], total: number, pagination: PaginationDto): PaginatedResponse<T> {
		return {
			data,
			pagination: {
				page: pagination.page!,
				limit: pagination.limit!,
				total,
				pages: Math.ceil(total / pagination.limit!),
			},
		};
	}
}
```

**Update `backend/src/courses/courses.service.ts`**

```typescript
import { PaginationDto } from '../common/dto/pagination.dto';

async listCourses(
  filter: FilterCoursesDto,
  role: UserRole,
  userId: string,
  pagination: PaginationDto,
) {
  const where: any = {};

  if (filter.keyword) {
    where.title = { contains: filter.keyword, mode: 'insensitive' };
  }
  if (filter.category) {
    where.category = filter.category;
  }
  if (filter.level) {
    where.level = filter.level;
  }

  if (role === 'INSTRUCTOR') {
    where.instructorId = userId;
  }

  // Get total count
  const total = await this.prisma.course.count({ where });

  // Get paginated data
 const courses = await this.prisma.course.findMany({
    where,
    skip: pagination.skip,
    take: pagination.limit,
    orderBy: { createdAt: 'desc' },
    include: {
      instructor: {
        select: { id: true, name: true, profilePicture: true },
      },
    },
  });

  return { courses, total };
}

async getPublicCourses(filter: FilterCoursesDto, pagination: PaginationDto) {
  const where: any = {};

  if (filter.keyword) {
    where.title = { contains: filter.keyword, mode: 'insensitive' };
  }
  if (filter.category) {
    where.category = filter.category;
  }
  if (filter.level) {
    where.level = filter.level;
  }

  const total = await this.prisma.course.count({ where });

  const courses = await this.prisma.course.findMany({
    where,
    skip: pagination.skip,
    take: pagination.limit,
    orderBy: { createdAt: 'desc' },
    include: {
      instructor: {
        select: { id: true, name: true, profilePicture: true },
      },
    },
  });

  return { courses, total };
}
```

**Update `backend/src/courses/courses.controller.ts`**

```typescript
import { PaginationDto } from "../common/dto/pagination.dto";
import { PaginationService } from "../common/services/pagination.service";

@Controller("courses")
export class CoursesController {
	constructor(
		private readonly coursesService: CoursesService,
		private readonly paginationService: PaginationService, // NEW
	) {}

	@Public()
	@Get("public")
	async getPublicCourses(
		@Query() filters: FilterCoursesDto,
		@Query() pagination: PaginationDto, // NEW
	) {
		const { courses, total } = await this.coursesService.getPublicCourses(filters, pagination);
		return this.paginationService.paginate(courses, total, pagination);
	}

	@Get()
	async listCourses(
		@Query() filters: FilterCoursesDto,
		@Query() pagination: PaginationDto, // NEW
		@User("role") role: UserRole,
		@User("id") userId: string,
	) {
		const { courses, total } = await this.coursesService.listCourses(filters, role, userId, pagination);
		return this.paginationService.paginate(courses, total, pagination);
	}
}
```

**Apply to Student Service for Enrolled Courses**

```typescript
async getEnrolledCourses(
  studentId: string,
  pagination: PaginationDto,
) {
  const total = await this.prisma.enrollment.count({
    where: { userId: studentId },
  });

  const enrollments = await this.prisma.enrollment.findMany({
    where: { userId: studentId },
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { contents: true },
          },
        },
      },
    },
  });

  return {
    courses: enrollments.map((e) => e.course),
    total,
  };
}
```

#### Files Modified:

- 🆕 `backend/src/common/dto/pagination.dto.ts`
- 🆕 `backend/src/common/services/pagination.service.ts`
- ✏️ `backend/src/courses/courses.service.ts`
- ✏️ `backend/src/courses/courses.controller.ts`
- ✏️ `backend/src/student/student.service.ts`
- ✏️ `backend/src/student/student.controller.ts`
- ✏️ `backend/src/admin/admin.service.ts`
- ✏️ `backend/src/admin/admin.controller.ts`

#### Frontend Changes Required: ✅ YES (pagination UI)

#### Database Migration Required: ❌ NO

#### Breaking Changes: ⚠️ MODERATE - Response format changes

#### Testing:

```bash
# Test pagination
curl 'http://localhost:3000/api/courses/public?page=1&limit=20'
# Response includes pagination metadata
```

---

## PHASE 2 SUMMARY

| Task                   | Hours        | Status | Files        | Migrations       |
| ---------------------- | ------------ | ------ | ------------ | ---------------- |
| 2.1 Course Pricing     | 3            | ✅     | 3 modified   | 1 ✅             |
| 2.2 Stripe Webhook     | 8            | ✅     | 5 modified   | 0                |
| 2.3 Atomic Transaction | 4            | ✅     | 1 modified   | 0                |
| 2.4 Payment Logging    | 3            | ✅     | 2 modified   | 0                |
| 2.5 Tax & Currency     | 6            | ✅     | 5 modified   | 1 ✅             |
| 2.6 Pagination         | 8            | ✅     | 8 modified   | 0                |
|                        |              |        |              |
| **PHASE 2 TOTAL**      | **32 hours** | ✅     | **27 files** | **2 migrations** |

---

Due to token limits, Phases 3-4 will be documented separately.

# PHASE 3: PERFORMANCE & SCALABILITY

## Duration: 3 weeks | 95 hours | Target: 78/100

## Key Tasks Summary:

- **3.1:** Implement Redis Caching Layer (6 hrs)
- **3.2:** Optimize N+1 Queries (5 hrs)
- **3.3:** Implement Async Job Queue (8 hrs)
- **3.4:** Database Connection Pooling (3 hrs)
- **3.5:** Video Streaming Optimization (12 hrs)
- **3.6:** Content Protection & Signed URLs (8 hrs)
- **3.7:** Advanced Indexing Strategy (5 hrs)
- **3.8:** Monitoring & Performance Tracking (12 hrs)
- **3.9:** API Response Caching Headers (6 hrs)
- **3.10:** Query Optimization Workshop (8 hrs)
- **3.11:** Frontend Bundle Optimization (8 hrs)
- **3.12:** CDN & Asset Delivery (5 hrs)

---

# PHASE 4: UX, TESTING & PRODUCTION HARDENING

## Duration: 8 weeks | 140 hours | Target: 85/100

## Key Tasks Summary:

- **4.1:** Unit Testing Framework Setup (5 hrs)
- **4.2:** Write Unit Tests (40 hrs - 50% coverage target)
- **4.3:** Integration Testing Setup (8 hrs)
- **4.4:** E2E Testing with Playwright (30 hrs)
- **4.5:** Load Testing & Performance Benchmarks (12 hrs)
- **4.6:** Security Penetration Testing (16 hrs)
- **4.7:** API Documentation - Swagger (12 hrs)
- **4.8:** Frontend UX Improvements (15 hrs)
- **4.9:** Error Recovery & Resilience (10 hrs)
- **4.10:** Disaster Recovery & Backup (8 hrs)
- **4.11:** Compliance & Legal (8 hrs)
- **4.12:** Production Launch Checklist (10 hrs)

---

# OVERALL DELIVERABLES SUMMARY

## After All 4 Phases (16 weeks):

| Metric            | Current     | Target                |
| ----------------- | ----------- | --------------------- |
| Production Score  | 52/100      | **85/100**            |
| Security Issues   | 25 critical | **0 critical**        |
| Test Coverage     | 0%          | **50-70%**            |
| Payment System    | Broken      | **Fully functional**  |
| Performance       | Poor        | **5-10x improvement** |
| API Documentation | None        | **100% Swagger**      |
| Monitoring        | None        | **Full stack**        |
| Estimated Users   | ~100        | **10,000+**           |

---

# DEPLOYMENT STRATEGY

## Phase 1 Rollout (Weeks 1-2):

1. Deploy to staging environment first
2. Run full integration tests
3. Load test with 1000 concurrent users
4. Security audit by external team
5. Blue-green deployment to production

## Phase 2 Rollout (Weeks 3-5):

1. Database backup before each migration
2. Gradual rollout to 10% users first
3. Monitor for 24 hours
4. Expand to 50%, then 100%

## Phase 3 Rollout (Weeks 6-8):

1. Performance testing on staging
2. Rolling deployment (no downtime)
3. A/B test new caching layer
4. Monitor latency improvements

## Phase 4 Rollout (Weeks 9-16):

1. Full test coverage on staging
2. Load testing to production capacity
3. Staged production deployment
4. Continuous monitoring post-launch

---

# ROLLBACK PROCEDURES

Each task has individual rollback steps documented. Critical steps:

```bash
# Database rollback
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma db push

# Code rollback
git revert <commit_hash>
npm run build
npm restart

# Render deployment rollback
# Via Render dashboard: previous deployment history
```

---

# PRODUCTION READINESS GATES

| Gate            | Approval              | Owner        |
| --------------- | --------------------- | ------------ |
| Security Audit  | ✅ External firm      | CTO/Security |
| Load Testing    | 10k users/1min        | DevOps       |
| Coverage        | 50%+ unit tests       | QA           |
| Documentation   | 100% API docs         | Tech Lead    |
| Backup Strategy | Daily + tested        | DevOps       |
| Monitoring      | All services          | DevOps       |
| Legal           | TOS, Privacy reviewed | Legal        |
| Compliance      | GDPR/tax reviewed     | Compliance   |

---

**Next:** Continue with detailed Phases 3-4 documentation in separate file.
