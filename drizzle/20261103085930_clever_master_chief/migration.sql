-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"owner_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "invoices_customer_id_amount_date_key" UNIQUE("customer_id","amount","date"),
	CONSTRAINT "invoices_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "revenue" (
	"month" varchar(4) PRIMARY KEY,
	"revenue" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" text NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"password" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customers_owner_id_idx" ON "customers" ("owner_id");--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" ("user_id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
*/