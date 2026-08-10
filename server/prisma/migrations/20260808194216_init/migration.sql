-- CreateTable
CREATE TABLE "SpotifyToken" (
    "id" SERIAL NOT NULL,
    "user" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tokenType" VARCHAR(50) NOT NULL,

    CONSTRAINT "SpotifyToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "host" VARCHAR(50) NOT NULL,
    "guestCanPause" BOOLEAN NOT NULL DEFAULT false,
    "votesToSkip" INTEGER NOT NULL DEFAULT 1,
    "currentSong" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "user" VARCHAR(50) NOT NULL,
    "roomId" INTEGER NOT NULL,
    "songId" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyToken_user_key" ON "SpotifyToken"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_host_key" ON "Room"("host");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_roomId_user_songId_key" ON "Vote"("roomId", "user", "songId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
