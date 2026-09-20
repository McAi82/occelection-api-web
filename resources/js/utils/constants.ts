// src/utils/constants.ts
import { Building2, Users, type LucideIcon } from "lucide-react";

export const ELECTION_TYPES: Record<
    string,
    {
        name: string;
        icon: LucideIcon;
        color: string;
        bgColor: string;
    }
> = {
    CSG: {
        name: "Central Student Government",
        icon: Building2,
        color: "bg-blue-600",
        bgColor: "bg-blue-100",
    },
    SBO: {
        name: "Student Body Organization",
        icon: Users,
        color: "bg-green-600",
        bgColor: "bg-green-100",
    },
};
