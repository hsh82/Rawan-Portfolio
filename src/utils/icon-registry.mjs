export const ICON_REGISTRY = [
  { id: 'gitlab-ci-cd', label: 'GitLab CI/CD', lucide: 'git-merge', keywords: 'pipeline delivery automation' },
  { id: 'gitlab-runner', label: 'GitLab Runner', lucide: 'git-branch', keywords: 'runner pipeline automation' },
  { id: 'playwright', label: 'Playwright', lucide: 'test-tube-diagonal', keywords: 'testing browser automation' },
  { id: 'quality-gates', label: 'Quality gates', lucide: 'shield-check', keywords: 'quality testing validation' },
  { id: 'rollback', label: 'Rollback', lucide: 'git-branch', keywords: 'recovery release deployment' },
  { id: 'docker', label: 'Docker', lucide: 'box', keywords: 'container image registry' },
  { id: 'docker-compose', label: 'Docker Compose', lucide: 'layers', keywords: 'container orchestration' },
  { id: 'nginx', label: 'Nginx', lucide: 'earth', keywords: 'proxy web server' },
  { id: 'harbor', label: 'Harbor', lucide: 'box', keywords: 'container registry' },
  { id: 'nexus', label: 'Nexus', lucide: 'layers', keywords: 'artifact registry repository' },
  { id: 'health-checks', label: 'Health checks', lucide: 'shield-check', keywords: 'monitoring reliability' },
  { id: 'linux', label: 'Linux', lucide: 'terminal', keywords: 'operating system shell' },
  { id: 'vmware-esxi', label: 'VMware ESXi', lucide: 'server-cog', keywords: 'virtualization infrastructure' },
  { id: 'vcenter', label: 'vCenter', lucide: 'server-cog', keywords: 'virtualization infrastructure' },
  { id: 'terraform', label: 'Terraform', lucide: 'braces', keywords: 'infrastructure as code' },
  { id: 'ansible', label: 'Ansible', lucide: 'braces', keywords: 'automation configuration' },
  { id: 'opnsense', label: 'OPNsense', lucide: 'shield-check', keywords: 'firewall security network' },
  { id: 'vlan', label: 'VLAN', lucide: 'network', keywords: 'network segmentation' },
  { id: 'wireguard', label: 'WireGuard', lucide: 'shield-check', keywords: 'vpn security' },
  { id: 'mikrotik', label: 'MikroTik', lucide: 'network', keywords: 'network routing' },
  { id: 'tls', label: 'TLS', lucide: 'shield-check', keywords: 'security certificate encryption' },
  { id: 'dns', label: 'DNS', lucide: 'earth', keywords: 'network domain' },
  { id: 'python', label: 'Python', lucide: 'braces', keywords: 'programming scripting' },
  { id: 'bash', label: 'Bash', lucide: 'terminal', keywords: 'shell scripting command line' },
  { id: 'technical-runbooks', label: 'Technical runbooks', lucide: 'file-code-2', keywords: 'documentation operations' },
  { id: 'jira', label: 'Jira', lucide: 'file-code-2', keywords: 'project management issue tracking' },
  { id: 'confluence', label: 'Confluence', lucide: 'file-code-2', keywords: 'documentation collaboration' },
  { id: 'next-js', label: 'Next.js', lucide: 'braces', keywords: 'react web framework' },
  { id: 'typescript', label: 'TypeScript', lucide: 'braces', keywords: 'programming javascript' },
  { id: 'react', label: 'React', lucide: 'braces', keywords: 'frontend javascript' },
  { id: 'photoshop', label: 'Photoshop', lucide: 'palette', keywords: 'design graphics' },
  { id: 'illustrator', label: 'Illustrator', lucide: 'pen-tool', keywords: 'design vector graphics' },
  { id: 'server', label: 'Server', lucide: 'server', keywords: 'infrastructure hosting' },
  { id: 'git-branch', label: 'Git branch', lucide: 'git-branch', keywords: 'version control source code' },
  { id: 'shopping-bag', label: 'Shopping bag', lucide: 'shopping-bag', keywords: 'commerce retail product' },
];

export const ICON_IDS = ICON_REGISTRY.map(icon => icon.id);
export const ICON_BY_ID = Object.fromEntries(ICON_REGISTRY.map(icon => [icon.id, icon]));

export function iconDefinition(value) {
  return typeof value === 'string' ? ICON_BY_ID[value.trim()] : undefined;
}

export function isRegisteredIcon(value) {
  return Boolean(iconDefinition(value));
}
