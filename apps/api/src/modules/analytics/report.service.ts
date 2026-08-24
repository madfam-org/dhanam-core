// SPDX-License-Identifier: AGPL-3.0-or-later
import { ANALYTICS } from '@dhanam-core/shared';
import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import { PrismaService } from '@core/prisma/prisma.service';

import { AnalyticsService } from './analytics.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async generatePdfReport(spaceId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Uint8Array[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      (async () => {
        try {
          // Get space details
          const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: {
              userSpaces: {
                include: {
                  user: true,
                },
              },
            },
          });

          if (!space) {
            throw new Error('Space not found');
          }

          // Title Page
          doc.fontSize(24).text('Dhanam Financial Report', 50, 50);
          doc.fontSize(18).text(space.name, 50, 90);
          doc
            .fontSize(14)
            .text(
              `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`,
              50,
              120
            );

          // Executive Summary
          doc.addPage();
          doc.fontSize(20).text('Executive Summary', 50, 50);

          // Get income and expense data
          const transactions = await this.prisma.transaction.findMany({
            where: {
              account: { spaceId },
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              category: true,
            },
          });

          const incomeTransactions = transactions.filter((t) => t.amount.gt(0));
          const expenseTransactions = transactions.filter((t) => t.amount.lt(0));

          const cashflow = {
            income: incomeTransactions.reduce(
              (acc, t) => {
                const category = t.category?.name || 'Uncategorized';
                const existing = acc.find((i) => i.category === category);
                if (existing) {
                  existing.amount += t.amount.toNumber();
                } else {
                  acc.push({ category, amount: t.amount.toNumber() });
                }
                return acc;
              },
              [] as Array<{ category: string; amount: number }>
            ),
            expenses: expenseTransactions.reduce(
              (acc, t) => {
                const category = t.category?.name || 'Uncategorized';
                const existing = acc.find((i) => i.category === category);
                if (existing) {
                  existing.amount += t.amount.toNumber();
                } else {
                  acc.push({ category, amount: t.amount.toNumber() });
                }
                return acc;
              },
              [] as Array<{ category: string; amount: number }>
            ),
          };

          const totalIncome = cashflow.income.reduce((sum, item) => sum + item.amount, 0);
          const totalExpenses = Math.abs(
            cashflow.expenses.reduce((sum, item) => sum + item.amount, 0)
          );
          const netSavings = totalIncome - totalExpenses;

          doc.fontSize(12);
          doc.text(`Total Income: ${space.currency} ${totalIncome.toFixed(2)}`, 50, 100);
          doc.text(`Total Expenses: ${space.currency} ${totalExpenses.toFixed(2)}`, 50, 120);
          doc.text(`Net Savings: ${space.currency} ${netSavings.toFixed(2)}`, 50, 140);
          doc.text(
            `Savings Rate: ${totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0}%`,
            50,
            160
          );

          // Income Breakdown
          doc.addPage();
          doc.fontSize(20).text('Income Breakdown', 50, 50);
          doc.fontSize(12);

          let yPos = 100;
          for (const income of cashflow.income) {
            doc.text(`${income.category}: ${space.currency} ${income.amount.toFixed(2)}`, 50, yPos);
            yPos += 20;
          }

          // Expense Breakdown
          doc.addPage();
          doc.fontSize(20).text('Expense Breakdown', 50, 50);
          doc.fontSize(12);

          const spending = await this.analyticsService.getSpendingByCategory(
            space.userSpaces[0]?.userId || '',
            spaceId,
            startDate,
            endDate
          );

          yPos = 100;
          for (const category of spending.sort((a, b) => b.amount - a.amount)) {
            doc.text(
              `${category.categoryName}: ${space.currency} ${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)`,
              50,
              yPos
            );
            yPos += 20;
            if (yPos > ANALYTICS.PDF_PAGE_BREAK_Y) {
              doc.addPage();
              yPos = 50;
            }
          }

          // Budget Performance
          const budgets = await this.prisma.budget.findMany({
            where: {
              spaceId,
            },
            include: {
              categories: true,
            },
          });

          if (budgets.length > 0) {
            doc.addPage();
            doc.fontSize(20).text('Budget Performance', 50, 50);
            doc.fontSize(12);

            // Batch-fetch all budget-related transactions in a single query
            const allCategoryIds = budgets.flatMap((b) => b.categories.map((c) => c.id));
            const allBudgetTransactions =
              allCategoryIds.length > 0
                ? await this.prisma.transaction.findMany({
                    where: {
                      account: { spaceId },
                      date: { gte: startDate, lte: endDate },
                      categoryId: { in: allCategoryIds },
                    },
                  })
                : [];

            yPos = 100;
            for (const budget of budgets) {
              // Filter from pre-fetched transactions instead of querying per budget
              const budgetCategoryIds = new Set(budget.categories.map((c) => c.id));
              const budgetTransactions = allBudgetTransactions.filter(
                (t) => t.categoryId && budgetCategoryIds.has(t.categoryId)
              );

              const totalSpent = Math.abs(
                budgetTransactions
                  .filter((t) => t.amount.lt(0))
                  .reduce((sum, t) => sum + t.amount.toNumber(), 0)
              );
              const totalBudgetAmount = budget.categories.reduce(
                (sum, c) => sum + c.budgetedAmount.toNumber(),
                0
              );
              const percentageUsed =
                totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

              const spent = { totalSpent, percentageUsed };

              doc.text(`${budget.name}:`, 50, yPos);
              yPos += 20;
              doc.text(`  Budget: ${space.currency} ${totalBudgetAmount.toFixed(2)}`, 50, yPos);
              yPos += 20;
              doc.text(
                `  Spent: ${space.currency} ${spent.totalSpent.toFixed(2)} (${spent.percentageUsed.toFixed(1)}%)`,
                50,
                yPos
              );
              yPos += 30;

              if (yPos > ANALYTICS.PDF_PAGE_BREAK_Y) {
                doc.addPage();
                yPos = 50;
              }
            }
          }

          // Account Balances
          doc.addPage();
          doc.fontSize(20).text('Account Balances', 50, 50);
          doc.fontSize(12);

          const accounts = await this.prisma.account.findMany({
            where: { spaceId },
            orderBy: { balance: 'desc' },
          });

          yPos = 100;
          let totalBalance = 0;
          for (const account of accounts) {
            doc.text(
              `${account.name}: ${account.currency} ${account.balance.toFixed(2)}`,
              50,
              yPos
            );
            totalBalance += account.balance.toNumber();
            yPos += 20;
            if (yPos > ANALYTICS.PDF_PAGE_BREAK_Y) {
              doc.addPage();
              yPos = 50;
            }
          }

          doc.text(`Total Balance: ${space.currency} ${totalBalance.toFixed(2)}`, 50, yPos + 20);

          // Footer
          doc
            .fontSize(10)
            .text(`Generated by Dhanam on ${format(new Date(), 'MMMM d, yyyy')}`, 50, 750);

          doc.end();
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  async generateCsvExport(spaceId: string, startDate: Date, endDate: Date): Promise<string> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // CSV Header
    let csv = 'Date,Account,Category,Description,Amount,Currency\n';

    // CSV Data
    for (const transaction of transactions) {
      csv += `"${format(transaction.date, 'yyyy-MM-dd')}",`;
      csv += `"${transaction.account.name}",`;
      csv += `"${transaction.category?.name || 'Uncategorized'}",`;
      csv += `"${transaction.description.replace(/"/g, '""')}",`;
      csv += `${transaction.amount.toFixed(2)},`;
      csv += `${transaction.currency}\n`;
    }

    return csv;
  }

  /**
   * Generate Excel (xlsx) export with multiple sheets
   */
  async generateExcelExport(spaceId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dhanam';
    workbook.created = new Date();

    // Get space details
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        userSpaces: { include: { user: true } },
      },
    });

    if (!space) {
      throw new Error('Space not found');
    }

    // Sheet 1: Transactions
    const transactionsSheet = workbook.addWorksheet('Transactions');
    transactionsSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Account', key: 'account', width: 20 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Merchant', key: 'merchant', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Pending', key: 'pending', width: 10 },
    ];

    // Style header row
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    transactionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
      },
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
    });

    for (const txn of transactions) {
      const row = transactionsSheet.addRow({
        date: format(txn.date, 'yyyy-MM-dd'),
        account: txn.account.name,
        category: txn.category?.name || 'Uncategorized',
        merchant: txn.merchant || '',
        description: txn.description,
        amount: parseFloat(txn.amount.toString()),
        currency: txn.currency,
        pending: txn.pending ? 'Yes' : 'No',
      });

      // Color negative amounts red, positive green
      const amountCell = row.getCell('amount');
      if (parseFloat(txn.amount.toString()) < 0) {
        amountCell.font = { color: { argb: 'FFDC3545' } };
      } else if (parseFloat(txn.amount.toString()) > 0) {
        amountCell.font = { color: { argb: 'FF28A745' } };
      }
    }

    // Format amount column as currency
    transactionsSheet.getColumn('amount').numFmt = '#,##0.00';

    // Sheet 2: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Calculate summary metrics
    const incomeTransactions = transactions.filter((t) => t.amount.gt(0));
    const expenseTransactions = transactions.filter((t) => t.amount.lt(0));
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );
    const totalExpenses = Math.abs(
      expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    );

    summarySheet.addRows([
      {
        metric: 'Report Period',
        value: `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`,
      },
      { metric: 'Space', value: space.name },
      { metric: 'Total Transactions', value: transactions.length },
      { metric: 'Total Income', value: totalIncome },
      { metric: 'Total Expenses', value: totalExpenses },
      { metric: 'Net Savings', value: totalIncome - totalExpenses },
      {
        metric: 'Savings Rate',
        value:
          totalIncome > 0
            ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)}%`
            : 'N/A',
      },
    ]);

    // Sheet 3: Spending by Category
    const categorySheet = workbook.addWorksheet('Spending by Category');
    categorySheet.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Transactions', key: 'count', width: 15 },
      { header: '% of Total', key: 'percentage', width: 12 },
    ];
    categorySheet.getRow(1).font = { bold: true };
    categorySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    categorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Group by category
    const categorySpending = expenseTransactions.reduce(
      (acc, txn) => {
        const category = txn.category?.name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += Math.abs(parseFloat(txn.amount.toString()));
        acc[category].count += 1;
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>
    );

    const sortedCategories = Object.entries(categorySpending).sort(
      (a, b) => b[1].amount - a[1].amount
    );

    for (const [category, data] of sortedCategories) {
      categorySheet.addRow({
        category,
        amount: data.amount,
        count: data.count,
        percentage:
          totalExpenses > 0 ? `${((data.amount / totalExpenses) * 100).toFixed(1)}%` : '0%',
      });
    }

    categorySheet.getColumn('amount').numFmt = '#,##0.00';

    // Sheet 4: Account Balances
    const accountsSheet = workbook.addWorksheet('Account Balances');
    accountsSheet.columns = [
      { header: 'Account', key: 'name', width: 25 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Balance', key: 'balance', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Last Synced', key: 'lastSynced', width: 20 },
    ];
    accountsSheet.getRow(1).font = { bold: true };
    accountsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    accountsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      orderBy: { balance: 'desc' },
    });

    for (const account of accounts) {
      accountsSheet.addRow({
        name: account.name,
        type: account.type,
        balance: parseFloat(account.balance.toString()),
        currency: account.currency,
        lastSynced: account.lastSyncedAt
          ? format(account.lastSyncedAt, 'yyyy-MM-dd HH:mm')
          : 'Never',
      });
    }

    accountsSheet.getColumn('balance').numFmt = '#,##0.00';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.logger.log(
      `Generated Excel report for space ${spaceId} with ${transactions.length} transactions`
    );

    return Buffer.from(buffer);
  }

  /**
   * Generate JSON export
   */
  async generateJsonExport(spaceId: string, startDate: Date, endDate: Date): Promise<string> {
    const [transactions, accounts, budgets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          account: { spaceId },
          date: { gte: startDate, lte: endDate },
        },
        include: { account: true, category: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.account.findMany({
        where: { spaceId },
      }),
      this.prisma.budget.findMany({
        where: { spaceId },
        include: { categories: true },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      transactions: transactions.map((t) => ({
        date: t.date.toISOString(),
        account: t.account.name,
        category: t.category?.name || null,
        merchant: t.merchant,
        description: t.description,
        amount: parseFloat(t.amount.toString()),
        currency: t.currency,
        pending: t.pending,
      })),
      accounts: accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance.toString()),
        currency: a.currency,
      })),
      budgets: budgets.map((b) => ({
        name: b.name,
        period: b.period,
        categories: b.categories.map((c) => ({
          name: c.name,
          budgeted: parseFloat(c.budgetedAmount.toString()),
        })),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }
}
