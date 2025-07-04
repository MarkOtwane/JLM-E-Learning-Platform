export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export type PaymentReceipt = {
  transactionId: string;
  courseId: string;
  studentId: string;
  amount: number;
  provider: string;
  status: PaymentStatus;
  paidAt?: Date;
};
