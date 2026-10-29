import { AttributeManager } from 'components/admin/attribute-manager';
import { getAllAttributeDefinitions } from 'lib/queries';

export default async function AdminAttributesPage() {
  const attributes = await getAllAttributeDefinitions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Attributes</h1>
        <p className="mt-2 text-sm text-mute">
          These power the catalog filter sliders. Creating one here requires no migration.
        </p>
      </div>
      <AttributeManager attributes={attributes} />
    </div>
  );
}
