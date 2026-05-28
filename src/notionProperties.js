export function buildDatabaseProperties(fields) {
  const properties = {};

  for (const field of fields) {
    switch (field.type) {
      case "title":
        properties[field.name] = { title: {} };
        break;
      case "rich_text":
        properties[field.name] = { rich_text: {} };
        break;
      case "number":
        properties[field.name] = { number: { format: "number" } };
        break;
      case "date":
        properties[field.name] = { date: {} };
        break;
      case "select":
        properties[field.name] = {
          select: {
            options: field.options.map((name) => ({ name }))
          }
        };
        break;
      case "checkbox":
        properties[field.name] = { checkbox: {} };
        break;
      case "url":
        properties[field.name] = { url: {} };
        break;
      case "email":
        properties[field.name] = { email: {} };
        break;
      case "phone_number":
        properties[field.name] = { phone_number: {} };
        break;
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  return properties;
}
