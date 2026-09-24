-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "oneLiner" TEXT,
    "website" TEXT,
    "careersUrl" TEXT,
    "locations" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'benln',
    "sourceUrl" TEXT,
    "notes" TEXT,
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
