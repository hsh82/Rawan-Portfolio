import { Box, Braces, FileCode2, GitBranch, GitMerge, Globe2Icon, Layers3Icon, Network, Palette, PenTool, ServerCog, ShieldCheck, ShoppingBag, Terminal, TestTube2Icon } from '@lucide/astro';

export const categoryIcons: Record<string, any> = {
  cicd: GitMerge,
  containers: Box,
  infrastructure: ServerCog,
  network: Network,
  scripting: Terminal,
  design: Palette,
};

const aliases: Record<string, any> = {
  'gitlab-ci-cd': GitMerge, 'gitlab-runner': GitBranch, playwright: TestTube2Icon,
  'quality-gates': ShieldCheck, rollback: GitBranch, docker: Box, 'docker-compose': Layers3Icon,
  nginx: Globe2Icon, harbor: Box, nexus: Layers3Icon, 'health-checks': ShieldCheck, linux: Terminal,
  'vmware-esxi': ServerCog, vcenter: ServerCog, terraform: Braces, ansible: Braces,
  opnsense: ShieldCheck, vlan: Network, wireguard: ShieldCheck, mikrotik: Network,
  tls: ShieldCheck, dns: Globe2Icon, python: Braces, bash: Terminal, 'technical-runbooks': FileCode2,
  jira: FileCode2, confluence: FileCode2, 'next-js': Braces, typescript: Braces, react: Braces,
  photoshop: Palette, illustrator: PenTool, 'shopping-bag': ShoppingBag,
};

export function skillTechnologyId(label: string) {
  return label.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function technologyIcon(label: string) {
  return aliases[skillTechnologyId(label)] || FileCode2;
}
