// updateImageUrls.mjs
import { db } from "./src/db/db.js";
import { submissionsImages } from "./src/db/schema.js";
import { sql } from "drizzle-orm";

async function updateImageUrls() {
  console.log("Starting image URL update...");

  try {
    const imagesToUpdate = await db
      .select()
      .from(submissionsImages)
      .where(sql`imageUrl LIKE '/uploads/%'`);

    if (imagesToUpdate.length === 0) {
      console.log("No image URLs to update.");
      return;
    }

    console.log(`Found ${imagesToUpdate.length} image(s) to update.`);

    for (const image of imagesToUpdate) {
      const newImageUrl = image.imageUrl.replace("/uploads/", "/api/uploads/");
      await db
        .update(submissionsImages)
        .set({ imageUrl: newImageUrl })
        .where(sql`id = ${image.id}`);
      console.log(`Updated image ID ${image.id} to: ${newImageUrl}`);
    }

    console.log("Image URL update complete! ✨");
  } catch (error) {
    console.error("An error occurred during the update:", error);
  } finally {
    // It's good practice to end the process explicitly
    // to ensure the script doesn't hang.
    process.exit(0);
  }
}

updateImageUrls();
