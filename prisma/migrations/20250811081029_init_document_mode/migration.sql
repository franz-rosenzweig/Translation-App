-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "directTranslationVersionId" TEXT,
    "currentAdaptedVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,
    CONSTRAINT "Version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiffCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "fromVersionId" TEXT NOT NULL,
    "toVersionId" TEXT NOT NULL,
    "diffJson" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SentenceAlignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "sourceSentenceIndex" INTEGER NOT NULL,
    "targetSentenceIndex" INTEGER NOT NULL,
    "similarity" REAL NOT NULL,
    "alignmentVersionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_directTranslationVersionId_key" ON "Document"("directTranslationVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_currentAdaptedVersionId_key" ON "Document"("currentAdaptedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiffCache_hash_key" ON "DiffCache"("hash");
