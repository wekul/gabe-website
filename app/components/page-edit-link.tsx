"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

type Props = {
  href: string;
};

export default function PageEditLink({ href }: Props) {
  return (
    <div className="page-editor-trigger-wrap">
      <Button as={Link} href={href} className="page-editor-trigger">
        Edit Page
      </Button>
    </div>
  );
}
