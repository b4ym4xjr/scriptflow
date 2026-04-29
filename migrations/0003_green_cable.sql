CREATE TYPE "public"."collaborator_role" AS ENUM('VIEWER', 'EDITOR');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('COMMENT_ADDED', 'COLLABORATOR_ADDED', 'STATUS_CHANGED');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"script_id" uuid,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "script_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "collaborator_role" DEFAULT 'VIEWER' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sc_script_user_unique" UNIQUE("script_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "script_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "script_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"saved_by" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notif_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_collaborators" ADD CONSTRAINT "sc_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_collaborators" ADD CONSTRAINT "sc_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_comments" ADD CONSTRAINT "scom_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_comments" ADD CONSTRAINT "scom_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_versions" ADD CONSTRAINT "sv_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_versions" ADD CONSTRAINT "sv_saved_by_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notif_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "sc_script_id_idx" ON "script_collaborators" USING btree ("script_id");--> statement-breakpoint
CREATE INDEX "sc_user_id_idx" ON "script_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scom_script_id_idx" ON "script_comments" USING btree ("script_id");--> statement-breakpoint
CREATE INDEX "sv_script_id_idx" ON "script_versions" USING btree ("script_id");--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_share_token_unique" UNIQUE("share_token");