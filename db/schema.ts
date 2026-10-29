import { pgTable, varchar, integer, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const attributeDefinitions = pgTable('attribute_definitions', {
  id: varchar('id', { length: 100 }).primaryKey(),
  label: varchar('label', { length: 150 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('slider'),
  minValue: integer('min_value').notNull().default(0),
  maxValue: integer('max_value').notNull().default(100),
  step: integer('step').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const productMetadata = pgTable('product_metadata', {
  fourthwallProductId: varchar('fourthwall_product_id', { length: 255 }).primaryKey(),
  metrics: jsonb('metrics').$type<Record<string, number>>().notNull().default({}),
  moodTags: text('mood_tags').array().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const orderFulfillments = pgTable('order_fulfillments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  fourthwallOrderId: varchar('fourthwall_order_id', { length: 255 }).notNull(),
  prodigiOrderId: varchar('prodigi_order_id', { length: 255 }),
  fulfillmentType: varchar('fulfillment_type', { length: 50 }).notNull(),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrier: varchar('carrier', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type AttributeDefinition = typeof attributeDefinitions.$inferSelect;
export type ProductMetadata = typeof productMetadata.$inferSelect;
export type OrderFulfillment = typeof orderFulfillments.$inferSelect;
