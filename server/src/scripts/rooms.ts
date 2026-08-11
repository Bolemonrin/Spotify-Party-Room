/**
 * Inspect or clear rooms.
 *
 *   npx tsx src/scripts/rooms.ts                 list every room
 *   npx tsx src/scripts/rooms.ts --delete-all    delete every room
 *   npx tsx src/scripts/rooms.ts --keep-newest   delete all but the most recent
 *
 * Deleting a room cascades to its votes. Spotify tokens are keyed by session id
 * rather than by room, so they are left alone — clear those separately if you
 * want a host to re-authorise.
 */
import { prisma } from "../prisma.js";

const flag = process.argv[2];

const rooms = await prisma.room.findMany({
  orderBy: { createdAt: "desc" },
  select: {
    code: true,
    host: true,
    currentSong: true,
    createdAt: true,
    _count: { select: { votes: true } },
  },
});

console.log(`${rooms.length} room(s):`);
for (const r of rooms) {
  console.log(
    `  ${r.code}  host=${r.host.slice(0, 10)}…  song=${r.currentSong ?? "none"}` +
      `  votes=${r._count.votes}  created=${r.createdAt.toISOString()}`,
  );
}

if (flag === "--delete-all") {
  const { count } = await prisma.room.deleteMany({});
  console.log(`\ndeleted ${count} room(s)`);
} else if (flag === "--keep-newest") {
  const keep = rooms[0];
  if (!keep) {
    console.log("\nnothing to delete");
  } else {
    const { count } = await prisma.room.deleteMany({
      where: { code: { not: keep.code } },
    });
    console.log(`\nkept ${keep.code}, deleted ${count} room(s)`);
  }
} else {
  console.log("\nread-only. pass --delete-all or --keep-newest to remove rooms");
}

await prisma.$disconnect();
