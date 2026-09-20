import { type INestApplication, ValidationPipe } from '@nestjs/common';

import { ApiExceptionFilter } from './common/filters/api-exception.filter';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}
