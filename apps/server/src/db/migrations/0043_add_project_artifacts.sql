CREATE TABLE IF NOT EXISTS "project_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_artifacts_project_artifact_unique" UNIQUE("project_id","artifact_id")
);

DO $$ BEGIN
 ALTER TABLE "project_artifacts" ADD CONSTRAINT "project_artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_artifacts" ADD CONSTRAINT "project_artifacts_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "project_artifacts_project_id_idx" ON "project_artifacts" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "project_artifacts_artifact_id_idx" ON "project_artifacts" USING btree ("artifact_id");
