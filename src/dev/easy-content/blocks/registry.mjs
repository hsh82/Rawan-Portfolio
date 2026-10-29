export const EASY_CONTENT_BLOCKS = [
  { id: 'callout', label: 'Callout', template: '<Callout type="tip" title="Note">Write a short note.</Callout>' },
  { id: 'code', label: 'Code block', template: '```bash\n# Add code\n```' },
  { id: 'mermaid', label: 'Mermaid', template: '<MermaidDiagram label="Diagram" chart={`flowchart LR\\n  A[Start] --> B[Next]`} />' },
  { id: 'markmap', label: 'Markmap', template: '<MindMap label="Map" content={`# Topic\\n## Branch`} />' },
  { id: 'table', label: 'Table', template: '| Field | Value |\n| --- | --- |\n| Example | Add value |' },
  { id: 'figure', label: 'Figure', template: '<Figure src="/media/projects/project/image.webp" alt="Describe the image" caption="Optional caption" />' },
  { id: 'math', label: 'Math', template: '$$\\nE = mc^2\\n$$' },
];
