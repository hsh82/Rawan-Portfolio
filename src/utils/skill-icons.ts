import { Box, Braces, FileCode2, GitBranch, GitMerge, Globe2, Layers3, Network, Palette, PenTool, ServerCog, ShieldCheck, Terminal, TestTube2 } from '@lucide/astro';

export const categoryIcons: Record<string, any> = {
  cicd: GitMerge,
  containers: Box,
  infrastructure: ServerCog,
  network: Network,
  scripting: Terminal,
  design: Palette,
};

const aliases: Record<string, any> = {
  'gitlab-ci-cd': GitMerge, 'gitlab-runner': GitBranch, playwright: TestTube2,
  'quality-gates': ShieldCheck, rollback: GitBranch, docker: Box, 'docker-compose': Layers3,
  nginx: Globe2, harbor: Box, nexus: Layers3, 'health-checks': ShieldCheck, linux: Terminal,
  'vmware-esxi': ServerCog, vcenter: ServerCog, terraform: Braces, ansible: Braces,
  opnsense: ShieldCheck, vlan: Network, wireguard: ShieldCheck, mikrotik: Network,
  tls: ShieldCheck, dns: Globe2, python: Braces, bash: Terminal, 'technical-runbooks': FileCode2,
  jira: FileCode2, confluence: FileCode2, 'next-js': Braces, typescript: Braces, react: Braces,
  photoshop: Palette, illustrator: PenTool,
};

export function skillTechnologyId(label: string) {
  return label.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function technologyIcon(label: string) {
  return aliases[skillTechnologyId(label)] || FileCode2;
}
