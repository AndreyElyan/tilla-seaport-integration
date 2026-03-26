-- CreateTable
CREATE TABLE "seaports" (
    "id" SERIAL NOT NULL,
    "portName" TEXT NOT NULL,
    "locode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezoneOlson" TEXT,
    "countryIso" TEXT,
    "clientSource" TEXT NOT NULL DEFAULT 'tilla',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seaports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seaports_locode_key" ON "seaports"("locode");
