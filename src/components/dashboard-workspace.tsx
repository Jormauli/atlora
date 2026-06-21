"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { CirclePlus, Orbit, Search, Settings, WalletCards } from "lucide-react";
import {
  buildCardFilters,
  filterDashboardCards,
  type DashboardCard,
  type DashboardSort
} from "@/lib/dashboard/card-view-model";
import { brand } from "@/lib/brand";
import { LanguageToggle, useLanguage } from "@/components/language-provider";
import { BrandMark } from "@/components/brand-mark";
import { CardDetailModal, type CardOriginRect } from "./dashboard/card-detail-modal";
import { KnowledgeCard } from "./dashboard/knowledge-card";
import { RoleFilterBar } from "./dashboard/role-filter-bar";
import { SidebarLink } from "./dashboard/sidebar-link";

export function DashboardWorkspace({ cards }: { cards: DashboardCard[] }) {
  const { copy } = useLanguage();
  const [visibleCards, setVisibleCards] = useState(cards);
  const [query, setQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["all"]);
  const [sort, setSort] = useState<DashboardSort>("desc");
  const [expandedCard, setExpandedCard] = useState<{ cardId: string; rect: CardOriginRect } | null>(null);

  const filters = useMemo(() => buildCardFilters(visibleCards), [visibleCards]);
  const filteredCards = useMemo(
    () => filterDashboardCards(visibleCards, { query, selectedRoleIds: selectedRoles, activeTag: "", sort }),
    [visibleCards, query, selectedRoles, sort]
  );

  const selectedCard = visibleCards.find((card) => card.id === expandedCard?.cardId) ?? null;
  const selectedRoleLabels = selectedRoles.includes("all")
    ? ["all"]
    : filters.roles.filter((role) => selectedRoles.includes(role.id)).map((role) => role.label);

  function openCard(cardId: string, event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setExpandedCard({
      cardId,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    });
  }

  function toggleRole(roleId: string) {
    if (roleId === "all") {
      setSelectedRoles(["all"]);
      return;
    }

    setSelectedRoles([roleId]);
  }

  function removeCardFromView(cardId: string) {
    setExpandedCard(null);
    setVisibleCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
  }

  return (
    <div className="min-h-screen bg-[#101412] text-[#f4f1e8]">
      <div className="flex min-h-screen">
        <DashboardSidebar cards={visibleCards.slice(0, 4)} cardCount={visibleCards.length} query={query} onQueryChange={setQuery} onOpenCard={openCard} />

        <main className="starfield-surface min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">{copy.dashboard.eyebrow}</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">{copy.product.subtitle}</h1>
              <p className="mt-1 text-sm text-[#b9b1a3]">{copy.product.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Link
                href="/new"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#d9e7c6] px-3 text-sm font-medium text-[#172018] hover:bg-[#c7dab0]"
              >
                <CirclePlus className="h-4 w-4" />
                {copy.navigation.newCard}
              </Link>
            </div>
          </header>

          <RoleFilterBar roles={filters.roles} selectedRoles={selectedRoles} onToggle={toggleRole} />

          <FilterToolbar
            query={query}
            selectedRoles={selectedRoles}
            sort={sort}
            onQueryChange={setQuery}
            onSortChange={setSort}
            copy={copy}
          />

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <KnowledgeCard key={card.id} card={card} onOpen={(event) => openCard(card.id, event)} />
            ))}
          </section>

          {filteredCards.length === 0 ? (
            <div className="mt-10 rounded-md border border-dashed border-[#3d4741] bg-[#171d1a] p-8 text-center text-sm text-[#b9b1a3]">
              {copy.dashboard.empty}
            </div>
          ) : null}
        </main>
      </div>

      {selectedCard && expandedCard ? (
        <CardDetailModal
          card={selectedCard}
          originRect={expandedCard.rect}
          selectedRoleLabels={selectedRoleLabels}
          onClose={() => setExpandedCard(null)}
          onDelete={removeCardFromView}
        />
      ) : null}
    </div>
  );
}

function DashboardSidebar({
  cards,
  cardCount,
  query,
  onQueryChange,
  onOpenCard
}: {
  cards: DashboardCard[];
  cardCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenCard: (cardId: string, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const { copy } = useLanguage();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[#29302d] bg-[#151918] px-3 py-4 lg:block">
      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-[#f4f1e8] hover:bg-white/[0.06]">
        <BrandMark className="h-6 w-6 shrink-0" />
        <span>
          <span className="block leading-tight">{brand.name.en}</span>
          <span className="block text-xs font-normal text-[#a9b1a9]">{copy.product.subtitle}</span>
        </span>
      </Link>
      <div className="mt-3 flex items-center rounded-md border border-[#354039] bg-[#101412] px-2 py-1.5 text-sm text-[#c9c2b6]">
        <Search className="mr-2 h-4 w-4" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.dashboard.search}
          className="w-full bg-transparent outline-none placeholder:text-[#7f897f]"
        />
      </div>
      <nav className="mt-4 space-y-1 text-sm">
        <SidebarLink href="/new" icon={<CirclePlus className="h-4 w-4" />} label={copy.navigation.newMaterial} shortcut="⌘N" />
        <SidebarLink href="/dashboard" icon={<Orbit className="h-4 w-4" />} label={copy.navigation.library} badge={cardCount} active />
        <SidebarLink href="/usage" icon={<WalletCards className="h-4 w-4" />} label={copy.navigation.usage} shortcut="M" />
        <SidebarLink href="/settings" icon={<Settings className="h-4 w-4" />} label={copy.navigation.settings} />
      </nav>
      <div className="mt-8 px-2 text-xs font-medium text-[#7f897f]">{copy.navigation.recent}</div>
      <div className="mt-2 space-y-1">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={(event) => onOpenCard(card.id, event)}
            className="line-clamp-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-[#b9b1a3] hover:bg-white/[0.06]"
          >
            {card.title}
          </button>
        ))}
      </div>
    </aside>
  );
}

function FilterToolbar({
  query,
  selectedRoles,
  sort,
  onQueryChange,
  onSortChange,
  copy
}: {
  query: string;
  selectedRoles: string[];
  sort: DashboardSort;
  onQueryChange: (value: string) => void;
  onSortChange: (value: DashboardSort) => void;
  copy: ReturnType<typeof useLanguage>["copy"];
}) {
  return (
    <section className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-[210px_1fr]">
        <label className="flex min-w-0 items-center gap-2 text-sm text-[#b9b1a3]">
          {copy.dashboard.sort}
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as DashboardSort)}
            className="h-8 rounded border border-[#354039] bg-[#171d1a] px-2 text-sm text-[#f4f1e8] outline-none"
          >
            <option value="desc">{copy.dashboard.newest}</option>
            <option value="asc">{copy.dashboard.oldest}</option>
          </select>
        </label>
        <label className="flex h-8 min-w-0 items-center rounded border border-[#354039] bg-[#171d1a] px-2 text-sm text-[#b9b1a3]">
          <Search className="mr-2 h-4 w-4" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={selectedRoles.includes("all") ? copy.dashboard.searchAll : copy.dashboard.searchSelected}
            className="w-full bg-transparent outline-none placeholder:text-[#7f897f]"
          />
        </label>
      </div>
    </section>
  );
}
