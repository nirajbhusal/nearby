-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ai_meetup',
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'curated',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "oneLiner" TEXT,
    "website" TEXT,
    "careersUrl" TEXT,
    "locations" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'curated',
    "sourceUrl" TEXT,
    "notes" TEXT,
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("careersUrl", "createdAt", "id", "listedAt", "locations", "name", "notes", "oneLiner", "slug", "source", "sourceUrl", "updatedAt", "website") SELECT "careersUrl", "createdAt", "id", "listedAt", "locations", "name", "notes", "oneLiner", "slug", "source", "sourceUrl", "updatedAt", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
