const { initializeDatabase, getDB } = require("../database/db");

async function run() {
  try {
    await initializeDatabase();
    const db = getDB();

    const [rows] = await db.query(
      "SELECT id, title, image, hero_image AS heroImage, gallery FROM designs"
    );

    let updated = 0;

    for (const row of rows) {
      const needsImage = !row.image || String(row.image).trim() === "";
      const needsHero = !row.heroImage || String(row.heroImage).trim() === "";
      const needsGallery = !row.gallery || (Array.isArray(row.gallery) && row.gallery.length === 0);

      if (needsImage || needsHero || needsGallery) {
        // Use a generic Unsplash query for interior design as placeholder
        const placeholder = `https://source.unsplash.com/featured/?interior,design&sig=${row.id}`;

        const image = needsImage ? placeholder : row.image;
        const hero = needsHero ? placeholder : row.heroImage || image;
        const gallery = needsGallery ? JSON.stringify([image]) : (Array.isArray(row.gallery) ? JSON.stringify(row.gallery) : row.gallery);

        await db.query(
          "UPDATE designs SET image = ?, hero_image = ?, gallery = ? WHERE id = ?",
          [image, hero, gallery, row.id]
        );

        console.log(`Updated design id=${row.id} title='${row.title}'`);
        updated++;
      }
    }

    console.log(`Done. Updated ${updated} design(s).`);
    process.exit(0);
  } catch (error) {
    console.error("Error filling images:", error);
    process.exit(1);
  }
}

run();
