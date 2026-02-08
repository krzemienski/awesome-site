-- Add tsvector column for full-text search
ALTER TABLE "Resource" ADD COLUMN "search_vector" tsvector;

-- Populate search_vector for existing rows (title weighted A, description weighted B)
UPDATE "Resource" SET "search_vector" =
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'B');

-- Create GIN index for fast full-text search
CREATE INDEX "Resource_search_vector_idx" ON "Resource" USING GIN ("search_vector");

-- Create trigger function to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION resource_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on Resource table
CREATE TRIGGER resource_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "description"
  ON "Resource"
  FOR EACH ROW
  EXECUTE FUNCTION resource_search_vector_update();
