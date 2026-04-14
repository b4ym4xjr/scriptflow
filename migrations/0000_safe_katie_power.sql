CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"email_verified" timestamp with time zone,
	"verification_token" text,
	"verification_token_expiry" timestamp with time zone,
	"password_reset_token" text,
	"password_reset_token_expiry" timestamp with time zone,
	"last_activity_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
