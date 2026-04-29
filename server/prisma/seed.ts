import {
  PrismaClient,
  AudioFormat,
  AlbumType,
  ReleaseStatus,
  PurchaseItemType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// =============================================================================
// HELPERS
// =============================================================================

const randomPrice = () => parseFloat((Math.random() * 10 + 1).toFixed(2));

const randomAudioFormat = () =>
  faker.helpers.arrayElement(Object.values(AudioFormat));

const randomGenreNames = [
  "Ambient",
  "Post-Rock",
  "Jazz",
  "Folk",
  "Electronic",
  "Classical",
  "Hip-Hop",
  "Soul",
  "Indie",
  "Experimental",
  "Metal",
  "Blues",
  "R&B",
  "Punk",
  "Shoegaze",
];

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("🌱 Seeding database...");

  // ---------------------------------------------------------------------------
  // GENRES
  // ---------------------------------------------------------------------------

  console.log("  Creating genres...");

  const genres = await Promise.all(
    randomGenreNames.map((name) =>
      prisma.genre.upsert({
        where: { slug: name.toLowerCase() },
        update: {},
        create: {
          name,
          slug: name.toLowerCase(),
        },
      }),
    ),
  );

  // ---------------------------------------------------------------------------
  // ARTISTS (3 users with artist profiles)
  // ---------------------------------------------------------------------------

  console.log("  Creating artists...");

  const artistUsers = await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          passwordHash: faker.string.alphanumeric(60),
          artistProfile: {
            create: {
              displayName: faker.person.fullName(),
              bio: faker.lorem.paragraph(3),
              avatarUrl: faker.image.avatar(),
              location: faker.location.city(),
              website: faker.internet.url(),
            },
          },
          listenerProfile: {
            create: {},
          },
        },
        include: {
          artistProfile: true,
          listenerProfile: true,
        },
      });
      return user;
    }),
  );

  // ---------------------------------------------------------------------------
  // ALBUMS & TRACKS
  // ---------------------------------------------------------------------------

  console.log("  Creating albums and tracks...");

  for (const artistUser of artistUsers) {
    const artistProfile = artistUser.artistProfile!;

    // 2 albums per artist
    for (let a = 0; a < 2; a++) {
      const albumGenres = faker.helpers.arrayElements(genres, 2);

      const album = await prisma.album.create({
        data: {
          title: faker.music.songName(),
          description: faker.lorem.paragraph(2),
          albumType: faker.helpers.arrayElement(Object.values(AlbumType)),
          releaseDate: faker.date.past({ years: 3 }),
          status: ReleaseStatus.PUBLISHED,
          artworkUrl: faker.image.url(),
          price: randomPrice(),
          artistProfileId: artistProfile.id,
          genres: {
            connect: albumGenres.map((g) => ({ id: g.id })),
          },
        },
      });

      // 4 tracks per album
      for (let t = 0; t < 4; t++) {
        const trackGenres = faker.helpers.arrayElements(genres, 2);

        const track = await prisma.track.create({
          data: {
            title: faker.music.songName(),
            description: faker.lorem.paragraph(2),
            releaseDate: faker.date.past({ years: 3 }),
            status: ReleaseStatus.PUBLISHED,
            artworkUrl: faker.image.url(),
            price: randomPrice(),
            trackNumber: t + 1,
            artistProfileId: artistProfile.id,
            albumId: album.id,
            genres: {
              connect: trackGenres.map((g) => ({ id: g.id })),
            },
            files: {
              create: [
                {
                  format: AudioFormat.MP3,
                  quality: "320kbps",
                  url: faker.internet.url(),
                  sizeBytes: faker.number.int({
                    min: 5_000_000,
                    max: 15_000_000,
                  }),
                },
                {
                  format: AudioFormat.FLAC,
                  quality: "lossless",
                  url: faker.internet.url(),
                  sizeBytes: faker.number.int({
                    min: 20_000_000,
                    max: 50_000_000,
                  }),
                },
              ],
            },
            audioFeatures: {
              create: {
                analyzedAt: new Date(),
                tempo: faker.number.float({
                  min: 60,
                  max: 180,
                  fractionDigits: 2,
                }),
                key: faker.number.int({ min: 0, max: 11 }),
                mode: faker.helpers.arrayElement([0, 1]),
                energy: faker.number.float({
                  min: 0,
                  max: 1,
                  fractionDigits: 3,
                }),
                spectralCentroid: faker.number.float({
                  min: 500,
                  max: 8000,
                  fractionDigits: 2,
                }),
                qdrantVectorId: faker.string.uuid(),
              },
            },
          },
        });

        console.log(`    Created track: ${track.title}`);
      }
    }

    // 1 standalone single per artist
    const single = await prisma.track.create({
      data: {
        title: faker.music.songName(),
        description: faker.lorem.paragraph(2),
        releaseDate: faker.date.past({ years: 1 }),
        status: ReleaseStatus.PUBLISHED,
        artworkUrl: faker.image.url(),
        price: randomPrice(),
        artistProfileId: artistProfile.id,
        genres: {
          connect: [faker.helpers.arrayElement(genres)].map((g) => ({
            id: g.id,
          })),
        },
        files: {
          create: {
            format: AudioFormat.FLAC,
            quality: "lossless",
            url: faker.internet.url(),
            sizeBytes: faker.number.int({ min: 20_000_000, max: 50_000_000 }),
          },
        },
        audioFeatures: {
          create: {
            analyzedAt: new Date(),
            tempo: faker.number.float({ min: 60, max: 180, fractionDigits: 2 }),
            key: faker.number.int({ min: 0, max: 11 }),
            mode: faker.helpers.arrayElement([0, 1]),
            energy: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
            spectralCentroid: faker.number.float({
              min: 500,
              max: 8000,
              fractionDigits: 2,
            }),
            qdrantVectorId: faker.string.uuid(),
          },
        },
      },
    });

    console.log(`    Created standalone single: ${single.title}`);
  }

  // ---------------------------------------------------------------------------
  // LISTENERS (5 pure listener accounts)
  // ---------------------------------------------------------------------------

  console.log("  Creating listeners...");

  const listenerUsers = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          passwordHash: faker.string.alphanumeric(60),
          listenerProfile: {
            create: {},
          },
        },
        include: { listenerProfile: true },
      }),
    ),
  );

  // ---------------------------------------------------------------------------
  // PURCHASES & LIBRARY ITEMS
  // ---------------------------------------------------------------------------

  console.log("  Creating purchases and library items...");

  const allTracks = await prisma.track.findMany({ take: 10 });
  const allAlbums = await prisma.album.findMany({ take: 4 });

  for (const listenerUser of listenerUsers) {
    const listenerProfile = listenerUser.listenerProfile!;

    // Buy 2 random tracks
    const purchasedTracks = faker.helpers.arrayElements(allTracks, 2);

    for (const track of purchasedTracks) {
      const totalPaid = parseFloat(track.price.toString());
      const artistReceives = parseFloat((totalPaid * 0.9).toFixed(2));
      const platformReceives = parseFloat((totalPaid * 0.1).toFixed(2));
      const addCharity = faker.datatype.boolean();

      const purchase = await prisma.purchase.create({
        data: {
          listenerProfileId: listenerProfile.id,
          itemType: PurchaseItemType.TRACK,
          trackId: track.id,
          totalPaid,
          artistReceives,
          platformReceives,
          charityAmount: addCharity
            ? parseFloat((totalPaid * 0.05).toFixed(2))
            : null,
          charityOrganisation: addCharity
            ? faker.helpers.arrayElement([
                "Music Declares Emergency",
                "Sweet Relief",
                "MusiCares",
              ])
            : null,
          downloadFormat: randomAudioFormat(),
        },
      });

      await prisma.libraryItem.create({
        data: {
          listenerProfileId: listenerProfile.id,
          purchaseId: purchase.id,
          trackId: track.id,
        },
      });
    }

    // Buy 1 random album
    const purchasedAlbum = faker.helpers.arrayElement(allAlbums);
    const albumTotal = parseFloat(purchasedAlbum.price.toString());

    const albumPurchase = await prisma.purchase.create({
      data: {
        listenerProfileId: listenerProfile.id,
        itemType: PurchaseItemType.ALBUM,
        albumId: purchasedAlbum.id,
        totalPaid: albumTotal,
        artistReceives: parseFloat((albumTotal * 0.9).toFixed(2)),
        platformReceives: parseFloat((albumTotal * 0.1).toFixed(2)),
        downloadFormat: randomAudioFormat(),
      },
    });

    await prisma.libraryItem.create({
      data: {
        listenerProfileId: listenerProfile.id,
        purchaseId: albumPurchase.id,
        albumId: purchasedAlbum.id,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // COMMENTS
  // ---------------------------------------------------------------------------

  console.log("  Creating comments...");

  const allListenerProfiles = await prisma.listenerProfile.findMany({
    take: 5,
  });
  const commentTracks = await prisma.track.findMany({ take: 5 });

  for (const track of commentTracks) {
    const commenter = faker.helpers.arrayElement(allListenerProfiles);
    await prisma.comment.create({
      data: {
        body: faker.lorem.sentences(2),
        listenerProfileId: commenter.id,
        trackId: track.id,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // EVENTS
  // ---------------------------------------------------------------------------

  console.log("  Creating events...");

  for (const artistUser of artistUsers) {
    const artistProfile = artistUser.artistProfile!;

    await prisma.event.create({
      data: {
        title: `${artistProfile.displayName} Live`,
        description: faker.lorem.paragraph(),
        venue: faker.company.name(),
        city: faker.location.city(),
        country: faker.location.country(),
        date: faker.date.future({ years: 1 }),
        ticketUrl: faker.internet.url(),
        artistProfileId: artistProfile.id,
      },
    });
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
