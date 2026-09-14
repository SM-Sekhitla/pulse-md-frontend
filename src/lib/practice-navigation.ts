import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserPlus,
  Stethoscope,
  Pill,
  FileText,
  Package,
  Wrench,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Globe,
} from "lucide-react";
import { tenantEnabledModules } from "@/lib/modules";
import type { ModuleKey, TenantOut } from "@/types/tenant";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleKey;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const OWNER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      {
        to: "/calendar",
        label: "Calendar",
        icon: Calendar,
        module: "calendar",
      },
    ],
  },
  {
    label: "Patients",
    items: [
      {
        to: "/patients",
        label: "All patients",
        icon: Users,
        module: "patients",
      },
      {
        to: "/patients/new",
        label: "New patient",
        icon: UserPlus,
        module: "patients",
      },
    ],
  },
  {
    label: "Clinical",
    items: [
      {
        to: "/appointments",
        label: "Appointments",
        icon: Stethoscope,
        module: "appointments",
      },
      {
        to: "/prescriptions",
        label: "Prescriptions",
        icon: Pill,
        module: "prescriptions",
      },
      {
        to: "/sick-notes",
        label: "Sick notes",
        icon: FileText,
        module: "sick_notes",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/inventory",
        label: "Medical inventory",
        icon: Package,
        module: "inventory",
      },
      {
        to: "/equipment",
        label: "Equipment",
        icon: Wrench,
        module: "equipment",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        to: "/billing",
        label: "Billing & invoices",
        icon: Receipt,
        module: "billing",
      },
      {
        to: "/reports",
        label: "Financial reports",
        icon: BarChart3,
        module: "reports",
      },
    ],
  },
  {
    label: "Practice",
    items: [
      { to: "/staff", label: "Staff & roles", icon: UserCog, module: "staff" },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const RECEPTIONIST_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Patients",
    items: [
      {
        to: "/patients",
        label: "All patients",
        icon: Users,
        module: "patients",
      },
      {
        to: "/patients/new",
        label: "New patient",
        icon: UserPlus,
        module: "patients",
      },
    ],
  },
  {
    label: "Appointments",
    items: [
      {
        to: "/calendar",
        label: "Calendar",
        icon: Calendar,
        module: "calendar",
      },
      {
        to: "/appointments",
        label: "Appointments",
        icon: Stethoscope,
        module: "appointments",
      },
    ],
  },
];

export function practiceModules(
  tenant: TenantOut | null,
  role?: string,
): Set<ModuleKey> {
  // Preserve the existing navigation fallback while practice data is unavailable.
  // A missing tenant record is not an explicitly empty module selection.
  const modules = tenantEnabledModules(tenant);
  return new Set(
    role === "receptionist"
      ? modules.filter((module) =>
          ["patients", "appointments", "calendar"].includes(module),
        )
      : modules,
  );
}

export function practiceNavigation(
  tenant: TenantOut | null,
  role?: string,
): NavGroup[] {
  const enabled = practiceModules(tenant, role);
  const base = role === "receptionist" ? RECEPTIONIST_NAV : OWNER_NAV;
  const groups = base
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.module || enabled.has(item.module),
      ),
    }))
    .filter((group) => group.items.length);
  if (tenant?.bookingEnabled)
    groups.push({
      label: "Online bookings",
      items: [
        { to: "/booking/inbox", label: "Bookings inbox", icon: Globe },
        { to: "/booking/availability", label: "Availability", icon: Calendar },
        ...(role !== "receptionist"
          ? [{ to: "/booking/profile", label: "Public profile", icon: UserCog }]
          : []),
      ],
    });
  return groups;
}
