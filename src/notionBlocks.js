export function text(content) {
  return [{ type: "text", text: { content: String(content || "") } }];
}

export function heading1(content) {
  return {
    object: "block",
    type: "heading_1",
    heading_1: { rich_text: text(content) }
  };
}

export function heading2(content) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: text(content) }
  };
}

export function paragraph(content) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: text(content) }
  };
}

export function divider() {
  return {
    object: "block",
    type: "divider",
    divider: {}
  };
}

export function todoItem(content) {
  return {
    object: "block",
    type: "to_do",
    to_do: { rich_text: text(content), checked: false }
  };
}
