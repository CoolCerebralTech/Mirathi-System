import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

// Define the transaction client type (a subset of PrismaClient)
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a function within a database transaction.
   * @param work A callback function that receives the transaction client.
   * @returns The result of the work callback.
   */
  async execute<T>(work: (tx: PrismaTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return work(tx);
    });
  }
}
