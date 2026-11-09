/** MDX preview accepts static content, never imports, executable expressions or active HTML. */
const tags = new Set('div span p a img blockquote ul ol li table tr td th thead tbody pre code h1 h2 h3 h4 h5 h6 details summary em strong br hr sup sub section figure figcaption'.split(' '));
const components = new Set(['Callout','Figure','AttachmentDownload','MermaidDiagram','MindMap','CodeBlock','Tabs']);
function literal(node) {
  if (!node) return false;
  if (node.type === 'Literal') return !node.regex;
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0;
  if (node.type === 'ArrayExpression') return node.elements.every(literal);
  if (node.type === 'ObjectExpression') return node.properties.every(property => property.type === 'Property' && !property.computed && !property.method && property.kind === 'init' && !['__proto__','constructor','prototype'].includes(property.key.name || property.key.value) && literal(property.value));
  if (node.type === 'UnaryExpression') return ['-','+'].includes(node.operator) && node.argument.type === 'Literal' && typeof node.argument.value === 'number';
  return false;
}
function staticExpression(value) {
  const statements = value?.data?.estree?.body;
  return statements?.length === 1 && statements[0].type === 'ExpressionStatement' && literal(statements[0].expression);
}
function unsafeUrl(value) { return typeof value === 'string' && /^[\s\u0000-\u0020]*(?:javascript|vbscript|data):/i.test(value.replace(/[\u0000-\u0020]/g,'')); }

export function staticMdxPreview() {
  return tree => {
    const visit = node => {
      if (node.type === 'mdxjsEsm') throw new Error('Preview does not execute MDX imports or exports. Keep advanced code in Source.');
      if (['mdxFlowExpression','mdxTextExpression'].includes(node.type) && !staticExpression(node)) throw new Error('Preview supports static values only; executable MDX expressions remain in Source.');
      if (['mdxJsxFlowElement','mdxJsxTextElement'].includes(node.type)) {
        if (node.name && !tags.has(node.name) && !components.has(node.name)) throw new Error(`Unsupported active preview element: ${node.name}. Keep it in Source.`);
        for (const attribute of node.attributes || []) {
          if (attribute.type !== 'mdxJsxAttribute' || /^(?:on|dangerouslySetInnerHTML$|srcDoc$)/i.test(attribute.name)) throw new Error('Event handlers, spread attributes and active HTML are unavailable in read-only preview.');
          if (attribute.value && typeof attribute.value === 'object' && !staticExpression(attribute.value)) throw new Error(`Preview attribute ${attribute.name} requires a static value.`);
          const expression = attribute.value?.data?.estree?.body?.[0]?.expression;
          const value = typeof attribute.value === 'string' ? attribute.value : expression?.type === 'Literal' ? expression.value : expression?.type === 'TemplateLiteral' ? expression.quasis.map(part => part.value.cooked).join('') : undefined;
          if (['href','src','action','formAction','xlinkHref'].includes(attribute.name) && unsafeUrl(value)) throw new Error('Active URL schemes are unavailable in read-only preview.');
        }
      }
      if (['link','image','definition'].includes(node.type) && unsafeUrl(node.url)) throw new Error('Active URL schemes are unavailable in read-only preview.');
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}
