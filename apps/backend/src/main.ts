import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../../.env") });

import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

function killPortHolder(port: number | string) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, {
      stdio: "ignore",
    });
  } catch {
    // no process on port — nothing to kill
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ forceCloseConnections: true }),
  );

  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
  });

  const port = process.env.PORT ?? 3000;

  try {
    await app.listen(port, "0.0.0.0");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "EADDRINUSE"
    ) {
      killPortHolder(port);
      await new Promise((r) => setTimeout(r, 500));
      await app.listen(port, "0.0.0.0");
    } else {
      throw err;
    }
  }
}

bootstrap();
