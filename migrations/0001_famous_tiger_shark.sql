CREATE TYPE "public"."script_status" AS ENUM('DRAFT', 'WRITING', 'REVIEW', 'READY_TO_FILM', 'FILMING', 'EDITING', 'READY_TO_PUBLISH', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."script_type" AS ENUM('TUTORIAL', 'REVIEW', 'VLOG', 'EDUCATIONAL', 'ENTERTAINMENT', 'OTHER');--> statement-breakpoint
CREATE TABLE "scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" "script_status" DEFAULT 'DRAFT' NOT NULL,
	"script_type" "script_type",
	"video_title" text,
	"description" text,
	"tags" text,
	"estimated_duration" integer,
	"target_publish_date" timestamp with time zone,
	"thumbnail_notes" text,
	"word_count" integer,
	"share_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scripts_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scripts_user_id_idx" ON "scripts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scripts_status_idx" ON "scripts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scripts_created_at_idx" ON "scripts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scripts_user_status_idx" ON "scripts" USING btree ("user_id","status");