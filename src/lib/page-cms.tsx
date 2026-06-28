import { PageKey, PublishStatus, type Page, type PageSection, type PageSectionItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CmsSection = PageSection & { items: PageSectionItem[] };
export type CmsPage = Page & { sections: CmsSection[] };

export async function getPublishedPage(pageKey: PageKey) {
  return prisma.page.findFirst({
    where: { pageKey, status: PublishStatus.PUBLISHED },
    include: {
      sections: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });
}

export async function getAdminPage(pageKey: PageKey) {
  return prisma.page.findUnique({
    where: { pageKey },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } }
      }
    }
  });
}

export function sectionByKey(page: CmsPage | null, key: string) {
  return page?.sections.find((section) => section.sectionKey === key) ?? null;
}

export function settings<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...fallback, ...(value as T) } : fallback;
}

export function lines(value?: string | null) {
  return String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
}

export function MarkdownBlock({ value }: { value?: string | null }) {
  const blocks = String(value ?? "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block) => {
        const rows = block.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
        if (rows.every((row) => row.startsWith("- "))) {
          return <ul key={block}>{rows.map((row) => <li key={row} dangerouslySetInnerHTML={{ __html: inlineMarkdown(row.slice(2)) }} />)}</ul>;
        }
        if (rows.every((row) => /^\d+\.\s/.test(row))) {
          return <ol key={block}>{rows.map((row) => <li key={row} dangerouslySetInnerHTML={{ __html: inlineMarkdown(row.replace(/^\d+\.\s/, "")) }} />)}</ol>;
        }
        if (block.startsWith("### ")) return <h3 key={block} dangerouslySetInnerHTML={{ __html: inlineMarkdown(block.slice(4)) }} />;
        if (block.startsWith("## ")) return <h2 key={block} dangerouslySetInnerHTML={{ __html: inlineMarkdown(block.slice(3)) }} />;
        return <p key={block} dangerouslySetInnerHTML={{ __html: inlineMarkdown(block) }} />;
      })}
    </>
  );
}

