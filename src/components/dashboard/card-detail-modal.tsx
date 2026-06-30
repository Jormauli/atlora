"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight, Trash2, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  filterRolePerspectives,
  parseKeyPoint,
  type DashboardCard
} from "@/lib/dashboard/card-view-model";
import { DetailSection } from "./detail-section";
import { PlanetGlyph } from "./planet-glyph";

export type CardOriginRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function CardDetailModal({
  card,
  originRect,
  selectedRoleLabels,
  onClose,
  onDelete
}: {
  card: DashboardCard;
  originRect: CardOriginRect;
  selectedRoleLabels: string[];
  onClose: () => void;
  onDelete: (cardId: string) => void;
}) {
  const { copy } = useLanguage();
  const [entered, setEntered] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight
  }));
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const panelWidth = Math.min(768, viewportWidth - 32);
  const panelHeight = Math.min(620, viewportHeight * 0.88 - 32);
  const panelTop = Math.min(Math.max(16, viewportHeight * 0.06), 56);
  const panelLeft = Math.max(16, (viewportWidth - panelWidth) / 2);
  const fromTransform = `translate3d(calc(-50% + ${originRect.left - panelLeft}px), ${originRect.top - panelTop}px, 0) scale(${originRect.width / panelWidth}, ${originRect.height / panelHeight})`;
  const cardCopy = copy.card;
  const visibleRolePerspectives = filterRolePerspectives(card.rolePerspectives, selectedRoleLabels);

  async function deleteCard() {
    setDeleting(true);
    setDeleteError("");
    const response = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!response.ok) {
      setDeleteError(cardCopy.deleteFailed);
      return;
    }
    onDelete(card.id);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const timer = setTimeout(() => setEntered(true), 40);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  useEffect(() => {
    function updateViewportSize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const panelStyle = {
    top: "clamp(16px, 6vh, 56px)",
    left: "50%",
    width: "min(768px, calc(100vw - 32px))",
    minHeight: "min(620px, calc(88vh - 32px))",
    opacity: entered ? 1 : 0.76,
    transform: entered ? "translate3d(-50%, 0, 0) scale(1, 1)" : fromTransform
  } as CSSProperties;

  return (
    <div className="reader-backdrop-enter fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <article
        className="reader-panel-transition fixed max-h-[88vh] overflow-y-auto overscroll-contain rounded-[10px] border border-[#2f2f2f] bg-[#171717] p-0 text-[#f3f3f1] shadow-2xl"
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`reader-panel-content ${entered ? "reader-panel-content-visible" : ""}`}>
          <div className="border-b border-[#2f2f2f] bg-[#151515] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="mt-1 hidden sm:block">
                  <PlanetGlyph size="lg" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#8f8f8a]">{cardCopy.archive} / {card.category}</div>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight">{card.title}</h2>
                  {card.sourceTitle ? <p className="mt-2 text-sm text-[#b4b4b1]">{cardCopy.sourceTitle}: {card.sourceTitle}</p> : null}
                  <div className="mt-3 flex h-1.5 w-28 overflow-hidden rounded-full bg-[#242424]" aria-hidden="true">
                    <span className="h-full flex-1 bg-[#4f6f8f]" />
                    <span className="h-full flex-1 bg-[#b48745]" />
                    <span className="h-full flex-1 bg-[#9a554b]" />
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={cardCopy.close}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#b4b4b1] hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <DetailSection title={cardCopy.overview}>
              <p className="rounded-lg border border-[#2f2f2f] bg-[#111111] px-4 py-3 text-sm leading-7 text-[#d8d8d5] shadow-[0_1px_0_rgba(0,0,0,0.22)]">
                {card.summary}
              </p>
            </DetailSection>

            <DetailSection title={cardCopy.keyPoints}>
              <div className="space-y-3">
                {card.keyPoints.slice(0, 3).map((item, index) => {
                  const parsed = parseKeyPoint(item);
                  return (
                    <div key={`${item}-${index}`} className="rounded-lg border border-[#2f2f2f] bg-[#111111] px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.22)]">
                      <div className="flex gap-2 text-sm font-medium">
                        <span className="text-[#8f8f8a]">{index + 1}.</span>
                        <span>{parsed.point}</span>
                      </div>
                      {parsed.evidence ? <p className="mt-2 text-sm leading-6 text-[#b4b4b1]">{parsed.evidence}</p> : null}
                    </div>
                  );
                })}
              </div>
            </DetailSection>

            <DetailSection title={cardCopy.insights}>
              <div className="rounded-lg border border-[#2f2f2f] bg-[#111111] px-4 py-3 text-sm leading-7 text-[#d8d8d5] shadow-[0_1px_0_rgba(0,0,0,0.22)]">
                {visibleRolePerspectives.length ? (
                  <ol className="space-y-1">
                    {visibleRolePerspectives.map((item, index) => <li key={`${item}-${index}`}>{index + 1}. {item}</li>)}
                  </ol>
                ) : (
                  <p>{cardCopy.noInsights}</p>
                )}
              </div>
            </DetailSection>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {card.tags.map((tag) => (
                <span key={tag} className="rounded border border-[#2f2f2f] bg-[#242424] px-2 py-1 text-xs text-[#b4b4b1]">{tag}</span>
              ))}
              {card.sourceUrl ? (
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs leading-none text-[#8fb1d1] hover:bg-white/[0.06]"
                >
                  {cardCopy.source}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            {confirmingDelete ? (
              <div className="mt-5 rounded-md border border-[#6b3b3b] bg-[#261717] px-4 py-3 text-sm text-[#f0c8c8]">
                <div className="font-medium">{cardCopy.deleteConfirmTitle}</div>
                <div className="mt-1 text-[#d7aaa8]">{cardCopy.deleteConfirmBody}</div>
                {deleteError ? <div className="mt-2 text-[#ffb4ae]">{deleteError}</div> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={deleteCard}
                    disabled={deleting}
                    className="inline-flex items-center justify-center rounded-md bg-[#f3b4ac] px-4 py-2 text-sm font-medium leading-none text-[#2b1110] disabled:opacity-60"
                  >
                    {deleting ? cardCopy.deleting : cardCopy.confirmDelete}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteError("");
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-[#6b3b3b] px-4 py-2 text-sm leading-none text-[#f0c8c8] hover:bg-white/[0.06]"
                  >
                    {cardCopy.cancel}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button onClick={onClose} className="inline-flex items-center justify-center rounded-md border border-[#4f6f8f] bg-[#e7e7e3] px-5 py-2 text-sm font-medium leading-none text-[#111111] hover:bg-white">{cardCopy.close}</button>
              <Link href={`/cards/${card.id}`} className="inline-flex items-center justify-center rounded-md border border-[#3a3a3a] px-5 py-2 text-sm leading-none text-[#d8d8d5] hover:bg-white/[0.06]">{cardCopy.edit}</Link>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6b3b3b] px-5 py-2 text-sm leading-none text-[#f0c8c8] hover:bg-[#261717]"
              >
                <Trash2 className="h-4 w-4" />
                {cardCopy.delete}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
