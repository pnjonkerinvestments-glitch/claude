export const FOLLOW_UP:Record<string,string>={flags:'capitals',capitals:'flags',trail:'pinpoint',pinpoint:'borders',borders:'order',order:'trail',daily:'flags',mixed:'flags',compare:'flags',mosaic:'capitals'};
export function nextMode(mode:string) {return FOLLOW_UP[mode] ?? 'flags';}
