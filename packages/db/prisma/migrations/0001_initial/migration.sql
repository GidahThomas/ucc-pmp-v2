-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'technician', 'accountant', 'tenant');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'blocked');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "national_id" VARCHAR(100),
    "nationality" VARCHAR(100),
    "occupation" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'tenant',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "privileges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "country" (
    "country_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "country_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "country_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "region" (
    "region_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "country_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "region_pkey" PRIMARY KEY ("region_id")
);

-- CreateTable
CREATE TABLE "district" (
    "district_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "district_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "district_pkey" PRIMARY KEY ("district_id")
);

-- CreateTable
CREATE TABLE "street" (
    "street_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "street_name" VARCHAR(255) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "street_pkey" PRIMARY KEY ("street_id")
);

-- CreateTable
CREATE TABLE "ward" (
    "ward_id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "ward_name" VARCHAR(255) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "ward_pkey" PRIMARY KEY ("ward_id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "country_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "region_id" INTEGER NOT NULL,
    "street_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_location" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER,
    "property_id" INTEGER,
    "status_id" INTEGER,

    CONSTRAINT "property_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_source" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "list_Name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "sort_by" VARCHAR(255),
    "description" TEXT,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "list_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "property_name" VARCHAR(255) NOT NULL,
    "property_type_id" INTEGER NOT NULL,
    "description" TEXT,
    "identifier_code" VARCHAR(200) NOT NULL,
    "street_id" INTEGER,
    "property_status_id" INTEGER NOT NULL,
    "document_url" TEXT,
    "ownership_type_id" INTEGER NOT NULL,
    "usage_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_price" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "unit_amount" DECIMAL(18,2) NOT NULL,
    "period" VARCHAR(50),
    "min_monthly_rent" DECIMAL(18,2),
    "max_monthly_rent" DECIMAL(18,2),
    "property_id" INTEGER NOT NULL,
    "price_type" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "property_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_attribute" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "attribute_name" VARCHAR(255) NOT NULL,
    "attribute_name_dataType_id" INTEGER NOT NULL,
    "property_type_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "property_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_attribute_answer" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "property_attribute_id" INTEGER NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "property_attribute_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_extra_data" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "property_id" INTEGER NOT NULL,
    "property_attribute_id" INTEGER NOT NULL,
    "attribute_answer_id" INTEGER,
    "attribute_answer_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "property_extra_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "lease_number" VARCHAR(100),
    "property_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "property_price_id" INTEGER NOT NULL,
    "lease_doc_url" VARCHAR(255),
    "status" INTEGER NOT NULL,
    "lease_start_date" DATE NOT NULL,
    "lease_end_date" DATE NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(100) NOT NULL,
    "lease_id" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "bill_status" INTEGER,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "country_uuid_key" ON "country"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "region_uuid_key" ON "region"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "district_uuid_key" ON "district"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "street_uuid_key" ON "street"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ward_uuid_key" ON "ward"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "location_uuid_key" ON "location"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "list_source_uuid_key" ON "list_source"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "property_uuid_key" ON "property"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "property_identifier_code_key" ON "property"("identifier_code");

-- CreateIndex
CREATE UNIQUE INDEX "property_price_uuid_key" ON "property_price"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "property_attribute_uuid_key" ON "property_attribute"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "property_attribute_answer_uuid_key" ON "property_attribute_answer"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "property_extra_data_uuid_key" ON "property_extra_data"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "lease_uuid_key" ON "lease"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "lease_lease_number_key" ON "lease"("lease_number");

-- CreateIndex
CREATE UNIQUE INDEX "bill_uuid_key" ON "bill"("uuid");

-- AddForeignKey
ALTER TABLE "region" ADD CONSTRAINT "region_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("country_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district" ADD CONSTRAINT "district_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "street" ADD CONSTRAINT "street_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "street" ADD CONSTRAINT "street_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "district"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ward" ADD CONSTRAINT "ward_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ward" ADD CONSTRAINT "ward_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "district"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("country_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "district"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_street_id_fkey" FOREIGN KEY ("street_id") REFERENCES "street"("street_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_location" ADD CONSTRAINT "property_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_location" ADD CONSTRAINT "property_location_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_location" ADD CONSTRAINT "property_location_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "list_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_source" ADD CONSTRAINT "list_source_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "list_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_property_status_id_fkey" FOREIGN KEY ("property_status_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_ownership_type_id_fkey" FOREIGN KEY ("ownership_type_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_usage_type_id_fkey" FOREIGN KEY ("usage_type_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_street_id_fkey" FOREIGN KEY ("street_id") REFERENCES "street"("street_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_price" ADD CONSTRAINT "property_price_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_price" ADD CONSTRAINT "property_price_price_type_fkey" FOREIGN KEY ("price_type") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute" ADD CONSTRAINT "property_attribute_attribute_name_dataType_id_fkey" FOREIGN KEY ("attribute_name_dataType_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute" ADD CONSTRAINT "property_attribute_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "list_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute_answer" ADD CONSTRAINT "property_attribute_answer_property_attribute_id_fkey" FOREIGN KEY ("property_attribute_id") REFERENCES "property_attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attribute_answer" ADD CONSTRAINT "property_attribute_answer_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_extra_data" ADD CONSTRAINT "property_extra_data_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_extra_data" ADD CONSTRAINT "property_extra_data_property_attribute_id_fkey" FOREIGN KEY ("property_attribute_id") REFERENCES "property_attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_extra_data" ADD CONSTRAINT "property_extra_data_attribute_answer_id_fkey" FOREIGN KEY ("attribute_answer_id") REFERENCES "property_attribute_answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_property_price_id_fkey" FOREIGN KEY ("property_price_id") REFERENCES "property_price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_status_fkey" FOREIGN KEY ("status") REFERENCES "list_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_bill_status_fkey" FOREIGN KEY ("bill_status") REFERENCES "list_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
