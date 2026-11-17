CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"team_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" varchar(64) NOT NULL CONSTRAINT "team_invitations_token_hash_key" UNIQUE,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "team_invitations_state_check" CHECK (NOT (
        "accepted_at" IS NOT NULL
        AND "revoked_at" IS NOT NULL
      ))
);
--> statement-breakpoint
CREATE INDEX "team_invitations_team_id_idx" ON "team_invitations" ("team_id");--> statement-breakpoint
CREATE INDEX "team_invitations_email_idx" ON "team_invitations" ("email");--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE;