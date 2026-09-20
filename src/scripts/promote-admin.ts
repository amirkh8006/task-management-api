import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function promoteAdmin(): Promise<void> {
  const email = process.argv[2];

  if (!email) {
    throw new Error('Usage: npm run admin:promote -- <existing-user-email>');
  }

  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  try {
    const user = await application.get(UsersService).promoteToAdmin(email);
    console.log(`Promoted ${user.email} (${user.id}) to admin.`);
  } finally {
    await application.close();
  }
}

void promoteAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Admin promotion failed: ${message}`);
  process.exitCode = 1;
});
