import bcrypt from 'bcryptjs';

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const now = new Date();

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function seedUsers() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const tenantPassword = await bcrypt.hash('Tenant@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ucc-pmp.local' },
    update: {},
    create: {
      uuid: 'User_1',
      fullName: 'System Admin',
      email: 'admin@ucc-pmp.local',
      passwordHash: adminPassword,
      phone: '+255700000001',
      nationalId: 'TZ-ADMIN-001',
      nationality: 'Tanzanian',
      occupation: 'Administrator',
      role: UserRole.admin,
      status: UserStatus.active,
      privileges: ['create', 'edit', 'delete', 'assign', 'view', 'manage'],
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@ucc-pmp.local' },
    update: {},
    create: {
      uuid: 'User_2',
      fullName: 'Property Manager',
      email: 'manager@ucc-pmp.local',
      passwordHash: managerPassword,
      phone: '+255700000002',
      nationalId: 'TZ-MGR-001',
      nationality: 'Tanzanian',
      occupation: 'Manager',
      role: UserRole.manager,
      status: UserStatus.active,
      privileges: ['create', 'edit', 'view'],
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@ucc-pmp.local' },
    update: {},
    create: {
      uuid: 'User_3',
      fullName: 'Amina Kassim',
      email: 'tenant@ucc-pmp.local',
      passwordHash: tenantPassword,
      phone: '+255700000003',
      nationalId: 'TZ-TEN-001',
      nationality: 'Tanzanian',
      occupation: 'Business Owner',
      role: UserRole.tenant,
      status: UserStatus.active,
      privileges: [],
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  return { admin, manager, tenant };
}

async function seedGeography(adminId: number) {
  const country = await prisma.country.upsert({
    where: { uuid: 'Cou_1' },
    update: {},
    create: {
      uuid: 'Cou_1',
      countryName: 'Tanzania',
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const region = await prisma.region.upsert({
    where: { uuid: 'Reg_1' },
    update: {},
    create: {
      uuid: 'Reg_1',
      name: 'Dar es Salaam',
      countryId: country.id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const district = await prisma.district.upsert({
    where: { uuid: 'Dis_1' },
    update: {},
    create: {
      uuid: 'Dis_1',
      districtName: 'Ilala',
      regionId: region.id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const street = await prisma.street.upsert({
    where: { uuid: 'Stre_1' },
    update: {},
    create: {
      uuid: 'Stre_1',
      streetName: 'Ohio Street',
      regionId: region.id,
      districtId: district.id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const location = await prisma.location.upsert({
    where: { uuid: 'Loc_1' },
    update: {},
    create: {
      uuid: 'Loc_1',
      countryId: country.id,
      regionId: region.id,
      districtId: district.id,
      streetId: street.id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  return { country, region, district, street, location };
}

async function seedListSources(adminId: number) {
  const parents = [
    { uuid: 'List_1', listName: 'Usage Type', category: 'Usage Type', code: 'LIST101', sortBy: '1' },
    { uuid: 'List_2', listName: 'Property Type', category: 'Property Type', code: 'LIST102', sortBy: '2' },
    { uuid: 'List_3', listName: 'Ownership', category: 'Ownership', code: 'LIST103', sortBy: '3' },
    { uuid: 'List_4', listName: 'Status', category: 'Status', code: 'LIST104', sortBy: '4' },
    { uuid: 'List_5', listName: 'Lease Status', category: 'Lease Status', code: 'LIST105', sortBy: '5' },
    { uuid: 'List_6', listName: 'Bill Status', category: 'Bill Status', code: 'LIST106', sortBy: '6' },
    { uuid: 'List_7', listName: 'Data Type', category: 'Data Type', code: 'LIST107', sortBy: '7' },
    { uuid: 'List_8', listName: 'Furnished', category: 'Furnished', code: 'LIST108', sortBy: '8' },
  ] as const;

  for (const parent of parents) {
    await prisma.listSource.upsert({
      where: { uuid: parent.uuid },
      update: {},
      create: {
        ...parent,
        parentId: null,
        createdById: adminId,
        updatedById: adminId,
      },
    });
  }

  const parentMap = Object.fromEntries(
    (await prisma.listSource.findMany({
      where: { uuid: { in: parents.map((item) => item.uuid) } },
    })).map((item) => [item.uuid, item.id]),
  );

  const children = [
    { uuid: 'List_9', listName: 'Sale', category: 'Usage Type', code: 'LIST109', sortBy: '9', parentId: parentMap.List_1 },
    { uuid: 'List_10', listName: 'Rented', category: 'Usage Type', code: 'LIST110', sortBy: '10', parentId: parentMap.List_1 },
    { uuid: 'List_11', listName: 'Storage', category: 'Usage Type', code: 'LIST111', sortBy: '11', parentId: parentMap.List_1 },
    { uuid: 'List_12', listName: 'House', category: 'Property Type', code: 'LIST112', sortBy: '12', parentId: parentMap.List_2 },
    { uuid: 'List_13', listName: 'Shop', category: 'Property Type', code: 'LIST113', sortBy: '13', parentId: parentMap.List_2 },
    { uuid: 'List_14', listName: 'Owned', category: 'Ownership', code: 'LIST114', sortBy: '14', parentId: parentMap.List_3 },
    { uuid: 'List_15', listName: 'Managed', category: 'Ownership', code: 'LIST115', sortBy: '15', parentId: parentMap.List_3 },
    { uuid: 'List_16', listName: 'Available', category: 'Status', code: 'LIST116', sortBy: '16', parentId: parentMap.List_4 },
    { uuid: 'List_17', listName: 'Occupied', category: 'Status', code: 'LIST117', sortBy: '17', parentId: parentMap.List_4 },
    { uuid: 'List_18', listName: 'Active', category: 'Lease Status', code: 'LIST118', sortBy: '18', parentId: parentMap.List_5 },
    { uuid: 'List_19', listName: 'Pending', category: 'Lease Status', code: 'LIST119', sortBy: '19', parentId: parentMap.List_5 },
    { uuid: 'List_20', listName: 'Terminated', category: 'Lease Status', code: 'LIST120', sortBy: '20', parentId: parentMap.List_5 },
    { uuid: 'List_21', listName: 'Pending', category: 'Bill Status', code: 'LIST121', sortBy: '21', parentId: parentMap.List_6 },
    { uuid: 'List_22', listName: 'Paid', category: 'Bill Status', code: 'LIST122', sortBy: '22', parentId: parentMap.List_6 },
    { uuid: 'List_23', listName: 'Overdue', category: 'Bill Status', code: 'LIST123', sortBy: '23', parentId: parentMap.List_6 },
    { uuid: 'List_24', listName: 'Text', category: 'Data Type', code: 'LIST124', sortBy: '24', parentId: parentMap.List_7 },
    { uuid: 'List_25', listName: 'Number', category: 'Data Type', code: 'LIST125', sortBy: '25', parentId: parentMap.List_7 },
    { uuid: 'List_26', listName: 'Boolean', category: 'Data Type', code: 'LIST126', sortBy: '26', parentId: parentMap.List_7 },
    { uuid: 'List_27', listName: 'Select', category: 'Data Type', code: 'LIST127', sortBy: '27', parentId: parentMap.List_7 },
    { uuid: 'List_28', listName: 'Yes', category: 'Furnished', code: 'LIST128', sortBy: '28', parentId: parentMap.List_8 },
    { uuid: 'List_29', listName: 'No', category: 'Furnished', code: 'LIST129', sortBy: '29', parentId: parentMap.List_8 },
  ] as const;

  for (const child of children) {
    await prisma.listSource.upsert({
      where: { uuid: child.uuid },
      update: {},
      create: {
        ...child,
        createdById: adminId,
        updatedById: adminId,
      },
    });
  }
}

async function seedProperties(adminId: number, managerId: number, tenantId: number, streetId: number) {
  const listSources = Object.fromEntries(
    (await prisma.listSource.findMany()).map((item) => [item.uuid, item]),
  );
  const getListSource = (uuid: string) => {
    const listSource = listSources[uuid];
    if (!listSource) {
      throw new Error(`Missing seeded list source: ${uuid}`);
    }

    return listSource;
  };

  const propertyOne = await prisma.property.upsert({
    where: { uuid: 'Prop_1' },
    update: {},
    create: {
      uuid: 'Prop_1',
      propertyName: 'Masaki Executive House',
      propertyTypeId: getListSource('List_12').id,
      propertyStatusId: getListSource('List_16').id,
      ownershipTypeId: getListSource('List_14').id,
      usageTypeId: getListSource('List_10').id,
      streetId,
      identifierCode: 'PROP-MASAKI-001',
      description: 'Four-bedroom house with parking and perimeter wall.',
      documentUrl: '/seed/property-house.svg',
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const propertyTwo = await prisma.property.upsert({
    where: { uuid: 'Prop_2' },
    update: {},
    create: {
      uuid: 'Prop_2',
      propertyName: 'City Shopfront',
      propertyTypeId: getListSource('List_13').id,
      propertyStatusId: getListSource('List_17').id,
      ownershipTypeId: getListSource('List_14').id,
      usageTypeId: getListSource('List_9').id,
      streetId,
      identifierCode: 'PROP-CITY-002',
      description: 'Retail frontage suitable for pharmacy or boutique use.',
      documentUrl: '/seed/city-shop.svg',
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const priceOne = await prisma.propertyPrice.upsert({
    where: { uuid: 'Price_1' },
    update: {},
    create: {
      uuid: 'Price_1',
      propertyId: propertyOne.id,
      priceTypeId: getListSource('List_10').id,
      unitAmount: 2500000,
      period: 'Monthly',
      minMonthlyRent: 2400000,
      maxMonthlyRent: 2600000,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  await prisma.propertyPrice.upsert({
    where: { uuid: 'Price_2' },
    update: {},
    create: {
      uuid: 'Price_2',
      propertyId: propertyTwo.id,
      priceTypeId: getListSource('List_9').id,
      unitAmount: 320000000,
      period: 'Yearly',
      minMonthlyRent: 0,
      maxMonthlyRent: 0,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const bedroomsAttribute = await prisma.propertyAttribute.upsert({
    where: { uuid: 'Attr_1' },
    update: {},
    create: {
      uuid: 'Attr_1',
      attributeName: 'Bedrooms',
      attributeDataTypeId: getListSource('List_25').id,
      propertyTypeId: getListSource('List_12').id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const furnishedAttribute = await prisma.propertyAttribute.upsert({
    where: { uuid: 'Attr_2' },
    update: {},
    create: {
      uuid: 'Attr_2',
      attributeName: 'Furnished',
      attributeDataTypeId: getListSource('List_27').id,
      propertyTypeId: getListSource('List_12').id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const furnishedAnswer = await prisma.propertyAttributeAnswer.upsert({
    where: { uuid: 'PAA_1' },
    update: {},
    create: {
      uuid: 'PAA_1',
      propertyAttributeId: furnishedAttribute.id,
      answerId: getListSource('List_28').id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  await prisma.propertyExtraData.upsert({
    where: { uuid: 'PED_1' },
    update: {},
    create: {
      uuid: 'PED_1',
      propertyId: propertyOne.id,
      propertyAttributeId: bedroomsAttribute.id,
      attributeAnswerText: '4',
      createdById: adminId,
      updatedById: adminId,
    },
  });

  await prisma.propertyExtraData.upsert({
    where: { uuid: 'PED_2' },
    update: {},
    create: {
      uuid: 'PED_2',
      propertyId: propertyOne.id,
      propertyAttributeId: furnishedAttribute.id,
      attributeAnswerId: furnishedAnswer.id,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  const lease = await prisma.lease.upsert({
    where: { uuid: 'Lease_1' },
    update: {},
    create: {
      uuid: 'Lease_1',
      leaseNumber: 'LEASE-0001',
      propertyId: propertyOne.id,
      tenantId,
      propertyPriceId: priceOne.id,
      leaseDocUrl: '/seed/lease-sample.txt',
      statusId: getListSource('List_18').id,
      leaseStartDate: now,
      leaseEndDate: addMonths(now, 12),
      durationMonths: 12,
      createdById: managerId,
      updatedById: managerId,
    },
  });

  await prisma.bill.upsert({
    where: { uuid: 'Bill_1' },
    update: {},
    create: {
      uuid: 'Bill_1',
      leaseId: lease.id,
      amount: 30000000,
      dueDate: now,
      billStatusId: getListSource('List_21').id,
      createdById: managerId,
      updatedById: managerId,
    },
  });
}

async function main() {
  const { admin, manager, tenant } = await seedUsers();
  const { street } = await seedGeography(admin.id);
  await seedListSources(admin.id);
  await seedProperties(admin.id, manager.id, tenant.id, street.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
