"use client";

import React from "react";
import { SrdavoLiquidMenu, type LiquidTabItem, type SrdavoLiquidMenuProps } from "./SrdavoLiquidMenu";

export type NavItem = LiquidTabItem;
export type AppleLiquidNavProps = SrdavoLiquidMenuProps;

export function AppleLiquidNav(props: AppleLiquidNavProps) {
  return <SrdavoLiquidMenu {...props} />;
}

export default AppleLiquidNav;
