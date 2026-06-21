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
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;
  const panelWidth = Math.min(768, viewportWidth - 32);
  const panelHeight = Math.min(620, viewportHeight * 0.88 - 32);
  const panelTop = Math.min(Math.max(16, viewportHeight * 0.06), 56);
  const panelLeft = Math.max(16, (viewportWidth - panelWidth) / 2);
  const fromTransform = `translate3d(${originRect.left - panelLeft}px, ${originRect.top - panelTop}px, 0) scale(${originRect.width / panelWidth}, ${originRect.height / panelHeight})`;
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

  const panelStyle = {
    top: `${panelTop}px`,
    left: `${panelLeft}px`,
    width: `${panelWidth}px`,
    minHeight: `${panelHeight}px`,
    opacity: entered ? 1 : 0.76,
    transform: entered ? "translate3d(0, 0, 0) scale(1, 1)" : fromTransform
  } as CSSProperties;

  return (
    <div className="reader-backdrop-enter fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <article
        className="reader-panel-transition fixed max-h-[88vh] overflow-y-auto overscroll-contain rounded-[10px] border border-[#344039] bg-[#171d1a] p-0 text-[#f4f1e8] shadow-2xl"
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`reader-panel-content ${entered ? "reader-panel-content-visible" : ""}`}>
          <div className="border-b border-[#29302d] bg-[#121714] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="mt-1 hidden sm:block">
                  <PlanetGlyph size="lg" />
                </span>
                <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#9ba79d]">{cardCopy.archive} / {card.category}</div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">{card.title}</h2>
                {card.sourceTitle ? <p className="mt-2 text-sm text-[#b9b1a3]">{cardCopy.sourceTitle}: {card.sourceTitle}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={cardCopy.close}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#b9b1a3] hover:bg-white/[0.08]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <DetailSection title={cardCopy.overview}>
              <p className="rounded-lg border border-[#344039] bg-[#101412] px-4 py-3 text-sm leading-7 text-[#d8d2c6] shadow-[0_1px_0_rgba(0,0,0,0.2)]">
                {card.summary}
              </p>
            </DetailSection>

            <DetailSection title={cardCopy.keyPoints}>
              <div className="space-y-3">
                {card.keyPoints.slice(0, 3).map((item, index) => {
                  const parsed = parseKeyPoint(item);
                  return (
                    <div key={`${item}-${index}`} className="rounded-lg border border-[#344039] bg-[#101412] px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
                      <div className="flex gap-2 text-sm font-medium">
                        <span className="text-[#9ba79d]">{index + 1}.</span>
                        <span>{parsed.point}</span>
                      </div>
                      {parsed.evidence ? <p className="mt-2 text-sm leading-6 text-[#b9b1a3]">{parsed.evidence}</p> : null}
                    </div>
                  );
                })}
              </div>
            </DetailSection>

            <DetailSection title={cardCopy.insights}>
              <div className="rounded-lg border border-[#344039] bg-[#101412] px-4 py-3 text-sm leading-7 text-[#d8d2c6] shadow-[0_1px_0_rgba(0,0,0,0.2)]">
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
                <span key={tag} className="rounded border border-[#354039] bg-[#202821] px-2 py-1 text-xs text-[#c9c2b6]">{tag}</span>
              ))}
              {card.sourceUrl ? (
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#c9e8f4] hover:bg-white/[0.06]"
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
                    className="rounded-md bg-[#f3b4ac] px-4 py-2 text-sm font-medium text-[#2b1110] disabled:opacity-60"
                  >
                    {deleting ? cardCopy.deleting : cardCopy.confirmDelete}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteError("");
                    }}
                    className="rounded-md border border-[#6b3b3b] px-4 py-2 text-sm text-[#f0c8c8] hover:bg-white/[0.06]"
                  >
                    {cardCopy.cancel}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button onClick={onClose} className="rounded-md bg-[#d9e7c6] px-5 py-2 text-sm font-medium text-[#172018] hover:bg-[#c7dab0]">{cardCopy.close}</button>
              <Link href={`/cards/${card.id}`} className="rounded-md border border-[#354039] px-5 py-2 text-sm text-[#d8d2c6] hover:bg-white/[0.06]">{cardCopy.edit}</Link>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-2 rounded-md border border-[#6b3b3b] px-5 py-2 text-sm text-[#f0c8c8] hover:bg-[#261717]"
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
