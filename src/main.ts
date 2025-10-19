import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "@infrastructure/app.module";

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
