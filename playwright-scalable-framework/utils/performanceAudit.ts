import { playAudit } from 'playwright-lighthouse';
import { Page } from '@playwright/test';
import { logger } from './logger';

export class PerformanceAudit {
  static async runAudit(page: Page, port: number, name: string) {
    logger.info(`Starting Lighthouse performance audit for ${name}`);
    await playAudit({
      page: page,
      port: port,
      thresholds: {
        performance: 50,
        accessibility: 50,
        'best-practices': 50,
        seo: 50
      },
      reports: {
        formats: {
          html: true
        },
        name: `lighthouse-${name}`,
        directory: `${process.cwd()}/reports`
      }
    });
    logger.info(`Lighthouse audit for ${name} completed.`);
  }
}
