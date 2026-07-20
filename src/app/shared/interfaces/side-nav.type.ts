export interface SideNavInterface {
    path: string;
    title: string;
    iconType: "" | "nzIcon" | "fontawesome" | "image";
    iconTheme: "" | "fab" | "far" | "fas" | "fill" | "outline" | "twotone";
    icon: string,
    submenu: SideNavInterface[];
    type: "0" | "1"| "2"
}
