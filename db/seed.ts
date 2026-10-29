import { ensureSchema, requireDb } from './index';
import { attributeDefinitions } from './schema';

const DEFAULT_ATTRIBUTES = [
  {
    id: 'happiness_level',
    label: 'Happiness',
    type: 'slider',
    minValue: 0,
    maxValue: 100,
    step: 1,
    isActive: true,
    displayOrder: 0
  },
  {
    id: 'energy_level',
    label: 'Energy',
    type: 'slider',
    minValue: 0,
    maxValue: 100,
    step: 1,
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'anxiety_level',
    label: 'Anxiety',
    type: 'slider',
    minValue: 0,
    maxValue: 100,
    step: 1,
    isActive: true,
    displayOrder: 2
  }
] as const;

export async function seedAttributeDefinitions() {
  await ensureSchema();
  const database = requireDb();

  for (const attribute of DEFAULT_ATTRIBUTES) {
    await database
      .insert(attributeDefinitions)
      .values(attribute)
      .onConflictDoNothing({ target: attributeDefinitions.id });
  }
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seedAttributeDefinitions()
    .then(() => {
      console.log('Seeded default attribute definitions');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
