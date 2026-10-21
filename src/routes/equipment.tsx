import {createFileRoute,Link} from "@/lib/router-compat";
import {AppShell} from "@/components/app-shell";
export const Route=createFileRoute("/equipment")({component:Equipment});
function Equipment(){return <AppShell title="Equipment"><div className="pulse-card p-6"><h2 className="font-semibold">Equipment tracking is not enabled</h2><p className="mt-2 text-sm text-muted-foreground">No equipment records are available in this release. Use Medical inventory to manage medication stock.</p><Link to="/inventory" className="gp-button mt-4 border">Medical inventory</Link></div></AppShell>;}
